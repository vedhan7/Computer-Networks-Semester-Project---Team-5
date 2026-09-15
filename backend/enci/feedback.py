"""
ENCI Feedback — bidirectional ERP notifications.
"""
from datetime import datetime
from backend.db.connection import get_db


async def log_feedback(event_type: str, event_id: str | None, message: str, severity: str = "info"):
    db = await get_db()
    await db.execute(
        "INSERT INTO erp_feedback (event_type, event_id, message, severity) VALUES (?, ?, ?, ?)",
        (event_type, event_id, message, severity),
    )
    await db.commit()
    print(f"[ENCI Feedback] [{severity.upper()}] {message}")


async def get_feedback_log(limit: int = 50) -> list[dict]:
    db = await get_db()
    cursor = await db.execute(
        "SELECT * FROM erp_feedback ORDER BY timestamp DESC LIMIT ?", (limit,)
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]
