from fastapi import APIRouter, Depends
from backend.auth.middleware import require_auth
from backend.network.topology import get_topology
from backend.network.state import get_latest_snapshot, get_history_snapshots
from backend.crate.scorer import compute_cnhs, compute_campus_cnhs
from backend.erp.service import get_current_context

router = APIRouter(prefix="/api/network", tags=["network"])


@router.get("/topology")
async def topology(user: dict = Depends(require_auth)):
    return get_topology()


@router.get("/state")
async def state(user: dict = Depends(require_auth)):
    return get_latest_snapshot()


@router.get("/history")
async def history(limit: int = 30, user: dict = Depends(require_auth)):
    return await get_history_snapshots(limit)


@router.get("/crate")
async def crate_scores(user: dict = Depends(require_auth)):
    """Returns CNHS scores for all segments with explanations."""
    snapshot = get_latest_snapshot()
    erp_context = await get_current_context()
    if not snapshot:
        return []
    scores = []
    for seg in snapshot.get("segments", []):
        score = compute_cnhs(
            seg["segment_id"],
            seg["utilization_percent"] / 100,
            seg.get("latency_ms", 5),
            seg.get("packet_loss_percent", 0),
            erp_context,
        )
        scores.append(score)
    campus = compute_campus_cnhs(scores)
    return {"campus_cnhs": campus, "segments": scores}
