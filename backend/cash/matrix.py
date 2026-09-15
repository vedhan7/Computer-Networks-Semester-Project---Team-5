"""
CASH — Context-Aware Self-Healing
Novel Contribution #5: Context-Healing Matrix

Recovery strategies are selected based on (fault_type × activity_type),
not uniform procedures.
"""
from dataclasses import dataclass, field


@dataclass
class HealingStrategy:
    name: str
    steps: list[str]
    aggression: int        # 1 (soft) … 5 (emergency)
    rollback_on_resolve: bool
    description: str = ""
    notify_admin: bool = False
    erp_feedback: bool = False


# ── Context-Healing Matrix: 25 combinations ──────────────────────────────────
CONTEXT_HEALING_MATRIX: dict[tuple[str, str], HealingStrategy] = {

    # LINK SATURATION × activity
    ("link_saturation", "exam"): HealingStrategy(
        name="exam_emergency_bandwidth_failover",
        steps=[
            "Block all non-exam-portal traffic immediately on affected segment",
            "Activate backup bandwidth path via secondary uplink",
            "Apply emergency QoS: DSCP 46 (EF) for exam portal only",
            "Send CRITICAL alert to admin dashboard",
            "Log ERP feedback: exam network incident",
        ],
        aggression=5, rollback_on_resolve=True,
        notify_admin=True, erp_feedback=True,
        description="Emergency response: exam integrity takes absolute priority.",
    ),
    ("link_saturation", "lab"): HealingStrategy(
        name="lab_load_balance",
        steps=[
            "Throttle non-lab traffic by 30% on affected segment",
            "Redistribute connections to secondary access point",
            "Apply QoS priority boost for compiler/IDE services",
            "Log WARNING alert",
        ],
        aggression=3, rollback_on_resolve=True,
        description="Load balance lab segment, preserve compiler/IDE QoS.",
    ),
    ("link_saturation", "lecture"): HealingStrategy(
        name="lecture_soft_throttle",
        steps=[
            "Throttle streaming media by 50% on affected segment",
            "Deprioritize social media traffic",
            "Log INFO alert",
        ],
        aggression=2, rollback_on_resolve=True,
        description="Soft throttle of non-essential lecture traffic.",
    ),
    ("link_saturation", "event"): HealingStrategy(
        name="event_load_redistribute",
        steps=[
            "Throttle streaming by 25%",
            "Redistribute load across available APs",
            "Log WARNING alert",
        ],
        aggression=2, rollback_on_resolve=True,
    ),
    ("link_saturation", "free"): HealingStrategy(
        name="free_period_rate_limit",
        steps=[
            "Apply per-user rate limit: 5Mbps max on affected segment",
            "Log INFO alert",
        ],
        aggression=1, rollback_on_resolve=True,
        description="Low-priority rate limit during free periods.",
    ),

    # HIGH PACKET LOSS × activity
    ("high_packet_loss", "exam"): HealingStrategy(
        name="exam_packet_loss_reroute",
        steps=[
            "Immediately reroute exam traffic to redundant path",
            "Enable dual-path redundancy for exam portal",
            "Isolate affected segment for diagnostics",
            "Send CRITICAL alert + ERP feedback",
        ],
        aggression=5, rollback_on_resolve=False,
        notify_admin=True, erp_feedback=True,
    ),
    ("high_packet_loss", "lab"): HealingStrategy(
        name="lab_packet_loss_reroute",
        steps=[
            "Reroute lab traffic to alternate path",
            "Flush ARP cache on affected switch",
            "Log WARNING alert",
        ],
        aggression=3, rollback_on_resolve=True,
    ),
    ("high_packet_loss", "lecture"): HealingStrategy(
        name="lecture_packet_loss_reroute",
        steps=["Reroute streaming traffic", "Log WARNING alert"],
        aggression=2, rollback_on_resolve=True,
    ),
    ("high_packet_loss", "event"): HealingStrategy(
        name="event_packet_loss_reroute",
        steps=["Reroute event traffic", "Log WARNING alert"],
        aggression=2, rollback_on_resolve=True,
    ),
    ("high_packet_loss", "free"): HealingStrategy(
        name="free_packet_loss_monitor",
        steps=["Log packet loss anomaly", "Schedule diagnostic scan"],
        aggression=1, rollback_on_resolve=True,
    ),

    # LINK DOWN × activity
    ("link_down", "exam"): HealingStrategy(
        name="exam_dual_path_failover",
        steps=[
            "Activate redundant uplink path IMMEDIATELY",
            "Mirror exam traffic across dual paths",
            "Issue halt-timer notification to ERP (exam clock pause)",
            "Send CRITICAL SMS/email alert to admin and invigilator",
            "Log incident report",
        ],
        aggression=5, rollback_on_resolve=False,
        notify_admin=True, erp_feedback=True,
        description="Dual-path failover with ERP exam timer pause notification.",
    ),
    ("link_down", "lab"): HealingStrategy(
        name="lab_failover",
        steps=[
            "Failover to redundant path with QoS preserved",
            "Notify admin",
            "Log WARNING alert",
        ],
        aggression=4, rollback_on_resolve=True, notify_admin=True,
    ),
    ("link_down", "lecture"): HealingStrategy(
        name="lecture_failover",
        steps=["Failover to redundant path", "Log WARNING alert"],
        aggression=3, rollback_on_resolve=True,
    ),
    ("link_down", "event"): HealingStrategy(
        name="event_failover",
        steps=["Best-effort failover", "Log WARNING"],
        aggression=3, rollback_on_resolve=True,
    ),
    ("link_down", "free"): HealingStrategy(
        name="free_failover",
        steps=["Best-effort failover", "Log INFO"],
        aggression=2, rollback_on_resolve=True,
    ),

    # UNAUTHORIZED TRAFFIC × activity
    ("unauthorized_traffic", "exam"): HealingStrategy(
        name="exam_unauthorized_block",
        steps=[
            "Immediately block source IP/MAC",
            "Log security incident to audit trail",
            "Alert admin: possible malpractice attempt",
            "Log ERP feedback: security violation during exam",
        ],
        aggression=5, rollback_on_resolve=False,
        notify_admin=True, erp_feedback=True,
        description="Zero-tolerance: block + audit during exam.",
    ),
    ("unauthorized_traffic", "lab"): HealingStrategy(
        name="lab_unauthorized_rate_limit",
        steps=["Rate-limit unauthorized service to 100Kbps", "Log WARNING"],
        aggression=3, rollback_on_resolve=True,
    ),
    ("unauthorized_traffic", "lecture"): HealingStrategy(
        name="lecture_unauthorized_log",
        steps=["Log unauthorized traffic", "Apply soft block if sustained"],
        aggression=1, rollback_on_resolve=True,
    ),
    ("unauthorized_traffic", "event"): HealingStrategy(
        name="event_unauthorized_log",
        steps=["Log unauthorized traffic"],
        aggression=1, rollback_on_resolve=True,
    ),
    ("unauthorized_traffic", "free"): HealingStrategy(
        name="free_unauthorized_monitor",
        steps=["Log traffic anomaly"],
        aggression=1, rollback_on_resolve=True,
    ),

    # LATENCY SPIKE × activity
    ("latency_spike", "exam"): HealingStrategy(
        name="exam_latency_qos_boost",
        steps=[
            "Boost DSCP marking to EF (46) for exam portal",
            "Flush routing cache on core switch",
            "Alert admin",
        ],
        aggression=4, rollback_on_resolve=True, notify_admin=True,
    ),
    ("latency_spike", "lab"): HealingStrategy(
        name="lab_latency_qos_boost",
        steps=["Boost QoS for lab services", "Log WARNING"],
        aggression=2, rollback_on_resolve=True,
    ),
    ("latency_spike", "lecture"): HealingStrategy(
        name="lecture_latency_monitor",
        steps=["Monitor latency trend", "Log INFO"],
        aggression=1, rollback_on_resolve=True,
    ),
    ("latency_spike", "event"): HealingStrategy(
        name="event_latency_monitor",
        steps=["Monitor latency trend", "Log INFO"],
        aggression=1, rollback_on_resolve=True,
    ),
    ("latency_spike", "free"): HealingStrategy(
        name="free_latency_log",
        steps=["Log latency anomaly"],
        aggression=1, rollback_on_resolve=True,
    ),
}

# Default strategy when no matrix entry found
DEFAULT_STRATEGY = HealingStrategy(
    name="generic_monitor",
    steps=["Log anomaly", "Monitor segment for 60 seconds", "Escalate if unresolved"],
    aggression=1, rollback_on_resolve=True,
)


def get_strategy(fault_type: str, activity_type: str) -> HealingStrategy:
    return CONTEXT_HEALING_MATRIX.get(
        (fault_type, activity_type),
        DEFAULT_STRATEGY,
    )
