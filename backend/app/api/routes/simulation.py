from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import random
from app.models.robot import Robot, RobotStatus
from app.services.simulation import sim, set_drain_rate, set_charge_rate
from app.services.traffic_controller import traffic_manager, LANE_CAPACITY
from app.services.path_planner import planner
from app.core.security import require_api_key

router = APIRouter(prefix="/simulate", tags=["Simulation"])

class GenericResponse(BaseModel):
    status: str

class ParamsRequest(BaseModel):
    drain_rate: Optional[float] = None
    charge_rate: Optional[float] = None

class RobotState(BaseModel):
    id: str
    current_lane: Optional[str]
    position: str
    speed: float
    state: str
    entry_allowed: bool   # True if robot is moving; False if blocked by capacity
    entry_type: str       # "stay" | "entered" | "blocked"

class LaneState(BaseModel):
    lane_id: str
    usage_count: int
    congestion_score: float
    current_occupancy: int  # robots currently on this lane
    capacity: int           # max robots allowed
    is_full: bool           # current_occupancy >= capacity

class StepResponse(BaseModel):
    step: int
    robots: List[RobotState]
    lanes: List[LaneState]
    system_valid: bool      # True if NO lane exceeds capacity

@router.post("/start", response_model=GenericResponse, dependencies=[Depends(require_api_key)])
def start_simulation():
    # Always reload robots fresh on every /start call
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    rob_path = os.path.join(base_dir, "data", "sample_robots.json")
    if os.path.exists(rob_path):
        with open(rob_path, "r") as f:
            rob_data = json.load(f)
            robots = [Robot(**r) for r in rob_data]
            sim.load_robots(robots)

    # Clear ALL stale traffic state between runs
    traffic_manager.occupancies.clear()
    traffic_manager.waiting.clear()
    traffic_manager.deadlock_count = 0

    # Reset lane stats
    for edges in planner.adj_list.values():
        for edge in edges:
            edge.congestion_score = 0.0
            edge.usage_count = 0
            edge.is_reserved = False

    sim.start()
    return {"status": f"Simulation started with {len(sim.robots)} robots"}


@router.post("/reset", response_model=GenericResponse, dependencies=[Depends(require_api_key)])
def reset_simulation(n: int = 8):
    nodes = list(planner.adj_list.keys()) or ["A", "B", "C", "D"]

    robots = []
    for i in range(max(1, n)):
        start_node = random.choice(nodes)
        goal_node = random.choice([x for x in nodes if x != start_node] or [start_node])
        robots.append(Robot(
            id=f"R{i+1}",
            current_node=start_node,
            goal_node=goal_node,
            status=RobotStatus.MOVING,
            battery=100.0,
            path=[]
        ))
    sim.load_robots(robots)

    traffic_manager.occupancies.clear()
    traffic_manager.waiting.clear()
    traffic_manager.deadlock_count = 0

    for edges in planner.adj_list.values():
        for edge in edges:
            edge.congestion_score = 0.0
            edge.usage_count = 0
            edge.is_reserved = False

    sim.start()
    return {"status": f"Simulation reset with {len(sim.robots)} robots"}


@router.post("/step", response_model=StepResponse)
def step_simulation():
    # Snapshot each robot's lane BEFORE the step runs
    prev_occupancies = dict(traffic_manager.occupancies)  # robot_id -> lane_id

    if sim.running:
        sim.step()

    # Compute live occupancy per lane from authoritative source
    lane_occupancy: dict = {}
    for lane_id in traffic_manager.occupancies.values():
        lane_occupancy[lane_id] = lane_occupancy.get(lane_id, 0) + 1

    # Build robot states with accurate entry_type from before/after comparison
    robots_data = []
    for r in sim.robots.values():
        current_lane = traffic_manager.occupancies.get(r.id)
        prev_lane = prev_occupancies.get(r.id)
        is_moving = (r.status.value == "moving")

        # Derive entry_type purely from state transition:
        #   blocked  → robot is waiting (capacity denied entry)
        #   stay     → robot stopped at goal, or same lane as last step
        #   entered  → robot moved to a different (new) lane this step
        status = r.status.value
        if status == "waiting":
            entry_type = "blocked"
        elif status == "stopped" or prev_lane == current_lane:
            entry_type = "stay"
        else:
            entry_type = "entered"

        robots_data.append(RobotState(
            id=r.id,
            current_lane=current_lane,
            position=r.current_node,
            speed=r.speed,
            state=r.status.value,
            entry_allowed=is_moving,
            entry_type=entry_type
        ))


    # Build lane states with validation fields
    lanes_data = []
    visited_lanes = set()
    system_valid = True

    for edges in planner.adj_list.values():
        for edge in edges:
            if edge.id not in visited_lanes:
                visited_lanes.add(edge.id)
                occupancy = lane_occupancy.get(edge.id, 0)
                is_full = occupancy >= LANE_CAPACITY
                if occupancy > LANE_CAPACITY:
                    system_valid = False  # flag any violation
                lanes_data.append(LaneState(
                    lane_id=edge.id,
                    usage_count=edge.usage_count,
                    congestion_score=round(edge.congestion_score, 3),
                    current_occupancy=occupancy,
                    capacity=LANE_CAPACITY,
                    is_full=is_full
                ))

    return StepResponse(
        step=getattr(sim, "step_count", 0),
        robots=robots_data,
        lanes=lanes_data,
        system_valid=system_valid
    )

@router.post("/params", response_model=GenericResponse, dependencies=[Depends(require_api_key)])
def set_params(params: ParamsRequest):
    if params.drain_rate is not None:
        if params.drain_rate <= 0:
            raise HTTPException(status_code=400, detail="drain_rate must be positive")
        set_drain_rate(params.drain_rate)
    if params.charge_rate is not None:
        if params.charge_rate <= 0:
            raise HTTPException(status_code=400, detail="charge_rate must be positive")
        set_charge_rate(params.charge_rate)
    return {"status": "Battery params updated"}


@router.get("/metrics")
def get_metrics():
    moving_count = len([r for r in sim.robots.values() if r.status.value == "moving"])

    completed = sim.completed_goal_count
    avg_wait_time = (
        sum(sim.completed_trip_wait_times) / len(sim.completed_trip_wait_times)
        if sim.completed_trip_wait_times else None
    )
    avg_path_length = (
        sum(sim.completed_path_lengths) / len(sim.completed_path_lengths)
        if sim.completed_path_lengths else None
    )
    throughput = (
        completed / sim.step_count * 100
        if sim.step_count > 0 else None
    )
    avg_travel_time = (
        sum(sim.completed_travel_times) / len(sim.completed_travel_times)
        if sim.completed_travel_times else None
    )
    max_travel_time = max(sim.completed_travel_times) if sim.completed_travel_times else None

    return {
        "avg_wait_time": avg_wait_time,
        "throughput": throughput,
        "deadlock_count": traffic_manager.deadlock_count,
        "blocked_attempts": sim.total_blocked_attempts,
        "avg_path_length": avg_path_length,
        "avg_travel_time": avg_travel_time,
        "max_travel_time": max_travel_time,
        "completed_goals": completed,
        "steps_elapsed": sim.step_count,
        "robots": {
            "total": len(sim.robots),
            "moving": moving_count
        }
    }
