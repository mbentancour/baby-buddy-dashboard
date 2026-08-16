import asyncio
import json
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from backend.medication_alerts import (
    ENTITY_ID,
    is_any_medication_overdue,
    parse_duration_hours,
    run_medication_alert_loop,
    _check_once,
    _publish_state,
)

NOW = datetime.now(timezone.utc)


def dose(hours_ago, interval, name="Tylenol"):
    return {
        "name": name,
        "time": (NOW - timedelta(hours=hours_ago)).isoformat(),
        "next_dose_interval": interval,
    }


class TestParseDurationHours:
    def test_none_and_empty_return_none(self):
        assert parse_duration_hours(None) is None
        assert parse_duration_hours("") is None

    def test_hms_only(self):
        assert parse_duration_hours("06:00:00") == 6.0
        assert parse_duration_hours("00:30:00") == 0.5

    def test_days_prefix(self):
        assert parse_duration_hours("1 00:00:00") == 24.0
        assert parse_duration_hours("2 12:00:00") == 60.0

    def test_zero_duration_is_treated_as_none(self):
        # Matches the frontend's `parseDurationHours` (`return hours || null`).
        assert parse_duration_hours("00:00:00") is None


class TestIsAnyMedicationOverdue:
    def test_empty_list(self):
        assert is_any_medication_overdue([], now=NOW) is False

    def test_not_yet_due(self):
        assert is_any_medication_overdue([dose(2, "06:00:00")], now=NOW) is False

    def test_overdue(self):
        assert is_any_medication_overdue([dose(8, "06:00:00")], now=NOW) is True

    def test_ignores_doses_without_interval(self):
        meds = [dose(100, None, name="Vitamin D")]
        assert is_any_medication_overdue(meds, now=NOW) is False

    def test_only_latest_dose_per_name_counts(self):
        meds = [
            dose(8, "06:00:00"),  # would be overdue alone...
            dose(1, "06:00:00"),  # ...but this is the latest dose for the same name
        ]
        assert is_any_medication_overdue(meds, now=NOW) is False

    def test_one_overdue_among_several_is_enough(self):
        meds = [
            dose(1, "06:00:00", name="Vitamin D"),
            dose(8, "06:00:00", name="Tylenol"),
        ]
        assert is_any_medication_overdue(meds, now=NOW) is True


def make_baby_buddy_client(children, medications_by_child):
    """An httpx.AsyncClient backed entirely by MockTransport - no real network access.
    Mirrors the real shared client: base_url is the bare host, paths carry "/api/"."""

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/children/":
            return httpx.Response(200, json={"results": children})
        if request.url.path == "/api/medication/":
            child_id = request.url.params.get("child")
            return httpx.Response(200, json={"results": medications_by_child.get(child_id, [])})
        return httpx.Response(404)

    return httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://fake-baby-buddy")


async def test_check_once_detects_overdue_across_children():
    client = make_baby_buddy_client(
        children=[{"id": 1}, {"id": 2}],
        medications_by_child={"1": [dose(8, "06:00:00")], "2": []},
    )
    async with client:
        assert await _check_once(client, now=NOW) is True


async def test_check_once_false_when_nobody_overdue():
    client = make_baby_buddy_client(
        children=[{"id": 1}],
        medications_by_child={"1": [dose(1, "06:00:00")]},
    )
    async with client:
        assert await _check_once(client, now=NOW) is False


async def test_publish_state_posts_expected_entity_and_state():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://supervisor/core/api") as client:
        await _publish_state(client, overdue=True)

    assert captured["url"] == f"http://supervisor/core/api/states/{ENTITY_ID}"
    assert captured["body"]["state"] == "on"

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://supervisor/core/api") as client:
        await _publish_state(client, overdue=False)
    assert captured["body"]["state"] == "off"


async def test_run_medication_alert_loop_checks_and_publishes_then_cancels_cleanly(monkeypatch):
    """One full cycle (fetch Baby Buddy medications -> publish to HA) with zero real network
    calls, followed by proving the otherwise-infinite loop stops cleanly on cancellation."""
    import backend.medication_alerts as mod

    monkeypatch.setattr(mod, "CHECK_INTERVAL_SECONDS", 0)

    bb_client = make_baby_buddy_client(
        children=[{"id": 1}],
        medications_by_child={"1": [dose(8, "06:00:00")]},
    )

    ha_calls = []

    def ha_handler(request: httpx.Request) -> httpx.Response:
        ha_calls.append((str(request.url), json.loads(request.content)))
        return httpx.Response(200, json={})

    real_async_client_init = httpx.AsyncClient.__init__

    def patched_init(self, *args, **kwargs):
        if kwargs.get("base_url") == "http://supervisor/core/api":
            kwargs["transport"] = httpx.MockTransport(ha_handler)
        real_async_client_init(self, *args, **kwargs)

    monkeypatch.setattr(httpx.AsyncClient, "__init__", patched_init)

    task = asyncio.create_task(run_medication_alert_loop(bb_client, "fake-supervisor-token"))
    try:
        for _ in range(100):
            if ha_calls:
                break
            await asyncio.sleep(0)
    finally:
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        await bb_client.aclose()

    assert len(ha_calls) >= 1
    url, body = ha_calls[0]
    assert url == f"http://supervisor/core/api/states/{ENTITY_ID}"
    assert body["state"] == "on"
