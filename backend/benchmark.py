"""
Real (non-HTTP) benchmark of the navFlux lane-graph traffic simulator.

Imports app.services.{path_planner,simulation,traffic_controller} directly and
drives them exactly the way app/api/routes/simulation.py does, without going
through FastAPI/HTTP. All metrics reported here come from the actual counters
implemented in app/services/simulation.py + app/services/traffic_controller.py
(avg_wait_time, throughput, deadlock_count, blocked_attempts, avg_path_length,
avg/max travel time) — nothing in this script estimates or fabricates a value.

GRAPH: sample_map.json (4 nodes, 8 lanes) is far too small to show lane-capacity
queuing at fleet sizes up to 80 robots — it would just gridlock instantly with
no route diversity. This script instead builds a synthetic 5x5 grid warehouse
graph (25 nodes, 80 directed lanes) with node (0,0) named "A" (required: the
simulator hardcodes "A" as the sole charging station). Lane types on the grid:
  - row 0 (north perimeter aisle):  NORMAL,     LOW safety,    speed_limit 1.5
  - row 2 (mid cross-aisle):        HUMAN_ZONE, HIGH safety,   speed_limit 0.5
  - column 2 (narrow vertical aisle): NARROW,   MEDIUM safety, speed_limit 0.8
  - everything else:                NORMAL,     MEDIUM safety, speed_limit 1.0
This mirrors the lane-type mix of the original sample_map.json (fast/low-safety
lane, one HUMAN_ZONE, one NARROW, rest NORMAL) at a scale where capacity and
congestion effects are actually observable.
"""

import csv
import os
import random
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import app.services.traffic_controller as traffic_controller_module
import app.services.simulation as simulation_module
from app.services.path_planner import planner, set_alpha
from app.services.simulation import sim
from app.services.traffic_controller import traffic_manager
from app.models.lane import Lane, LaneType, SafetyLevel
from app.models.robot import Robot, RobotStatus

GRID_ROWS = 5
GRID_COLS = 5
FLEET_SIZES = [10, 20, 30, 40, 50, 60, 70, 80]
SEEDS = list(range(1000, 1000 + 15))  # 15 seeds per fleet size, as requested (10-20 range)
TICKS_PER_TRIAL = 450

NAVFLUX_ALPHA = 3.0          # matches path_planner.py's default ALPHA
NAVFLUX_LANE_CAPACITY = 2    # matches traffic_controller.py's default LANE_CAPACITY
BASELINE_ALPHA = 0.0
BASELINE_LANE_CAPACITY = 10000

RAW_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "benchmark_results.csv")
SUMMARY_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "benchmark_summary.csv")


def node_name(row, col):
    if row == 0 and col == 0:
        return "A"
    return f"R{row}C{col}"


def build_warehouse_graph():
    """Fresh Lane objects every call — trials must not share congestion/usage state."""
    lanes = []

    def add_bidirectional(u, v, speed_limit, lane_type, safety_level):
        lanes.append(Lane(
            id=f"{u}->{v}", start_node=u, end_node=v,
            speed_limit=speed_limit, lane_type=lane_type, safety_level=safety_level,
        ))
        lanes.append(Lane(
            id=f"{v}->{u}", start_node=v, end_node=u,
            speed_limit=speed_limit, lane_type=lane_type, safety_level=safety_level,
        ))

    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            u = node_name(row, col)
            if col + 1 < GRID_COLS:
                v = node_name(row, col + 1)
                if row == 0:
                    add_bidirectional(u, v, 1.5, LaneType.NORMAL, SafetyLevel.LOW)
                elif row == 2:
                    add_bidirectional(u, v, 0.5, LaneType.HUMAN_ZONE, SafetyLevel.HIGH)
                else:
                    add_bidirectional(u, v, 1.0, LaneType.NORMAL, SafetyLevel.MEDIUM)
            if row + 1 < GRID_ROWS:
                v = node_name(row + 1, col)
                if col == 2:
                    add_bidirectional(u, v, 0.8, LaneType.NARROW, SafetyLevel.MEDIUM)
                else:
                    add_bidirectional(u, v, 1.0, LaneType.NORMAL, SafetyLevel.MEDIUM)

    return lanes


def set_lane_capacity(value):
    """LANE_CAPACITY is imported *by value* into app.services.simulation at module
    load time (`from ... import LANE_CAPACITY`), so patching traffic_controller's
    copy alone would not affect simulation.step()'s occupancy checks. Both module
    attributes must be patched for capacity to actually change simulated behavior."""
    traffic_controller_module.LANE_CAPACITY = value
    simulation_module.LANE_CAPACITY = value


def spawn_robots(nodes, fleet_size):
    robots = []
    for i in range(fleet_size):
        start_node = random.choice(nodes)
        goal_node = random.choice([n for n in nodes if n != start_node])
        robots.append(Robot(
            id=f"R{i+1}",
            current_node=start_node,
            goal_node=goal_node,
            status=RobotStatus.MOVING,
            battery=100.0,
            path=[],
        ))
    return robots


def mean_or_none(values):
    return statistics.mean(values) if values else None


