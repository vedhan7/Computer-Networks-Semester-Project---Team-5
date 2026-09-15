"""
ACORN FastAPI Main Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.db.connection import init_db
from backend.db.seed import seed_database
from backend.monitor.background import start_background_tasks
from backend.monitor.websocket import manager
from backend.routers import auth, erp, enci, intents, network, healing


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_database()
    await start_background_tasks()
    print("[ACORN] System online.")
    yield
    # Shutdown
    print("[ACORN] Shutting down.")


app = FastAPI(
    title="ACORN — Academic Context-Orchestrated Resilient Network",
    description=(
        "Novel intent-based self-healing smart campus network framework. "
        "Integrates ERP academic scheduling with network orchestration via "
        "ENCI, TIPS, CRATE, APCR, and CASH modules."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(erp.router)
app.include_router(enci.router)
app.include_router(intents.router)
app.include_router(network.router)
app.include_router(healing.router)


@app.get("/api/health")
async def health():
    return {"status": "online", "system": "ACORN", "version": "1.0.0"}


@app.websocket("/ws/monitor")
async def ws_monitor(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; data is pushed by background task
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
