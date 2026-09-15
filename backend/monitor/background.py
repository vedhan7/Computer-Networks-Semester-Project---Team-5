"""
Background Tasks — orchestrates all ACORN real-time processes.
"""
import asyncio
from datetime import datetime
from backend.config import (
    NETWORK_TICK_INTERVAL_SECONDS,
    CASH_CHECK_INTERVAL_SECONDS,
    ERP_CHECK_INTERVAL_SECONDS,
    TIPS_SCHEDULER_INTERVAL_SECONDS,
    SEGMENTS,
)


async def network_tick_loop():
    """Every 2s: update network state, compute CRATE scores, broadcast via WS."""
    from backend.erp.service import get_current_context
    from backend.network.state import update_state
    from backend.crate.scorer import compute_cnhs, compute_campus_cnhs
    from backend.tips.store import get_active_intents, get_tips_pipeline
    from backend.cash.engine import get_healing_log, get_active_faults
    from backend.monitor.websocket import manager
    from backend.apcr.resolver import get_apcr_log

    cash_counter = 0
    tips_counter = 0

    while True:
        try:
            erp_context = await get_current_context()
            snapshot = await update_state(erp_context)

            # Compute CRATE scores for each segment
            segment_scores = []
            for seg_metrics in snapshot["segments"]:
                seg_id = seg_metrics["segment_id"]
                score = compute_cnhs(
                    seg_id,
                    seg_metrics["utilization_percent"] / 100,
                    seg_metrics.get("latency_ms", 5),
                    seg_metrics.get("packet_loss_percent", 0),
                    erp_context,
                )
                # Merge score into segment metrics
                merged = {**seg_metrics, **score}
                segment_scores.append(merged)

            campus_cnhs = compute_campus_cnhs(segment_scores)

            # CASH check every 5s
            cash_counter += NETWORK_TICK_INTERVAL_SECONDS
            healing_events = []
            if cash_counter >= CASH_CHECK_INTERVAL_SECONDS:
                cash_counter = 0
                from backend.cash.engine import run_cash
                healing_events = await run_cash(segment_scores, erp_context)

            # TIPS scheduler every 30s
            tips_counter += NETWORK_TICK_INTERVAL_SECONDS
            if tips_counter >= TIPS_SCHEDULER_INTERVAL_SECONDS:
                tips_counter = 0
                from backend.tips.lifecycle import run_tips_scheduler
                await run_tips_scheduler()

            # Build and broadcast ACORN update
            active_intents = await get_active_intents()
            tips_pipeline = await get_tips_pipeline()
            healing_log = get_healing_log(10)
            active_faults = get_active_faults()
            apcr_log = await get_apcr_log(5)

            # Generate alerts from CRATE scores
            alerts = _build_alerts(segment_scores, erp_context)

            message = {
                "type": "acorn_update",
                "timestamp": datetime.now().isoformat(),
                "campus_cnhs": campus_cnhs,
                "campus_status": _classify_campus(campus_cnhs),
                "erp_context": erp_context.model_dump(mode="json"),
                "segments": segment_scores,
                "active_intents": active_intents,
                "tips_pipeline": {
                    "staged": len(tips_pipeline.get("staged", [])),
                    "armed": len(tips_pipeline.get("armed", [])),
                    "active": len(tips_pipeline.get("active", [])),
                    "staged_intents": tips_pipeline.get("staged", []),
                    "armed_intents": tips_pipeline.get("armed", []),
                    "active_intents_list": tips_pipeline.get("active", []),
                },
                "active_faults": active_faults,
                "recent_healing": healing_log,
                "new_healing_events": healing_events,
                "apcr_recent": apcr_log,
                "alerts": alerts,
            }

            await manager.broadcast(message)

        except Exception as e:
            print(f"[ACORN Tick Error] {e}")

        await asyncio.sleep(NETWORK_TICK_INTERVAL_SECONDS)


def _build_alerts(segment_scores: list[dict], erp_context) -> list[dict]:
    alerts = []
    for score in segment_scores:
        cnhs = score.get("cnhs", 100)
        status = score.get("status", "healthy")
        if status in ("critical", "down"):
            alerts.append({
                "severity": "critical",
                "segment_id": score["segment_id"],
                "message": f"{score.get('name', score['segment_id'])}: CNHS {cnhs:.1f} — {status.upper()}",
                "timestamp": datetime.now().isoformat(),
            })
        elif status == "degraded":
            alerts.append({
                "severity": "warning",
                "segment_id": score["segment_id"],
                "message": f"{score.get('name', score['segment_id'])}: CNHS {cnhs:.1f} — DEGRADED",
                "timestamp": datetime.now().isoformat(),
            })
    return alerts


def _classify_campus(cnhs: float) -> str:
    if cnhs >= 75:
        return "healthy"
    if cnhs >= 50:
        return "degraded"
    if cnhs >= 25:
        return "critical"
    return "down"


async def start_background_tasks():
    asyncio.create_task(network_tick_loop())
    print("[ACORN] Background tasks started.")