def run_trial(condition, fleet_size, seed, alpha, lane_capacity, ticks):
    random.seed(seed)  # governs both spawn placement here AND simulation.py's
                        # internal `random.choice` reassignments during step()

    set_alpha(alpha)
    set_lane_capacity(lane_capacity)

    lanes = build_warehouse_graph()
    planner.load_graph(lanes)

    nodes = list(planner.adj_list.keys())
    robots = spawn_robots(nodes, fleet_size)

    traffic_manager.occupancies.clear()
    traffic_manager.waiting.clear()
    traffic_manager.deadlock_count = 0

    sim.load_robots(robots)
    sim.start()

    for _ in range(ticks):
        sim.step()

    completed_goals = sim.completed_goal_count
    throughput = completed_goals / ticks * 100 if ticks > 0 else None

    return {
        "condition": condition,
        "fleet_size": fleet_size,
        "seed": seed,
        "ticks": ticks,
        "completed_goals": completed_goals,
        "avg_travel_time": mean_or_none(sim.completed_travel_times),
        "max_travel_time": max(sim.completed_travel_times) if sim.completed_travel_times else None,
        "avg_wait_time": mean_or_none(sim.completed_trip_wait_times),
        "throughput_per_100_ticks": throughput,
        "deadlock_count": traffic_manager.deadlock_count,
        "blocked_attempts": sim.total_blocked_attempts,
        "avg_path_length": mean_or_none(sim.completed_path_lengths),
    }


def run_sweep():
    conditions = [
        ("navflux", NAVFLUX_ALPHA, NAVFLUX_LANE_CAPACITY),
        ("baseline", BASELINE_ALPHA, BASELINE_LANE_CAPACITY),
    ]

    rows = []
    total = len(conditions) * len(FLEET_SIZES) * len(SEEDS)
    done = 0
    for condition, alpha, lane_capacity in conditions:
        for fleet_size in FLEET_SIZES:
            for seed in SEEDS:
                row = run_trial(condition, fleet_size, seed, alpha, lane_capacity, TICKS_PER_TRIAL)
                rows.append(row)
                done += 1
                if done % 20 == 0:
                    print(f"  ... {done}/{total} trials done", file=sys.stderr)
    return rows


def write_raw_csv(rows, path):
    fieldnames = [
        "condition", "fleet_size", "seed", "ticks", "completed_goals",
        "avg_travel_time", "max_travel_time", "avg_wait_time",
        "throughput_per_100_ticks", "deadlock_count", "blocked_attempts",
        "avg_path_length",
    ]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


METRIC_COLUMNS = [
    "completed_goals", "avg_travel_time", "max_travel_time", "avg_wait_time",
    "throughput_per_100_ticks", "deadlock_count", "blocked_attempts", "avg_path_length",
]


def summarize(rows):
    groups = {}
    for row in rows:
        key = (row["condition"], row["fleet_size"])
        groups.setdefault(key, []).append(row)

    summary = []
    for (condition, fleet_size), trials in sorted(groups.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        entry = {"condition": condition, "fleet_size": fleet_size, "n_seeds": len(trials)}
        for col in METRIC_COLUMNS:
            values = [t[col] for t in trials if t[col] is not None]
            entry[f"{col}_mean"] = statistics.mean(values) if values else None
            entry[f"{col}_std"] = statistics.stdev(values) if len(values) > 1 else (0.0 if values else None)
            entry[f"{col}_missing"] = len(trials) - len(values)
        summary.append(entry)
    return summary


def write_summary_csv(summary, path):
    fieldnames = ["condition", "fleet_size", "n_seeds"]
    for col in METRIC_COLUMNS:
        fieldnames += [f"{col}_mean", f"{col}_std", f"{col}_missing"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in summary:
            writer.writerow(row)


def print_summary_table(summary):
    header = f"{'cond':<10}{'fleet':>6}{'compl':>8}{'avg_travel':>12}{'max_travel':>12}{'avg_wait':>10}{'thrpt/100t':>12}{'deadlk':>8}{'blocked':>9}{'avg_path':>10}"
    print(header)
    print("-" * len(header))
    for row in summary:
        def fmt(mean_key, std_key):
            m = row[mean_key]
            s = row[std_key]
            if m is None:
                return "n/a"
            return f"{m:.2f}±{s:.2f}" if s is not None else f"{m:.2f}"

        print(
            f"{row['condition']:<10}{row['fleet_size']:>6}"
            f"{fmt('completed_goals_mean','completed_goals_std'):>8}"
            f"{fmt('avg_travel_time_mean','avg_travel_time_std'):>12}"
            f"{fmt('max_travel_time_mean','max_travel_time_std'):>12}"
            f"{fmt('avg_wait_time_mean','avg_wait_time_std'):>10}"
            f"{fmt('throughput_per_100_ticks_mean','throughput_per_100_ticks_std'):>12}"
            f"{fmt('deadlock_count_mean','deadlock_count_std'):>8}"
            f"{fmt('blocked_attempts_mean','blocked_attempts_std'):>9}"
            f"{fmt('avg_path_length_mean','avg_path_length_std'):>10}"
        )


if __name__ == "__main__":
    print(f"Running sweep: fleet_sizes={FLEET_SIZES}, seeds_per_size={len(SEEDS)}, "
          f"ticks_per_trial={TICKS_PER_TRIAL}, conditions=[navflux(alpha={NAVFLUX_ALPHA},cap={NAVFLUX_LANE_CAPACITY}), "
          f"baseline(alpha={BASELINE_ALPHA},cap={BASELINE_LANE_CAPACITY})]", file=sys.stderr)

    rows = run_sweep()
    write_raw_csv(rows, RAW_CSV_PATH)
    summary = summarize(rows)
    write_summary_csv(summary, SUMMARY_CSV_PATH)

    print(f"\nWrote {len(rows)} raw trial rows to {RAW_CSV_PATH}")
    print(f"Wrote {len(summary)} summary rows to {SUMMARY_CSV_PATH}\n")
    print_summary_table(summary)
