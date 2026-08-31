# Lane-Aware Multi-Robot Traffic Control System

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Running the Server

```bash
uvicorn app.main:app --reload
```

## Example API Calls

- `GET /health` : Health check
- `GET /map` : Get current adjacency graph
- `GET /robots` : Get active robots
- `POST /simulate/start` : Start the simulation clock (loads default robots if empty)
- `POST /simulate/step` : Tick the simulation engine one chronological step
- `GET /heatmap` : Gather congestion scores and usage heatmaps
- `GET /metrics` : Basic operational numbers
