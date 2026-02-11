import os
import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx

# --- Configuration ---

BABY_BUDDY_URL = os.environ.get("BABY_BUDDY_URL", "").rstrip("/")
BABY_BUDDY_API_KEY = os.environ.get("BABY_BUDDY_API_KEY", "")
REFRESH_INTERVAL = int(os.environ.get("REFRESH_INTERVAL", "30"))

# Fallback: read from HA add-on options.json
if not BABY_BUDDY_URL:
    options_path = Path("/data/options.json")
    if options_path.exists():
        opts = json.loads(options_path.read_text())
        BABY_BUDDY_URL = opts.get("baby_buddy_url", "").rstrip("/")
        BABY_BUDDY_API_KEY = opts.get("baby_buddy_api_key", "")
        REFRESH_INTERVAL = opts.get("refresh_interval", 30)

STATIC_DIR = Path(__file__).parent.parent / "static"

# --- App lifecycle ---

http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(
        base_url=BABY_BUDDY_URL,
        headers={
            "Authorization": f"Token {BABY_BUDDY_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=15.0,
    )
    yield
    await http_client.aclose()


app = FastAPI(lifespan=lifespan)


# --- API routes ---


@app.get("/api/config")
async def get_config():
    return {"refresh_interval": REFRESH_INTERVAL}


@app.api_route(
    "/api/baby-buddy/{path:path}",
    methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
)
async def proxy_baby_buddy(path: str, request: Request):
    """Proxy requests to the remote Baby Buddy API."""
    target_url = f"/api/{path}"
    params = dict(request.query_params)

    body = None
    content_type = request.headers.get("content-type", "")
    if request.method in ("POST", "PATCH", "PUT"):
        body = await request.body()

    try:
        headers = {}
        if body and "application/json" in content_type:
            headers["Content-Type"] = "application/json"

        response = await http_client.request(
            method=request.method,
            url=target_url,
            params=params,
            content=body,
            headers=headers,
        )
    except httpx.ConnectError:
        raise HTTPException(502, "Cannot connect to Baby Buddy")
    except httpx.TimeoutException:
        raise HTTPException(504, "Baby Buddy request timed out")

    excluded_headers = {"transfer-encoding", "content-encoding", "connection"}
    response_headers = {
        k: v
        for k, v in response.headers.items()
        if k.lower() not in excluded_headers
    }

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
    )


# --- Static files (React SPA) ---

if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount(
            "/assets", StaticFiles(directory=str(assets_dir)), name="assets"
        )

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        file_path = STATIC_DIR / path
        if file_path.is_file() and ".." not in path:
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
