from enum import Enum
from pydantic import BaseModel
from typing import List, Optional

class RobotStatus(str, Enum):
    IDLE = "idle"
    WAITING = "waiting"
    MOVING = "moving"
    STOPPED = "stopped"
    CHARGING = "charging"

class Robot(BaseModel):
    id: str
    current_node: str
    goal_node: str
    speed: float = 1.0
    status: RobotStatus = RobotStatus.IDLE
    path: List[str] = []
    battery: float = 100.0
