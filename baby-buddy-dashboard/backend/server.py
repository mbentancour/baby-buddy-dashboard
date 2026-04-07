import os
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---

BABY_BUDDY_URL = os.environ.get("BABY_BUDDY_URL", "").rstrip("/")
BABY_BUDDY_API_KEY = os.environ.get("BABY_BUDDY_API_KEY", "")
REFRESH_INTERVAL = int(os.environ.get("REFRESH_INTERVAL", "30"))
DEMO_MODE = os.environ.get("DEMO_MODE", "").lower() in ("true", "1", "yes")
UNIT_SYSTEM = os.environ.get("UNIT_SYSTEM", "metric").lower()

# Fallback: read from HA add-on options.json
if not BABY_BUDDY_URL:
    options_path = Path("/data/options.json")
    if options_path.exists():
        opts = json.loads(options_path.read_text())
        BABY_BUDDY_URL = opts.get("baby_buddy_url", "").rstrip("/")
        BABY_BUDDY_API_KEY = opts.get("baby_buddy_api_key", "")
        REFRESH_INTERVAL = opts.get("refresh_interval", 30)
        DEMO_MODE = DEMO_MODE or opts.get("demo_mode", False)
        UNIT_SYSTEM = opts.get("unit_system", UNIT_SYSTEM)

STATIC_DIR = Path(__file__).parent.parent / "static"

logger.info(f"BABY_BUDDY_URL={BABY_BUDDY_URL!r}")
logger.info(f"BABY_BUDDY_API_KEY={'set' if BABY_BUDDY_API_KEY else 'NOT SET'}")

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
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    )
    yield
    await http_client.aclose()


app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"REQUEST: {request.method} {request.url.path}")
    logger.info(f"  Headers: X-Ingress-Path={request.headers.get('X-Ingress-Path', 'NOT SET')}")
    response = await call_next(request)
    logger.info(f"  RESPONSE: {response.status_code}")
    return response


# --- API routes ---


@app.get("/api/config")
async def get_config():
    return {"refresh_interval": REFRESH_INTERVAL, "demo_mode": DEMO_MODE, "unit_system": UNIT_SYSTEM}


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

    content_type = response.headers.get("content-type", "application/json")

    return Response(
        content=response.content,
        status_code=response.status_code,
        media_type=content_type,
    )


@app.get("/api/media/{path:path}")
async def proxy_media(path: str):
    """Proxy media files (e.g. child photos) from Baby Buddy."""
    try:
        response = await http_client.get(
            f"/{path}",
            headers={"Accept": "*/*"},
        )
    except httpx.ConnectError:
        raise HTTPException(502, "Cannot connect to Baby Buddy")
    except httpx.TimeoutException:
        raise HTTPException(504, "Baby Buddy request timed out")

    if response.status_code != 200:
        raise HTTPException(response.status_code, "Media not found")

    return Response(
        content=response.content,
        headers={"Content-Type": response.headers.get("content-type", "application/octet-stream")},
    )


# --- Static files (React SPA) ---

if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount(
            "/assets", StaticFiles(directory=str(assets_dir)), name="assets"
        )

    @app.get("/{path:path}")
    async def serve_spa(path: str, request: Request):
        file_path = STATIC_DIR / path
        if file_path.is_file() and ".." not in path:
            return FileResponse(file_path)

        # Inject <base> tag with ingress path so relative URLs resolve correctly
        ingress_path = request.headers.get("X-Ingress-Path", "")
        index_html = (STATIC_DIR / "index.html").read_text()
        if ingress_path:
            base_href = ingress_path.rstrip("/") + "/"
            index_html = index_html.replace("<head>", f'<head><base href="{base_href}">', 1)

        return Response(
            content=index_html,
            media_type="text/html",
            headers={"Cache-Control": "no-cache"},
        )
