from typing import Dict, List
from app.models.robot import Robot, RobotStatus
from app.models.lane import Lane

LANE_CAPACITY = 2  # Single source of truth — used here and imported by simulation.py

class TrafficController:
    def __init__(self):
        self.occupancies: Dict[str, str] = {}  # robot_id -> lane_id
        self.waiting: Dict[str, str] = {}       # robot_id -> lane_id (blocked waiting)
        self.deadlock_count: int = 0            # cycles actually detected + resolved

    # Pure registration — capacity already checked by simulation before calling this
    def register_entry(self, robot: Robot, lane: Lane):
        self.occupancies[robot.id] = lane.id
        self.waiting.pop(robot.id, None)

    # Pure release — remove robot from lane tracking
    def release_lane(self, robot_id: str, lane: Lane):
        if self.occupancies.get(robot_id) == lane.id:
            del self.occupancies[robot_id]
        # Update is_reserved based on remaining occupants
        occupant_count = sum(1 for l in self.occupancies.values() if l == lane.id)
        lane.is_reserved = (occupant_count >= LANE_CAPACITY)

    # Speed: base * (1 - congestion), clamped to [min_speed, speed_limit]
    def adjust_speed(self, robot: Robot, lane: Lane):
        min_speed = 0.2
        speed = lane.speed_limit * (1.0 - lane.congestion_score)

        if lane.safety_level.value == "HIGH":
            speed *= 0.6
        elif lane.safety_level.value == "MEDIUM":
            speed *= 0.8

        robot.speed = max(min_speed, float(speed))

    def check_deadlock(self):
        deps = {}
        for w_rob, w_lane in self.waiting.items():
            for o_rob, o_lane in self.occupancies.items():
                if w_lane == o_lane:
                    deps[w_rob] = o_rob

        visited, stack = set(), set()

        def dfs(node, path):
            visited.add(node)
            stack.add(node)
            path.append(node)
            target = deps.get(node)
            if target:
                if target in stack:
                    return path[path.index(target):]
                elif target not in visited:
                    cycle = dfs(target, path)
                    if cycle:
                        return cycle
            stack.remove(node)
            path.pop()
            return None

        for node in deps:
            if node not in visited:
                cycle = dfs(node, [])
                if cycle:
                    self.resolve_deadlock(cycle)
                    break

    def resolve_deadlock(self, cycle_robots: List[str]):
        if cycle_robots:
            self.waiting.pop(cycle_robots[0], None)
            self.deadlock_count += 1

traffic_manager = TrafficController()
