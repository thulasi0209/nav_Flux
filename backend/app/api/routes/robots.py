from fastapi import APIRouter, Depends
from typing import List
from app.models.robot import Robot
from app.services.simulation import sim
from app.services.path_planner import planner
from app.core.security import require_api_key

router = APIRouter()

@router.get("/robots", response_model=List[Robot])
def get_robots():
    return list(sim.robots.values())

@router.post("/robots", response_model=Robot, dependencies=[Depends(require_api_key)])
def create_robot(robot: Robot):
    sim.robots[robot.id] = robot
    if not robot.path:
        robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
    return robot
