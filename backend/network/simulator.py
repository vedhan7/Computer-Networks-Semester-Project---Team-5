"""
Realistic Network Traffic Simulator.
Uses math-based model: ERP-predicted load + sine-wave variation + Gaussian noise.
"""
import math
import random
from datetime import datetime
from backend.config import SEGMENTS, BANDWIDTH_PROFILES
from backend.erp.models import ERPContext


# Per-segment idle baseline (fraction of total capacity)
IDLE_BASELINES = {
    "campus_root": 0.22,
    "block_a": 0.20,
    "lab_a1": 0.15,
    "lab_a2": 0.12,
    "halls_a": 0.18,
    "block_b": 0.18,
    "lab_b1": 0.13,
    "exam_hall": 0.10,
    "hostel": 0.30,
    "admin_block": 0.22,
    "library": 0.25,
}

_tick = 0  # global simulation tick counter


def tick():
    global _tick
    _tick += 1


def compute_segment_metrics(segment_id: str, erp_context: ERPContext) -> dict:
    """
    Compute realistic per-segment metrics.
    Returns utilization, latency, packet_loss, active_connections.
    """
    global _tick
    seg = SEGMENTS.get(segment_id)
    if not seg:
        return {}

    t = _tick * 2  # real seconds elapsed
    capacity = seg["total_bandwidth_mbps"]
    baseline = IDLE_BASELINES.get(segment_id, 0.20)
    active_event = erp_context.active_event

    # ── Compute utilization ───────────────────────────────────────────────────
    if active_event and segment_id in active_event.network_segments:
        profile = BANDWIDTH_PROFILES[active_event.bandwidth_profile]
        predicted = min(1.0, (active_event.expected_users * profile["mbps_per_user"]) / capacity)
        # Bursty model for labs (oscillates more), stable for exams
        if active_event.bandwidth_profile == "critical":
            variation = 0.02 * math.sin(t / 40) + random.gauss(0, 0.01)
        elif active_event.event_type == "lab":
            variation = 0.08 * math.sin(t / 20) + 0.04 * math.sin(t / 7) + random.gauss(0, 0.025)
        else:
            variation = 0.05 * math.sin(t / 30) + random.gauss(0, 0.015)
        utilization = max(0.05, min(0.98, predicted + variation))
    else:
        # Diurnal background load
        hour = datetime.now().hour
        diurnal = 0.08 * math.sin(math.pi * (hour - 7) / 11)
        # Hostel peaks at night
        if segment_id == "hostel" and hour >= 20:
            diurnal += 0.15
        variation = 0.04 * math.sin(t / 50) + random.gauss(0, 0.02)
        utilization = max(0.05, min(0.50, baseline + diurnal + variation))

    # ── Simulate occasional fault injection (for CASH demo) ──────────────────
    if hasattr(compute_segment_metrics, "_force_fault") and segment_id in compute_segment_metrics._force_fault:
        utilization = min(0.98, utilization + 0.40)

    used_mbps = round(utilization * capacity, 2)

    # ── Latency model ─────────────────────────────────────────────────────────
    base_latency = 5  # ms
    congestion_latency = (utilization ** 3) * 180  # exponential at high load
    jitter = random.gauss(0, 1.5)
    latency_ms = round(max(2, base_latency + congestion_latency + jitter), 2)

    # ── Packet loss model ─────────────────────────────────────────────────────
    if utilization > 0.90:
        packet_loss = random.uniform(0.5, 3.0)
    elif utilization > 0.75:
        packet_loss = random.uniform(0.05, 0.5)
    else:
        packet_loss = random.uniform(0.0, 0.05)

    # ── Active connections ────────────────────────────────────────────────────
    device_count = seg.get("device_count", 50)
    if active_event and segment_id in active_event.network_segments:
        active_connections = int(active_event.expected_users * random.uniform(0.85, 0.98))
    else:
        active_connections = int(device_count * utilization * random.uniform(0.6, 0.9))

    return {
        "segment_id": segment_id,
        "utilization_percent": round(utilization * 100, 2),
        "used_mbps": used_mbps,
        "total_mbps": capacity,
        "latency_ms": latency_ms,
        "packet_loss_percent": round(packet_loss, 3),
        "active_connections": active_connections,
    }


def inject_fault(segment_id: str):
    """Force high utilization on a segment (for demo/testing)."""
    if not hasattr(compute_segment_metrics, "_force_fault"):
        compute_segment_metrics._force_fault = set()
    compute_segment_metrics._force_fault.add(segment_id)


def clear_fault(segment_id: str):
    if hasattr(compute_segment_metrics, "_force_fault"):
        compute_segment_metrics._force_fault.discard(segment_id)
