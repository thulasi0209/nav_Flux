from app.models.lane import Lane
from app.models.robot import Robot
from app.services.traffic_controller import TrafficController


def test_no_deadlock_when_wait_chain_is_not_a_cycle():
    tc = TrafficController()
    tc.occupancies = {"R1": "L1"}
    tc.waiting = {"R2": "L1"}  # R2 waits on R1 — no cycle back to R2
    tc.check_deadlock()
    assert tc.deadlock_count == 0
    assert "R2" in tc.waiting


def test_detects_and_resolves_two_robot_deadlock():
    # R1 holds L1 and wants L2 (held by R2); R2 holds L2 and wants L1 (held by R1).
    tc = TrafficController()
    tc.occupancies = {"R1": "L1", "R2": "L2"}
    tc.waiting = {"R1": "L2", "R2": "L1"}
    tc.check_deadlock()
    assert tc.deadlock_count == 1
    # exactly one side of the cycle should have been freed
    assert len(tc.waiting) == 1


def test_release_lane_clears_reserved_flag_below_capacity():
    tc = TrafficController()
    lane = Lane(id="L1", start_node="A", end_node="B")
    r1, r2 = Robot(id="R1", current_node="A", goal_node="B"), Robot(id="R2", current_node="A", goal_node="B")

    tc.register_entry(r1, lane)
    tc.register_entry(r2, lane)
    tc.release_lane("R1", lane)  # capacity is 2, only 1 occupant remains

    assert lane.is_reserved is False
    assert "R1" not in tc.occupancies
