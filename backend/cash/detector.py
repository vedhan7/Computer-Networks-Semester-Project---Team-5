"""
CASH Fault Detector — uses CRATE CNHS scores as primary signal.
"""
from datetime import datetime
from backend.erp.models import ERPContext


FAULT_CNHS_THRESHOLD = 40.0     # CNHS below this = fault detected
CRITICAL_CNHS_THRESHOLD = 20.0  # CNHS below this = critical fault


def detect_faults(segment_scores: list[dict], erp_context: ERPContext) -> list[dict]:
    """
    Returns list of detected faults based on CNHS scores and raw metrics.
    """
    faults = []
    activity = erp_context.active_event.event_type if erp_context.active_event else "free"

    for score in segment_scores:
        seg_id = score["segment_id"]
        cnhs = score["cnhs"]
        util = score.get("observed_utilization", 0) / 100
        latency = score.get("latency_ms", 0) if "latency_ms" in score else 0
        loss = score.get("packet_loss_percent", 0) if "packet_loss_percent" in score else 0

        if cnhs < FAULT_CNHS_THRESHOLD:
            # Determine fault type from dominant signal
            if util > 0.92:
                fault_type = "link_saturation"
            elif loss > 2.0:
                fault_type = "high_packet_loss"
            elif latency > 200:
                fault_type = "latency_spike"
            elif util < 0.01:
                fault_type = "link_down"
            else:
                fault_type = "link_saturation"

            severity = "critical" if cnhs < CRITICAL_CNHS_THRESHOLD else "warning"

            faults.append({
                "id": f"fault-{seg_id}-{int(datetime.now().timestamp())}",
                "fault_type": fault_type,
                "segment_id": seg_id,
                "severity": severity,
                "cnhs_at_detection": cnhs,
                "activity_context": activity,
                "utilization": util,
                "latency_ms": latency,
                "packet_loss_percent": loss,
                "detected_at": datetime.now().isoformat(),
            })

    return faults
