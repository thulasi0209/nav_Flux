from app.models.lane import Lane
from app.services.path_planner import planner, set_alpha


def make_lane(lane_id, start, end, congestion=0.0, speed=1.0):
    return Lane(id=lane_id, start_node=start, end_node=end, speed_limit=speed, congestion_score=congestion)


def test_find_path_simple_chain():
    planner.load_graph([
        make_lane("L1", "A", "B"),
        make_lane("L2", "B", "C"),
    ])
    assert planner.find_path("A", "C") == ["A", "B", "C"]


def test_find_path_returns_none_when_unreachable():
    planner.load_graph([make_lane("L1", "A", "B")])
    assert planner.find_path("A", "Z") is None
    assert planner.find_path("Z", "A") is None


def test_congestion_reroutes_around_the_busy_branch():
    # Diamond: A->B->D is congested, A->C->D is clear. A* must prefer the clear one.
    set_alpha(3.0)
    planner.load_graph([
        make_lane("AB", "A", "B", congestion=1.0),
        make_lane("BD", "B", "D", congestion=1.0),
        make_lane("AC", "A", "C", congestion=0.0),
        make_lane("CD", "C", "D", congestion=0.0),
    ])
    assert planner.find_path("A", "D") == ["A", "C", "D"]


def test_equal_cost_branches_still_reach_goal():
    planner.load_graph([
        make_lane("AB", "A", "B"),
        make_lane("BD", "B", "D"),
        make_lane("AC", "A", "C"),
        make_lane("CD", "C", "D"),
    ])
    path = planner.find_path("A", "D")
    assert path[0] == "A"
    assert path[-1] == "D"
    assert len(path) == 3
