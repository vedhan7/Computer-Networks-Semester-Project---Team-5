"""
SQLite schema and connection pool for ACORN.
"""
import aiosqlite
import asyncio
from pathlib import Path
from backend.config import DB_PATH

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        _db = await aiosqlite.connect(DB_PATH)
        _db.row_factory = aiosqlite.Row
        await _db.execute("PRAGMA journal_mode=WAL")
        await _db.execute("PRAGMA foreign_keys=ON")
    return _db


SCHEMA = """
CREATE TABLE IF NOT EXISTS academic_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    department TEXT,
    venue TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    expected_users INTEGER NOT NULL,
    bandwidth_profile TEXT NOT NULL,
    requires_security_lockdown INTEGER DEFAULT 0,
    network_segments TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS network_segments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    total_bandwidth_mbps INTEGER NOT NULL,
    device_count INTEGER DEFAULT 0,
    location TEXT
);

CREATE TABLE IF NOT EXISTS staged_intents (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    raw_text TEXT,
    action TEXT NOT NULL,
    target_services TEXT,
    target_segments TEXT,
    bandwidth_mbps INTEGER,
    priority INTEGER DEFAULT 50,
    policy_json TEXT,
    lifecycle_status TEXT NOT NULL DEFAULT 'draft',
    erp_event_id TEXT,
    stage_time TEXT,
    arm_time TEXT,
    activate_time TEXT,
    expire_time TEXT,
    apcr_conflict TEXT,
    apcr_resolution TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS policy_rules (
    id TEXT PRIMARY KEY,
    rule_type TEXT NOT NULL,
    source_intent_id TEXT NOT NULL,
    zone TEXT NOT NULL,
    parameters TEXT NOT NULL,
    applied_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 50
);

CREATE TABLE IF NOT EXISTS network_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_json TEXT NOT NULL,
    campus_cnhs REAL,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cnhs_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id TEXT NOT NULL,
    cnhs REAL NOT NULL,
    observed_utilization REAL,
    predicted_utilization REAL,
    context TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS healing_log (
    id TEXT PRIMARY KEY,
    fault_type TEXT NOT NULL,
    fault_severity TEXT NOT NULL,
    segment_id TEXT NOT NULL,
    context TEXT NOT NULL,
    strategy_name TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    success INTEGER NOT NULL DEFAULT 1,
    resolution_seconds REAL,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS apcr_log (
    id TEXT PRIMARY KEY,
    intent_a_id TEXT,
    intent_b_id TEXT,
    resolution_action TEXT,
    academic_justification TEXT,
    bandwidth_reassignment TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS erp_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_id TEXT,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demand_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    expected_users INTEGER,
    hour_of_day INTEGER,
    observed_utilization REAL NOT NULL,
    timestamp TEXT DEFAULT (datetime('now'))
);
"""


async def init_db():
    db = await get_db()
    await db.executescript(SCHEMA)
    await db.commit()
