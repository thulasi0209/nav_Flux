from app.models.lane import Lane
from app.models.robot import Robot, RobotStatus
from app.services.path_planner import planner
from app.services.traffic_controller import traffic_manager, LANE_CAPACITY
from app.services.simulation import SimulationLoop


def test_third_robot_is_blocked_once_lane_is_at_capacity():
    # One lane, capacity 2 (LANE_CAPACITY), three robots all trying to enter it at once.
    planner.load_graph([Lane(id="AB", start_node="A", end_node="B", speed_limit=1.0)])

    loop = SimulationLoop()
    loop.load_robots([
        Robot(id="R1", current_node="A", goal_node="B", status=RobotStatus.MOVING),
        Robot(id="R2", current_node="A", goal_node="B", status=RobotStatus.MOVING),
        Robot(id="R3", current_node="A", goal_node="B", status=RobotStatus.MOVING),
    ])
    loop.start()
    loop.step()

    occupancy_count = sum(1 for lane_id in traffic_manager.occupancies.values() if lane_id == "AB")
    assert occupancy_count <= LANE_CAPACITY

    statuses = {r.id: r.status for r in loop.robots.values()}
    blocked = [rid for rid, status in statuses.items() if status == RobotStatus.WAITING]
    entered = [rid for rid, status in statuses.items() if status == RobotStatus.MOVING]

    assert len(blocked) == 1
    assert len(entered) == LANE_CAPACITY
