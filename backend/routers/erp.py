from fastapi import APIRouter, Depends, Query
from datetime import datetime
from backend.auth.middleware import require_auth
from backend.erp.service import get_current_context, get_events_for_day, get_events_in_window, get_all_events

router = APIRouter(prefix="/api/erp", tags=["erp"])


@router.get("/context")
async def erp_context(user: dict = Depends(require_auth)):
    ctx = await get_current_context()
    return ctx.model_dump(mode="json")


@router.get("/schedule")
async def schedule(date: str = Query(default=None), user: dict = Depends(require_auth)):
    target = datetime.fromisoformat(date) if date else datetime.now()
    events = await get_events_for_day(target)
    return [e.model_dump(mode="json") for e in events]


@router.get("/all")
async def all_events(user: dict = Depends(require_auth)):
    events = await get_all_events()
    return [e.model_dump(mode="json") for e in events]


@router.get("/upcoming")
async def upcoming(user: dict = Depends(require_auth)):
    now = datetime.now()
    from datetime import timedelta
    events = await get_events_in_window(now, now + timedelta(hours=2))
    return [e.model_dump(mode="json") for e in events]
