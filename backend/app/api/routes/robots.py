from fastapi import APIRouter
from typing import List
from app.models.robot import Robot
from app.services.simulation import sim
from app.services.path_planner import planner

router = APIRouter()

@router.get("/robots", response_model=List[Robot])
def get_robots():
    return list(sim.robots.values())

@router.post("/robots", response_model=Robot)
def create_robot(robot: Robot):
    sim.robots[robot.id] = robot
    if not robot.path:
        robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
    return robot
