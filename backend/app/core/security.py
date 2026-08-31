from fastapi import Header, HTTPException
from app.core.config import API_KEY


def require_api_key(x_api_key: str = Header(default=None)):
    """No-op when API_KEY is unset (local/dev). Once API_KEY is set in the
    environment, mutating routes require a matching X-API-Key header."""
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
