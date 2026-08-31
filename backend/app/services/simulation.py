from typing import Dict, List, Optional
from app.models.robot import Robot, RobotStatus
from app.services.path_planner import planner
from app.services.traffic_controller import traffic_manager, LANE_CAPACITY
from app.services.heatmap import heatmap

CHARGING_HUBS = ["A", "E"]
HUB_CAPACITY = 4  # max robots actively charging at one hub simultaneously

DRAIN_RATE = 1.0   # battery % lost per tick while moving / en route to a hub
CHARGE_RATE = 10.0  # battery % gained per tick while docked with a free slot


def set_drain_rate(value: float):
    global DRAIN_RATE
    DRAIN_RATE = float(value)


def set_charge_rate(value: float):
    global CHARGE_RATE
    CHARGE_RATE = float(value)


class SimulationLoop:
    def __init__(self):
        self.robots: Dict[str, Robot] = {}
        self.progress: Dict[str, float] = {}
        self.entry_types: Dict[str, str] = {}  # robot_id -> "stay"|"entered"|"blocked"
        self.running = False
        self.step_count = 0
        
        # Traffic density params
        self.wait_time = 0
        self.replan_threshold = 0.9
        self.enable_queue = False

        # ── Metrics (reset on start(), accumulate across step() calls) ──────────
        self.total_blocked_attempts = 0          # cumulative entry_type=="blocked" events
        self.wait_ticks_current: Dict[str, int] = {}   # robot_id -> blocked ticks since last goal
        self.completed_trip_wait_times: List[int] = []  # one entry per completed goal
        self.completed_goal_count = 0
        self.completed_path_lengths: List[int] = []     # edges per completed trip
        self.trip_start_step: Dict[str, int] = {}       # robot_id -> step_count when current goal was assigned
        self.completed_travel_times: List[int] = []     # ticks from goal-assignment to arrival, per completed trip

    def set_environment_params(self, density: str):
        if density == "LOW":
            self.wait_time = 0
            self.replan_threshold = 0.9
            self.enable_queue = False
        elif density == "MEDIUM":
            self.wait_time = 1
            self.replan_threshold = 0.6
            self.enable_queue = False
        elif density == "HIGH":
            self.wait_time = 2
            self.replan_threshold = 0.3
            self.enable_queue = True

    def load_robots(self, robots: List[Robot]):
        self.robots.clear()
        self.progress.clear()
        for r in robots:
            self.robots[r.id] = r
            self.progress[r.id] = 0.0
            if not r.path:
                r.path = planner.find_path(r.current_node, r.goal_node) or []

    def start(self):
        self.running = True
        self.step_count = 0
        self.entry_types = {}
        self.total_blocked_attempts = 0
        self.wait_ticks_current = {}
        self.completed_trip_wait_times = []
        self.completed_goal_count = 0
        self.completed_path_lengths = []
        self.trip_start_step = {r_id: 0 for r_id in self.robots}
        self.completed_travel_times = []

    def _find_lane(self, from_node: str, to_node: str):
        for edge in planner.adj_list.get(from_node, []):
            if edge.end_node == to_node:
                return edge
        return None

    def _get_lane_obj(self, lane_id: str):
        for edges in planner.adj_list.values():
            for e in edges:
                if e.id == lane_id:
                    return e
        return None

    def _nearest_hub(self, current_node: str) -> str:
        """Pick the charging hub with the shortest path from current_node."""
        best_hub = CHARGING_HUBS[0]
        best_len = None
        for hub in CHARGING_HUBS:
            path = planner.find_path(current_node, hub)
            if path is not None and (best_len is None or len(path) < best_len):
                best_len = len(path)
                best_hub = hub
        return best_hub

    def step(self):
        if not self.running:
            return

        self.step_count += 1
        self.entry_types = {}  # reset classifications each step

        # ── STEP 1: Snapshot previous lane for every robot (frozen, do not mutate) ──
        # previous_lanes[robot_id] = lane_id the robot was on at END of last step
        previous_lanes: Dict[str, Optional[str]] = {
            r_id: traffic_manager.occupancies.get(r_id)
            for r_id in self.robots
        }

        # ── STEP 2: Build occupancy using ONLY previous lanes ────────────────────
        # This represents robots already inside each lane before this step starts.
        occupancy: Dict[str, int] = {}
        for lane_id in previous_lanes.values():
            if lane_id:
                occupancy[lane_id] = occupancy.get(lane_id, 0) + 1

        # Pre-push congestion so speed calculations later reflect current reality
        for edges in planner.adj_list.values():
            for edge in edges:
                edge.congestion_score = min(1.0, occupancy.get(edge.id, 0) / LANE_CAPACITY)

        # ── STEP 3: Process robots one by one (sorted by ID = priority) ──────────
        import random
        hub_slots_used: Dict[str, int] = {}  # hub_id -> robots already granted a charging slot this tick
        for robot in sorted(self.robots.values(), key=lambda r: r.id):

            # Battery Logic
            if robot.status == RobotStatus.CHARGING:
                if robot.current_node in CHARGING_HUBS:
                    used = hub_slots_used.get(robot.current_node, 0)
                    if used < HUB_CAPACITY:
                        # Slot available — this robot charges this tick
                        hub_slots_used[robot.current_node] = used + 1
                        robot.battery += CHARGE_RATE
                        if robot.battery >= 100.0:
                            robot.battery = 100.0
                            robot.status = RobotStatus.MOVING
                            nodes = list(planner.adj_list.keys())
                            robot.goal_node = random.choice([n for n in nodes if n != robot.current_node] or [robot.current_node])
                            robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
                            self.trip_start_step[robot.id] = self.step_count
                    # else: hub is at capacity — robot stays parked, queued, no charge this tick
                else:
                    robot.battery -= DRAIN_RATE  # still moving to charging station
            else:
                if robot.status == RobotStatus.MOVING:
                    robot.battery -= DRAIN_RATE

                if robot.battery < 20.0 and robot.goal_node not in CHARGING_HUBS:
                    hub = self._nearest_hub(robot.current_node)
                    robot.status = RobotStatus.CHARGING
                    robot.goal_node = hub
                    robot.path = planner.find_path(robot.current_node, hub) or []

            prev_lane_id = previous_lanes[robot.id]  # where robot was last step

            # ── Goal reached: stop and release lane ──────────────────────────────
            if robot.current_node == robot.goal_node:
                if robot.status == RobotStatus.CHARGING and robot.current_node in CHARGING_HUBS:
                    pass # Keep status as charging
                else:
                    robot.status = RobotStatus.STOPPED
                    robot.speed = 0.0

                    # ── Metrics: record this completed trip before goal/path are overwritten ──
                    completed_edges = max(0, len(robot.path) - 1) if robot.path else 0
                    self.completed_path_lengths.append(completed_edges)
                    self.completed_trip_wait_times.append(self.wait_ticks_current.pop(robot.id, 0))
                    self.completed_goal_count += 1
                    start_step = self.trip_start_step.pop(robot.id, self.step_count)
                    self.completed_travel_times.append(self.step_count - start_step)

                    # For continuous simulation, assign new random goal instead of stopping forever
                    nodes = list(planner.adj_list.keys())
                    robot.goal_node = random.choice([n for n in nodes if n != robot.current_node] or [robot.current_node])
                    robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
                    robot.status = RobotStatus.MOVING
                    self.trip_start_step[robot.id] = self.step_count

                if prev_lane_id:
                    lane = self._get_lane_obj(prev_lane_id)
                    if lane:
                        traffic_manager.release_lane(robot.id, lane)
                        occupancy[prev_lane_id] = max(0, occupancy.get(prev_lane_id, 1) - 1)
                        lane.congestion_score = min(1.0, occupancy[prev_lane_id] / LANE_CAPACITY)
                self.entry_types[robot.id] = "stay"
                continue

            # ── Ensure robot has a valid path ────────────────────────────────────
            if not robot.path or robot.current_node not in robot.path:
                robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
            if not robot.path:
                if robot.status != RobotStatus.CHARGING:
                    robot.status = RobotStatus.WAITING
                robot.speed = 0.0
                continue

            idx = robot.path.index(robot.current_node)
            if idx + 1 >= len(robot.path):
                robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
                continue

            next_node = robot.path[idx + 1]
            target_lane = self._find_lane(robot.current_node, next_node)
            if not target_lane:
                robot.path = planner.find_path(robot.current_node, robot.goal_node) or []
                continue

            # ── CASE A: Robot is ALREADY INSIDE target_lane (previous == target) ─
            if prev_lane_id == target_lane.id:
                # Robot stays on same lane — no capacity check needed
                self.entry_types[robot.id] = "stay"
                # ── STEP 6: Speed from congestion ────────────────────────────────
                speed = target_lane.speed_limit * (1.0 - target_lane.congestion_score)
                if target_lane.safety_level.value == "HIGH":
                    speed *= 0.6
                elif target_lane.safety_level.value == "MEDIUM":
                    speed *= 0.8
                robot.speed = max(0.2, float(speed))
                if robot.status != RobotStatus.CHARGING:
                    robot.status = RobotStatus.MOVING
                self.progress[robot.id] += robot.speed

                if self.progress[robot.id] >= 0.5:
                    # Exit: advance to next node and release lane
                    robot.current_node = next_node
                    self.progress[robot.id] = 0.0
                    traffic_manager.release_lane(robot.id, target_lane)
                    # ── STEP 4: Update occupancy on exit ─────────────────────────
                    occupancy[target_lane.id] = max(0, occupancy.get(target_lane.id, 1) - 1)
                    # ── STEP 5: Update congestion ─────────────────────────────────
                    target_lane.congestion_score = min(1.0, occupancy[target_lane.id] / LANE_CAPACITY)
                continue

            # ── CASE B: Robot is ENTERING a new lane (previous != target) ────────
            current_occupancy = occupancy.get(target_lane.id, 0)

            if current_occupancy >= LANE_CAPACITY:
                # Lane is full — BLOCK entry, robot stays where it was
                self.entry_types[robot.id] = "blocked"
                if robot.status != RobotStatus.CHARGING:
                    robot.status = RobotStatus.WAITING
                robot.speed = 0.0
                traffic_manager.waiting[robot.id] = target_lane.id

                # ── Metrics: this tick counts as a blocked attempt for this robot ──
                self.total_blocked_attempts += 1
                self.wait_ticks_current[robot.id] = self.wait_ticks_current.get(robot.id, 0) + 1
            else:
                # Lane has space — ALLOW entry
                self.entry_types[robot.id] = "entered"
                traffic_manager.register_entry(robot, target_lane)
                heatmap.track_usage(target_lane)
                self.progress[robot.id] = 0.0

                # ── STEP 4: Update occupancy on entry ────────────────────────────
                occupancy[target_lane.id] = current_occupancy + 1

                # ── STEP 5: Recalculate congestion ────────────────────────────────
                target_lane.congestion_score = min(1.0, occupancy[target_lane.id] / LANE_CAPACITY)

                # ── STEP 6: Set speed based on updated congestion ─────────────────
                speed = target_lane.speed_limit * (1.0 - target_lane.congestion_score)
                if target_lane.safety_level.value == "HIGH":
                    speed *= 0.6
                elif target_lane.safety_level.value == "MEDIUM":
                    speed *= 0.8
                robot.speed = max(0.2, float(speed))
                if robot.status != RobotStatus.CHARGING:
                    robot.status = RobotStatus.MOVING

        # ── Deadlock detection: check once per tick over final wait/occupancy state ──
        traffic_manager.check_deadlock()

        # ── Final: sync all lane congestion from authoritative occupancies ────────
        heatmap.recalculate_congestion()


sim = SimulationLoop()

