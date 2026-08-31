from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.heatmap import heatmap

router = APIRouter()

@router.get("/heatmap")
def get_heatmap() -> List[Dict[str, Any]]:
    return heatmap.get_data()
