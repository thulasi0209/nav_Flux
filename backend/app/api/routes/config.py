from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
from app.models.robot import Robot, RobotStatus
from app.services.simulation import sim
from app.services.path_planner import planner

router = APIRouter(prefix="/api", tags=["Config"])

class ConfigRequest(BaseModel):
    robotCount: int
    density: str

@router.post("/config")
def setup_config(config: ConfigRequest):
    if config.robotCount <= 0 or config.robotCount > 25:
        raise HTTPException(status_code=400, detail="Robot count must be between 1 and 25")
    
    if config.density not in ["LOW", "MEDIUM", "HIGH"]:
        raise HTTPException(status_code=400, detail="Invalid traffic density")

    # Set density
    sim.set_environment_params(config.density)

    # Dynamically spawn robots
    nodes = list(planner.adj_list.keys())
    if not nodes:
        # Fallback if map not loaded yet
        nodes = ["A", "B", "C", "D"]

    robots = []
    for i in range(config.robotCount):
        start_node = random.choice(nodes)
        goal_node = random.choice([n for n in nodes if n != start_node] or [start_node])
        
        robot = Robot(
            id=f"R{i+1}",
            current_node=start_node,
            goal_node=goal_node,
            status=RobotStatus.MOVING,
            battery=100.0,
            path=[]
        )
        robots.append(robot)

    sim.load_robots(robots)
    sim.start()

    return {"status": "Config applied and simulation started"}
