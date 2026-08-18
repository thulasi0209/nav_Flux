from fastapi import APIRouter
from app.models.graph import Graph
from app.services.path_planner import planner

router = APIRouter()

@router.get("/map", response_model=Graph)
def get_map():
    nodes = list(planner.adj_list.keys())
    edges = []
    for lane_list in planner.adj_list.values():
        edges.extend(lane_list)
    return Graph(nodes=nodes, edges=edges)
