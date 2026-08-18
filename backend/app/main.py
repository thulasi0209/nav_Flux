import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import simulation, map as map_routes, robots, heatmap, config
from app.services.simulation import sim
from app.services.traffic_controller import traffic_manager
from app.services.heatmap import heatmap as heatmap_tracker
from app.services.path_planner import planner
from app.models.robot import RobotStatus
from app.models.lane import Lane

connections: List[WebSocket] = []


def load_default_map():
    """planner.adj_list starts empty — nothing else in the codebase ever calls
    load_graph(), so without this the server has no lane graph at all."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    map_path = os.path.join(base_dir, "data", "sample_map.json")
    if os.path.exists(map_path):
        with open(map_path) as f:
            data = json.load(f)
        lanes = [Lane(**edge) for edge in data.get("edges", [])]
        planner.load_graph(lanes)


def build_snapshot() -> dict:
    robots_out = []
    for r in sim.robots.values():
        next_node = r.current_node
        if r.path and r.current_node in r.path:
            idx = r.path.index(r.current_node)
            if idx + 1 < len(r.path):
                next_node = r.path[idx + 1]

        # Robot lane-exit threshold is 0.5 (see SimulationLoop.step); normalize to [0, 1]
        raw_progress = sim.progress.get(r.id, 0.0)
        progress_norm = min(1.0, raw_progress / 0.5) if raw_progress else 0.0

        robots_out.append({
            "id": r.id,
            "current_node": r.current_node,
            "next_node": next_node,
            "progress": progress_norm,
            "status": r.status.value.upper(),
            "battery_level": r.battery,
            "speed": r.speed,
        })

    lane_occupancy: Dict[str, int] = {}
    for lane_id in traffic_manager.occupancies.values():
        lane_occupancy[lane_id] = lane_occupancy.get(lane_id, 0) + 1

    charging_here = [
        r.id for r in sim.robots.values()
        if r.status == RobotStatus.CHARGING and r.current_node == "A"
    ]
    hubs = [{
        "id": "A",
        "units": charging_here,
        "status": "OPERATIONAL" if len(charging_here) < 4 else "CONGESTED",
    }]

    return {
        "type": "SIMULATION_UPDATE",
        "robots": robots_out,
        "activeCount": len(sim.robots),
        "resolvedCount": sim.completed_goal_count,
        "heatmap": heatmap_tracker.get_data(),
        "lanes": lane_occupancy,
        "hubs": hubs,
    }


async def broadcast_loop():
    while True:
        if connections:
            payload = build_snapshot()
            dead = []
            for ws in connections:
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                if ws in connections:
                    connections.remove(ws)
        await asyncio.sleep(0.3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_default_map()
    task = asyncio.create_task(broadcast_loop())
    yield
    task.cancel()


app = FastAPI(title="Advanced Robot Simulation HUB", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router)
app.include_router(map_routes.router)
app.include_router(robots.router)
app.include_router(heatmap.router)
app.include_router(config.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/stream")
async def stream(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
