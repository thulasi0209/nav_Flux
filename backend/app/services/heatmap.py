from typing import Dict, Any, List
from app.models.lane import Lane
from app.services.path_planner import planner

class HeatmapTracker:
    def track_usage(self, lane: Lane):
        lane.usage_count += 1
        
    def recalculate_congestion(self):
        from app.services.traffic_controller import traffic_manager, LANE_CAPACITY

        robots_on_lane = {}
        for l_id in traffic_manager.occupancies.values():
            robots_on_lane[l_id] = robots_on_lane.get(l_id, 0) + 1

        lane_capacity = float(LANE_CAPACITY)

        for edges in planner.adj_list.values():
            for lane in edges:
                active_count = robots_on_lane.get(lane.id, 0)
                lane.congestion_score = min(1.0, float(active_count) / lane_capacity)
                    
    def get_data(self) -> List[Dict[str, Any]]:
        data = []
        for edges in planner.adj_list.values():
            for edge in edges:
                data.append({
                    "lane_id": edge.id,
                    "speed_limit": edge.speed_limit,
                    "safety_level": edge.safety_level.value,
                    "lane_type": edge.lane_type.value,
                    "usage_count": edge.usage_count,
                    "congestion_score": edge.congestion_score
                })
        return data

heatmap = HeatmapTracker()
