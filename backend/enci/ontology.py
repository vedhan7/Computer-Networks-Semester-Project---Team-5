"""
ENCI — Academic Event Ontology
Novel Contribution #1: Semantic mapping of academic event types to network resource signatures.
"""
from dataclasses import dataclass, field


@dataclass
class EventProfile:
    primary_services: list[str]
    secondary_services: list[str]
    blocked_services: list[str]
    bandwidth_model: str       # streaming_per_user | bursty_per_user | guaranteed_per_user
    security_level: int        # 1=open … 5=lockdown
    latency_sensitivity: str   # low | medium | high | critical
    qos_dscp: int              # DSCP marking (46=EF, 34=AF41, 18=AF21, 0=BE)
    description: str = ""


ACADEMIC_EVENT_ONTOLOGY: dict[str, EventProfile] = {
    "lecture": EventProfile(
        primary_services=["video_stream", "presentation_share", "lms", "video_conf"],
        secondary_services=["general_web", "documentation"],
        blocked_services=[],
        bandwidth_model="streaming_per_user",
        security_level=1,
        latency_sensitivity="medium",
        qos_dscp=18,  # AF21 — video streaming
        description="Lecture sessions require stable video streaming and LMS access.",
    ),
    "lab": EventProfile(
        primary_services=["compiler_tools", "ide_sync", "package_manager", "lms", "repo_access"],
        secondary_services=["documentation_sites", "stackoverflow"],
        blocked_services=["streaming_media", "social_media", "gaming", "video_conf_non_lab"],
        bandwidth_model="bursty_per_user",
        security_level=2,
        latency_sensitivity="high",
        qos_dscp=34,  # AF41 — interactive real-time
        description="Lab sessions generate bursty traffic due to IDE syncs and package downloads.",
    ),
    "exam": EventProfile(
        primary_services=["exam_portal"],
        secondary_services=["lms_readonly"],
        blocked_services=[
            "streaming_media", "social_media", "vpn", "gaming",
            "general_web", "chat_apps", "cloud_storage", "package_manager",
            "compiler_tools", "video_conf", "repo_access",
        ],
        bandwidth_model="guaranteed_per_user",
        security_level=5,
        latency_sensitivity="critical",
        qos_dscp=46,  # EF — Expedited Forwarding, highest priority
        description="Exams demand guaranteed bandwidth for exam portal, strict security lockdown.",
    ),
    "event": EventProfile(
        primary_services=["video_stream", "presentation_share", "general_web", "chat_apps"],
        secondary_services=["social_media", "documentation"],
        blocked_services=["gaming"],
        bandwidth_model="streaming_per_user",
        security_level=1,
        latency_sensitivity="medium",
        qos_dscp=18,
        description="Campus events require flexible bandwidth with streaming support.",
    ),
    "free": EventProfile(
        primary_services=["general_web", "social_media", "streaming_media"],
        secondary_services=["gaming", "cloud_storage"],
        blocked_services=[],
        bandwidth_model="best_effort",
        security_level=1,
        latency_sensitivity="low",
        qos_dscp=0,  # Best Effort
        description="Free periods use best-effort allocation with no special policies.",
    ),
}
