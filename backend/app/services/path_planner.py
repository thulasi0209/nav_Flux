import heapq
import os
from typing import Dict, List, Optional
from app.models.lane import Lane, LaneType, SafetyLevel

ALPHA = float(os.environ.get("CONGESTION_ALPHA", 3.0))


def set_alpha(value: float):
    global ALPHA
    ALPHA = float(value)


def get_alpha() -> float:
    return ALPHA


class PathPlanner:
    def __init__(self):
        self.adj_list: Dict[str, List[Lane]] = {}

    def load_graph(self, lanes: List[Lane]):
        self.adj_list.clear()
        for lane in lanes:
            if lane.start_node not in self.adj_list:
                self.adj_list[lane.start_node] = []
            if lane.end_node not in self.adj_list:
                self.adj_list[lane.end_node] = []
            self.adj_list[lane.start_node].append(lane)

    def set_alpha(self, value: float):
        set_alpha(value)

    def calculate_cost(self, lane: Lane) -> float:
        base_cost = 10.0 / max(lane.speed_limit, 0.1)
        congestion_cost = lane.congestion_score * ALPHA

        safety_cost = 0.0
        if lane.safety_level == SafetyLevel.LOW:
            safety_cost = 5.0
        elif lane.safety_level == SafetyLevel.MEDIUM:
            safety_cost = 2.0

        type_mult = 1.0
        if lane.lane_type == LaneType.HUMAN_ZONE:
            type_mult = 5.0
        elif lane.lane_type == LaneType.NARROW:
            type_mult = 2.0

        return (base_cost + congestion_cost + safety_cost) * type_mult

    def calculate_floor_cost(self, lane: Lane) -> float:
        """Lower-bound cost of traversing `lane`: same as calculate_cost but
        assuming zero congestion (congestion_score = 0). Since congestion_score
        is always >= 0 and ALPHA is non-negative, this is <= the true cost of
        the lane under any congestion state, making it safe to use as the basis
        for an admissible A* heuristic regardless of the current ALPHA value."""
        base_cost = 10.0 / max(lane.speed_limit, 0.1)

        safety_cost = 0.0
        if lane.safety_level == SafetyLevel.LOW:
            safety_cost = 5.0
        elif lane.safety_level == SafetyLevel.MEDIUM:
            safety_cost = 2.0

        type_mult = 1.0
        if lane.lane_type == LaneType.HUMAN_ZONE:
            type_mult = 5.0
        elif lane.lane_type == LaneType.NARROW:
            type_mult = 2.0

        return (base_cost + safety_cost) * type_mult

    def _compute_heuristics(self, goal_node: str) -> Dict[str, float]:
        """Backward Dijkstra from goal_node over the reversed graph, using
        calculate_floor_cost as edge weight. Returns h(n) = shortest possible
        remaining cost from n to goal_node assuming zero congestion anywhere,
        for every node reachable from n. Nodes with no path to goal are left
        out (treated as +inf by callers via .get(node, ...))."""
        reverse_adj: Dict[str, List[tuple]] = {}
        for u, edges in self.adj_list.items():
            for lane in edges:
                v = lane.end_node
                reverse_adj.setdefault(v, []).append((u, self.calculate_floor_cost(lane)))

        h: Dict[str, float] = {goal_node: 0.0}
        pq = [(0.0, goal_node)]
        visited = set()

        while pq:
            d, node = heapq.heappop(pq)
            if node in visited:
                continue
            visited.add(node)
            for neighbor, cost in reverse_adj.get(node, []):
                nd = d + cost
                if nd < h.get(neighbor, float('inf')):
                    h[neighbor] = nd
                    heapq.heappush(pq, (nd, neighbor))

        return h

    def find_path(self, start_node: str, goal_node: str) -> Optional[List[str]]:
        if start_node not in self.adj_list or goal_node not in self.adj_list:
            return None

        h = self._compute_heuristics(goal_node)

        open_set = []
        heapq.heappush(open_set, (h.get(start_node, 0.0), 0.0, start_node, [start_node]))
        g_scores = {start_node: 0.0}

        while open_set:
            f, current_g, current_node, path = heapq.heappop(open_set)

            if current_node == goal_node:
                return path

            if current_g > g_scores.get(current_node, float('inf')):
                continue

            for edge in self.adj_list.get(current_node, []):

                tentative_g = current_g + self.calculate_cost(edge)
                neighbor = edge.end_node

                if tentative_g < g_scores.get(neighbor, float('inf')):
                    g_scores[neighbor] = tentative_g
                    f_score = tentative_g + h.get(neighbor, 0.0)
                    heapq.heappush(open_set, (f_score, tentative_g, neighbor, path + [neighbor]))

        return None

planner = PathPlanner()
