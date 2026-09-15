from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend.auth.middleware import require_auth, require_admin
from backend.cash.engine import get_healing_log, get_active_faults
from backend.network.simulator import inject_fault
from backend.apcr.resolver import get_apcr_log

router = APIRouter(prefix="/api/healing", tags=["healing"])


class SimulateFaultRequest(BaseModel):
    segment_id: str
    fault_type: str = "link_saturation"


@router.get("/log")
async def healing_log_endpoint(limit: int = 50, user: dict = Depends(require_auth)):
    return get_healing_log(limit)


@router.get("/active-faults")
async def active_faults(user: dict = Depends(require_auth)):
    return get_active_faults()


@router.post("/simulate")
async def simulate_fault(req: SimulateFaultRequest, user: dict = Depends(require_admin)):
    """Inject a simulated fault for demo purposes."""
    inject_fault(req.segment_id)
    return {"status": "fault_injected", "segment_id": req.segment_id, "fault_type": req.fault_type}


@router.get("/apcr-log")
async def apcr_log(limit: int = 50, user: dict = Depends(require_auth)):
    return await get_apcr_log(limit)
