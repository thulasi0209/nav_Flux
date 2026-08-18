from pydantic import BaseModel
from typing import List
from .lane import Lane

class Graph(BaseModel):
    nodes: List[str]
    edges: List[Lane]
