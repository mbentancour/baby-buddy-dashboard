import json

import httpx
import pytest

import backend.server as server_mod


@pytest.fixture
def app_client(monkeypatch):
    """An in-process ASGI client for the FastAPI app with server.http_client swapped for a
    MockTransport-backed client, so proxy routes never touch a real Baby Buddy instance."""
    calls = []

    def bb_handler(request: httpx.Request) -> httpx.Response:
        calls.append({"method": request.method, "path": request.url.path, "params": dict(request.url.params)})
        if request.url.path == "/api/children/":
            return httpx.Response(200, json={"results": [{"id": 1, "first_name": "Emma"}]})
        if request.url.path == "/api/notes/5/":
            return httpx.Response(200, json={"id": 5, "note": "hello"})
        return httpx.Response(200, json={"results": []})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(bb_handler), base_url="http://fake-baby-buddy")
    monkeypatch.setattr(server_mod, "http_client", mock_client)

    transport = httpx.ASGITransport(app=server_mod.app)
    client = httpx.AsyncClient(transport=transport, base_url="http://testserver")
    client.calls = calls
    return client


async def test_get_config_returns_settings_without_secrets():
    transport = httpx.ASGITransport(app=server_mod.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/config")
    assert res.status_code == 200
    body = res.json()
    assert "refresh_interval" in body
    assert "demo_mode" in body
    assert "unit_system" in body
    assert "child_sex" in body
    assert "baby_buddy_api_key" not in json.dumps(body)


async def test_get_config_theme_has_both_modes_with_all_seven_fields():
    transport = httpx.ASGITransport(app=server_mod.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/config")
    theme = res.json()["theme"]
    assert set(theme.keys()) == {"light", "dark"}
    expected_fields = {"bg", "cardBg", "border", "text", "textMuted", "textDim", "accent"}
    assert set(theme["light"].keys()) == expected_fields
    assert set(theme["dark"].keys()) == expected_fields


@pytest.mark.parametrize(
    "raw,expected",
    [("male", "male"), ("female", "female"), ("", ""), ("null", ""), ("Male", ""), (None, "")],
)
def test_sanitize_child_sex_rejects_invalid_values(raw, expected):
    assert server_mod.sanitize_child_sex(raw) == expected


def test_read_theme_mode_from_env_reads_all_seven_fields(monkeypatch):
    monkeypatch.setenv("THEME_LIGHT_BG", "#F5F2EA")
    monkeypatch.setenv("THEME_LIGHT_CARD_BG", "#FDFCF8")
    monkeypatch.setenv("THEME_LIGHT_ACCENT", "#2A9D8F")
    mode = server_mod.read_theme_mode_from_env("light")
    assert mode["bg"] == "#F5F2EA"
    assert mode["cardBg"] == "#FDFCF8"
    assert mode["accent"] == "#2A9D8F"
    # Unset fields default to empty string, not a missing key.
    assert mode["border"] == ""
    assert set(mode.keys()) == {"bg", "cardBg", "border", "text", "textMuted", "textDim", "accent"}


def test_read_theme_mode_from_env_treats_literal_null_string_as_unset(monkeypatch):
    # bashio::config returns the literal string "null" (not "") for an unset optional
    # field on some Supervisor versions - run.sh's `bashio::config 'theme_light_border' ''`
    # can still end up exporting THEME_LIGHT_BORDER=null. If that leaked through as-is it
    # would render `--border: null;` (invalid CSS, resolves to transparent) instead of
    # being skipped like a genuinely empty field.
    monkeypatch.setenv("THEME_LIGHT_BG", "#F5F2EA")
    monkeypatch.setenv("THEME_LIGHT_BORDER", "null")
    mode = server_mod.read_theme_mode_from_env("light")
    assert mode["bg"] == "#F5F2EA"
    assert mode["border"] == ""


@pytest.mark.parametrize("raw,expected", [("#2A9D8F", "#2A9D8F"), ("", ""), ("null", ""), (None, "")])
def test_sanitize_theme_value(raw, expected):
    assert server_mod.sanitize_theme_value(raw) == expected


def test_fill_theme_mode_from_options_only_fills_gaps():
    current = {"bg": "#111111", "cardBg": "", "border": "", "text": "", "textMuted": "", "textDim": "", "accent": ""}
    opts = {
        "theme_light_bg": "#FROM_OPTIONS_SHOULD_NOT_WIN",
        "theme_light_card_bg": "#222222",
    }
    result = server_mod.fill_theme_mode_from_options("light", current, opts)
    assert result["bg"] == "#111111"  # env var value wins, not overwritten
    assert result["cardBg"] == "#222222"  # gap filled from options.json
    assert result["border"] == ""  # stays empty, not present in opts


def test_fill_theme_mode_from_options_treats_literal_null_string_as_unset():
    current = {"bg": "", "cardBg": "", "border": "", "text": "", "textMuted": "", "textDim": "", "accent": ""}
    opts = {"theme_light_card_bg": "null"}
    result = server_mod.fill_theme_mode_from_options("light", current, opts)
    assert result["cardBg"] == ""


@pytest.mark.parametrize("raw,expected", [("teal_terracotta", "teal_terracotta"), ("", ""), ("bogus", ""), (None, "")])
def test_sanitize_color_preset(raw, expected):
    assert server_mod.sanitize_color_preset(raw) == expected


def test_fill_theme_mode_from_preset_only_fills_gaps():
    current = {"bg": "#CUSTOM", "cardBg": "", "border": "", "text": "", "textMuted": "", "textDim": "", "accent": ""}
    preset_mode = server_mod.THEME_PRESETS["teal_terracotta"]["light"]
    result = server_mod.fill_theme_mode_from_preset(current, preset_mode)
    assert result["bg"] == "#CUSTOM"  # explicit value wins, not overwritten by the preset
    assert result["cardBg"] == preset_mode["cardBg"]  # gap filled from the preset
    assert result["accent"] == preset_mode["accent"]


def test_theme_presets_have_all_seven_fields_for_both_modes():
    expected_fields = {"bg", "cardBg", "border", "text", "textMuted", "textDim", "accent"}
    for preset in server_mod.THEME_PRESETS.values():
        assert set(preset["light"].keys()) == expected_fields
        assert set(preset["dark"].keys()) == expected_fields


FULL_LIGHT_THEME = {
    "bg": "#F5F2EA", "cardBg": "#FDFCF8", "border": "rgba(40, 30, 16, 0.08)",
    "text": "#1B1812", "textMuted": "#6B6557", "textDim": "#A8A294", "accent": "#2A9D8F",
}
FULL_DARK_THEME = {
    "bg": "#14110C", "cardBg": "#1C1814", "border": "rgba(245, 242, 234, 0.08)",
    "text": "#F2EFE6", "textMuted": "#A8A294", "textDim": "#6B6557", "accent": "#3FB8A9",
}


# Mirrors frontend/src/utils/theme.test.js's coverage of buildThemeCss - build_theme_css is
# a direct Python port, used to inline the theme into index.html's <head> server-side so
# the correct colors are present at first paint (see build_theme_css's docstring).
def test_build_theme_css_empty_when_nothing_configured():
    assert server_mod.build_theme_css({}) == ""
    assert server_mod.build_theme_css({"light": {}, "dark": {}}) == ""


def test_build_theme_css_emits_only_light_block_when_only_light_is_complete():
    css = server_mod.build_theme_css({"light": FULL_LIGHT_THEME})
    assert "prefers-color-scheme: light" in css
    assert "prefers-color-scheme: dark" not in css
    assert "--bg: #F5F2EA;" in css
    assert "--accent: #2A9D8F;" in css


def test_build_theme_css_emits_both_blocks_when_both_modes_are_complete():
    css = server_mod.build_theme_css({"light": FULL_LIGHT_THEME, "dark": FULL_DARK_THEME})
    assert "prefers-color-scheme: light" in css
    assert "prefers-color-scheme: dark" in css
    assert "--bg: #14110C;" in css


def test_build_theme_css_skips_a_mode_missing_even_one_field():
    partial_light = {**FULL_LIGHT_THEME, "text": ""}
    css = server_mod.build_theme_css({"light": partial_light, "dark": FULL_DARK_THEME})
    assert "prefers-color-scheme: light" not in css
    assert "prefers-color-scheme: dark" in css


def test_build_theme_css_maps_every_color_token_to_its_css_custom_property():
    css = server_mod.build_theme_css({"light": FULL_LIGHT_THEME})
    assert "--card-bg: #FDFCF8;" in css
    assert "--border: rgba(40, 30, 16, 0.08);" in css
    assert "--text-muted: #6B6557;" in css
    assert "--text-dim: #A8A294;" in css


SAMPLE_HEAD_HTML = (
    "<head><meta charset='UTF-8'>"
    "<script type='module' src='./assets/index-ABC.js'></script>"
    "<link rel='stylesheet' href='./assets/index-XYZ.css'></head><body></body>"
)


def test_inject_theme_css_places_the_override_after_the_stylesheet_link():
    # Regression test for a real bug: the override was originally injected right after
    # <head> (i.e. BEFORE the built stylesheet's <link>). The stylesheet declares the base
    # `:root` variables unconditionally, at the same specificity as this override's
    # `@media (...) { :root {...} } ` block - for equal specificity the LAST declaration in
    # the document wins, so injecting before the stylesheet silently discarded the override
    # every time, regardless of which prefers-color-scheme actually matched. Verified live
    # with Playwright: before the fix, body background stayed the default dark even under
    # `emulateMedia({ colorScheme: 'light' })`; after, it resolved to the configured light bg.
    result = server_mod.inject_theme_css(SAMPLE_HEAD_HTML, {"light": FULL_LIGHT_THEME})
    style_pos = result.index('id="custom-theme-overrides"')
    link_pos = result.index("<link")
    assert style_pos > link_pos


def test_inject_theme_css_is_a_noop_when_theme_is_unconfigured():
    assert server_mod.inject_theme_css(SAMPLE_HEAD_HTML, {"light": {}, "dark": {}}) == SAMPLE_HEAD_HTML


def test_inject_theme_css_includes_both_modes_when_both_are_complete():
    result = server_mod.inject_theme_css(SAMPLE_HEAD_HTML, {"light": FULL_LIGHT_THEME, "dark": FULL_DARK_THEME})
    assert "prefers-color-scheme: light" in result
    assert "prefers-color-scheme: dark" in result


async def test_proxy_baby_buddy_forwards_get_request(app_client):
    async with app_client as client:
        res = await client.get("/api/baby-buddy/children/")
    assert res.status_code == 200
    assert res.json()["results"][0]["first_name"] == "Emma"
    assert client.calls[0] == {"method": "GET", "path": "/api/children/", "params": {}}


async def test_proxy_baby_buddy_forwards_query_params(app_client):
    async with app_client as client:
        res = await client.get("/api/baby-buddy/medication/", params={"child": "1", "limit": "30"})
    assert res.status_code == 200
    assert client.calls[0]["params"] == {"child": "1", "limit": "30"}


async def test_proxy_baby_buddy_forwards_delete(app_client):
    async with app_client as client:
        res = await client.delete("/api/baby-buddy/notes/5/")
    assert res.status_code == 200
    assert client.calls[0]["method"] == "DELETE"
    assert client.calls[0]["path"] == "/api/notes/5/"


async def test_proxy_baby_buddy_connect_error_returns_502(monkeypatch):
    def failing_handler(request: httpx.Request):
        raise httpx.ConnectError("boom", request=request)

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(failing_handler), base_url="http://fake-baby-buddy/api")
    monkeypatch.setattr(server_mod, "http_client", mock_client)

    transport = httpx.ASGITransport(app=server_mod.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/baby-buddy/children/")
    assert res.status_code == 502


async def test_proxy_baby_buddy_timeout_returns_504(monkeypatch):
    def timeout_handler(request: httpx.Request):
        raise httpx.TimeoutException("boom", request=request)

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(timeout_handler), base_url="http://fake-baby-buddy/api")
    monkeypatch.setattr(server_mod, "http_client", mock_client)

    transport = httpx.ASGITransport(app=server_mod.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/baby-buddy/children/")
    assert res.status_code == 504


async def test_proxy_media_returns_404_when_baby_buddy_404s(monkeypatch):
    def not_found_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404)

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(not_found_handler), base_url="http://fake-baby-buddy/api")
    monkeypatch.setattr(server_mod, "http_client", mock_client)

    transport = httpx.ASGITransport(app=server_mod.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/media/uploads/photo.jpg")
    assert res.status_code == 404


async def test_proxy_forwards_baby_buddy_date_under_a_different_header_name(monkeypatch):
    # Regression test for a real diagnostic bug: uvicorn's own HTTP layer always emits its
    # own `Date` header regardless of what's in the ASGI response's headers - forwarding Baby
    # Buddy's own Date under the same name produced two "date" headers in the raw HTTP
    # response, which browsers merge into one comma-joined, unparseable string. Verifies the
    # proxy excludes "date" from the raw passthrough and forwards Baby Buddy's value under
    # X-Baby-Buddy-Date instead, which no other layer will also emit.
    def dated_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"results": []}, headers={"Date": "Mon, 01 Jan 2024 00:00:00 GMT"})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(dated_handler), base_url="http://fake-baby-buddy/api")
    monkeypatch.setattr(server_mod, "http_client", mock_client)

    transport = httpx.ASGITransport(app=server_mod.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/baby-buddy/children/")
    assert res.headers.get("x-baby-buddy-date") == "Mon, 01 Jan 2024 00:00:00 GMT"
    # httpx.Headers normalizes access to be case-insensitive and single-valued per name -
    # this confirms the raw Baby Buddy value isn't ALSO forwarded verbatim as "date".
    assert res.headers.get("date") != "Mon, 01 Jan 2024 00:00:00 GMT"
