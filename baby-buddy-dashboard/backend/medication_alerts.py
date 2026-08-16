"""Checks Baby Buddy medication doses for overdue status and mirrors
the result into a single Home Assistant binary_sensor, so users can
build their own HA automations (notifications, etc.) on top of it.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

logger = logging.getLogger(__name__)

CHECK_INTERVAL_SECONDS = 300
ENTITY_ID = "binary_sensor.baby_buddy_medication_overdue"


def parse_duration_hours(value):
    """Parse a Django DurationField string ("HH:MM:SS" or "D HH:MM:SS") into hours."""
    if not value:
        return None
    parts = str(value).strip().split(" ")
    if len(parts) > 1:
        days = float(parts[0])
        hms = parts[1].split(":")
    else:
        days = 0.0
        hms = parts[0].split(":")
    hours = float(hms[0]) if len(hms) > 0 else 0.0
    minutes = float(hms[1]) if len(hms) > 1 else 0.0
    seconds = float(hms[2]) if len(hms) > 2 else 0.0
    total = days * 24 + hours + minutes / 60 + seconds / 3600
    return total or None


def is_any_medication_overdue(medications, now=None):
    """medications: list of Baby Buddy medication dicts (name, time, next_dose_interval).
    Only the latest dose per medication name is considered, matching the frontend's logic.
    """
    now = now or datetime.now(timezone.utc)
    latest_by_name = {}
    for m in medications:
        if not m.get("next_dose_interval"):
            continue
        name = m.get("name")
        existing = latest_by_name.get(name)
        if not existing or m["time"] > existing["time"]:
            latest_by_name[name] = m

    for m in latest_by_name.values():
        hours = parse_duration_hours(m.get("next_dose_interval"))
        if hours is None:
            continue
        dose_time = datetime.fromisoformat(m["time"])
        due_at = dose_time + timedelta(hours=hours)
        if now > due_at:
            return True
    return False


async def _check_once(baby_buddy_client: httpx.AsyncClient, now=None) -> bool:
    """baby_buddy_client is the app's shared proxy client - its base_url is the bare
    Baby Buddy host, so paths here need the same "/api/" prefix the HTTP proxy route adds."""
    children_res = await baby_buddy_client.get("/api/children/")
    children_res.raise_for_status()
    children = children_res.json().get("results", [])

    for child in children:
        meds_res = await baby_buddy_client.get(
            "/api/medication/",
            params={"child": child["id"], "limit": 30, "ordering": "-time"},
        )
        meds_res.raise_for_status()
        medications = meds_res.json().get("results", [])
        if is_any_medication_overdue(medications, now=now):
            return True
    return False


async def _publish_state(ha_client: httpx.AsyncClient, overdue: bool):
    await ha_client.post(
        f"/states/{ENTITY_ID}",
        json={
            "state": "on" if overdue else "off",
            "attributes": {
                "friendly_name": "Baby Buddy Medication Overdue",
                "device_class": "problem",
                "icon": "mdi:pill",
            },
        },
    )


async def run_medication_alert_loop(baby_buddy_client: httpx.AsyncClient, supervisor_token: str):
    """Runs forever until cancelled. Never raises - logs and retries on failure."""
    async with httpx.AsyncClient(
        base_url="http://supervisor/core/api",
        headers={"Authorization": f"Bearer {supervisor_token}", "Content-Type": "application/json"},
        timeout=10.0,
    ) as ha_client:
        while True:
            try:
                overdue = await _check_once(baby_buddy_client)
                await _publish_state(ha_client, overdue)
            except Exception:
                logger.warning("Medication alert check failed, will retry next cycle", exc_info=True)
            await asyncio.sleep(CHECK_INTERVAL_SECONDS)
