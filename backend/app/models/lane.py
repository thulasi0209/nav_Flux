from enum import Enum
from pydantic import BaseModel
from typing import Optional

class LaneType(str, Enum):
    NORMAL = "NORMAL"
    INTERSECTION = "INTERSECTION"
    NARROW = "NARROW"
    HUMAN_ZONE = "HUMAN_ZONE"

class SafetyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Lane(BaseModel):
    id: str
    start_node: str
    end_node: str
    speed_limit: float = 1.0
    lane_type: LaneType = LaneType.NORMAL
    safety_level: SafetyLevel = SafetyLevel.MEDIUM
    congestion_score: float = 0.0
    usage_count: int = 0
    is_reserved: bool = False
