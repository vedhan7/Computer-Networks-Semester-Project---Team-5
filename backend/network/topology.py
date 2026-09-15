"""
Network Topology definitions.
"""
from backend.config import SEGMENTS


def get_topology() -> list[dict]:
    """Returns segment tree as a flat list for API consumption."""
    result = []
    for seg_id, seg in SEGMENTS.items():
        result.append({
            "id": seg_id,
            "name": seg["name"],
            "parent_id": seg.get("parent_id"),
            "total_bandwidth_mbps": seg["total_bandwidth_mbps"],
            "device_count": seg.get("device_count", 0),
            "location": seg.get("location", ""),
        })
    return result


def get_children(segment_id: str) -> list[str]:
    return [sid for sid, seg in SEGMENTS.items() if seg.get("parent_id") == segment_id]


def get_segment(segment_id: str) -> dict | None:
    return SEGMENTS.get(segment_id)
