# Configuration Settings
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# If unset, API key auth is disabled (local/dev mode). Set this env var in
# production (e.g. Render) to require X-API-Key on state-mutating routes.
API_KEY = os.environ.get("API_KEY") or None

# Comma-separated list of origins allowed to call this API from a browser.
# Defaults cover local Vite dev; add the deployed frontend URL in production.
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if o.strip()
]
