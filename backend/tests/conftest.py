import pytest
from app.services.path_planner import planner
from app.services.traffic_controller import traffic_manager


def _reset():
    planner.adj_list.clear()
    traffic_manager.occupancies.clear()
    traffic_manager.waiting.clear()
    traffic_manager.deadlock_count = 0


@pytest.fixture(autouse=True)
def reset_globals():
    """The planner/traffic_manager are process-wide singletons shared with
    simulation.py, so every test starts and ends with a clean slate."""
    _reset()
    yield
    _reset()
