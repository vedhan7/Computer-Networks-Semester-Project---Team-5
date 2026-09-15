"""
CRATE — Context-Relative Adaptive Threshold Engine
Novel Contribution #2

Computes Context-Normalized Health Scores (CNHS) by evaluating observed
network metrics relative to ERP-predicted baselines, not absolute thresholds.
"""
from backend.erp.models import ERPContext
from backend.config import CRITICALITY_WEIGHTS, SEGMENTS


STATUS_THRESHOLDS = {
    "healthy": 70,
    "degraded": 40,
    "critical": 20,
}


def classify_status(cnhs: float) -> str:
    if cnhs >= STATUS_THRESHOLDS["healthy"]:
        return "healthy"
    if cnhs >= STATUS_THRESHOLDS["degraded"]:
        return "degraded"
    if cnhs >= STATUS_THRESHOLDS["critical"]:
        return "critical"
    return "down"


def compute_cnhs(
    segment_id: str,
    observed_utilization: float,   # 0.0 – 1.0
    latency_ms: float,
    packet_loss_percent: float,
    erp_context: ERPContext,
) -> dict:
    """
    CNHS Formula (novel):
      base_score = 100 - (deviation_from_predicted × 100 × criticality_weight)
      Apply latency/packet_loss penalties.
    """
    predicted_utilization = erp_context.predicted_segment_loads.get(segment_id, 0.20)
    activity_type = erp_context.active_event.event_type if erp_context.active_event else "free"
    criticality = CRITICALITY_WEIGHTS.get(activity_type, 1.0)

    # Context-relative deviation
    deviation = abs(observed_utilization - predicted_utilization)
    normalized_deviation = deviation / max(predicted_utilization, 0.05)

    # Base CNHS
    base_score = 100 - (normalized_deviation * 100 * criticality)

    # Secondary absolute penalties
    latency_penalty = 0.0
    if latency_ms > 200:
        latency_penalty = min(25, (latency_ms - 200) / 20)
    elif latency_ms > 100:
        latency_penalty = min(10, (latency_ms - 100) / 20)

    loss_penalty = 0.0
    if packet_loss_percent > 2.0:
        loss_penalty = 20
    elif packet_loss_percent > 0.5:
        loss_penalty = 10
    elif packet_loss_percent > 0.1:
        loss_penalty = 5

    cnhs = max(0.0, min(100.0, base_score - latency_penalty - loss_penalty))
    status = classify_status(cnhs)

    # Human-readable explanation
    explanation = _explain(
        cnhs, observed_utilization, predicted_utilization,
        deviation, criticality, activity_type, latency_ms, packet_loss_percent
    )

    return {
        "segment_id": segment_id,
        "cnhs": round(cnhs, 2),
        "status": status,
        "observed_utilization": round(observed_utilization * 100, 2),
        "predicted_utilization": round(predicted_utilization * 100, 2),
        "deviation_percent": round(deviation * 100, 2),
        "criticality_weight": criticality,
        "activity_context": activity_type,
        "latency_penalty": round(latency_penalty, 2),
        "loss_penalty": round(loss_penalty, 2),
        "explanation": explanation,
    }


def _explain(cnhs, observed, predicted, deviation, criticality, activity, latency, loss):
    obs_pct = round(observed * 100, 1)
    pred_pct = round(predicted * 100, 1)
    dev_pct = round(deviation * 100, 1)
    status = classify_status(cnhs)

    parts = [
        f"Utilization: {obs_pct}% observed vs {pred_pct}% predicted ({activity.upper()} context).",
        f"Deviation: {dev_pct}% × criticality weight {criticality} → base penalty applied.",
    ]
    if latency > 100:
        parts.append(f"Latency: {latency}ms (elevated, penalty applied).")
    if loss > 0.1:
        parts.append(f"Packet loss: {loss}% (penalty applied).")
    parts.append(f"CNHS: {round(cnhs, 1)}/100 — {status.upper()}")
    return " ".join(parts)


def compute_campus_cnhs(segment_scores: list[dict]) -> float:
    """Weighted average CNHS across all segments (leaf segments weighted higher)."""
    leaf_ids = {"lab_a1", "lab_a2", "halls_a", "lab_b1", "exam_hall", "hostel", "admin_block", "library"}
    weights = {seg_id: (2.0 if seg_id in leaf_ids else 1.0) for seg_id in SEGMENTS}
    total_weight = sum(weights[s["segment_id"]] for s in segment_scores if s["segment_id"] in weights)
    if total_weight == 0:
        return 100.0
    weighted_sum = sum(s["cnhs"] * weights.get(s["segment_id"], 1.0) for s in segment_scores)
    return round(weighted_sum / total_weight, 2)
