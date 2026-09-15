from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.auth.middleware import require_auth
from backend.enci.generator import generate_intents_for_event, generate_description_for_event
from backend.enci.feedback import get_feedback_log
from backend.erp.service import get_events_in_window, get_current_context
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/enci", tags=["enci"])


@router.get("/preview/{event_id}")
async def preview_intents(event_id: str, user: dict = Depends(require_auth)):
    """Preview ENCI-generated intents for a specific ERP event."""
    events = await get_events_in_window(
        datetime.now() - timedelta(days=7),
        datetime.now() + timedelta(days=7),
    )
    event = next((e for e in events if e.id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    intents = generate_intents_for_event(event)
    description = generate_description_for_event(event)
    return {"event": event.model_dump(mode="json"), "intents": intents, "enci_description": description}


@router.get("/feedback")
async def feedback_log(user: dict = Depends(require_auth)):
    return await get_feedback_log(50)
