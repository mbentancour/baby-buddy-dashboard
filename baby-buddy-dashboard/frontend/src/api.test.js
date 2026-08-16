import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api } from "./api";

/** api.js always calls the global fetch - stub it so every test in this file
 * runs with zero real network calls (per project constraint: mocked tests only). */
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe("api request building", () => {
  it("GETs against the local proxy path, not a direct Baby Buddy URL", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
    await api.getChildren();
    expect(fetch).toHaveBeenCalledWith("./api/baby-buddy/children/", expect.any(Object));
  });

  it("serializes query params, dropping null/empty values", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
    await api.getMedication({ child: 1, limit: 30, ordering: null, extra: "" });
    const [url] = fetch.mock.calls[0];
    expect(url).toBe("./api/baby-buddy/medication/?child=1&limit=30");
  });

  it("sends POST bodies as JSON with the right method", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
    await api.createNote({ note: "hi" });
    const [url, config] = fetch.mock.calls[0];
    expect(url).toBe("./api/baby-buddy/notes/");
    expect(config.method).toBe("POST");
    expect(config.body).toBe(JSON.stringify({ note: "hi" }));
  });

  it("sends DELETE requests to the entry's own URL", async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await api.deleteTemperature(42);
    const [url, config] = fetch.mock.calls[0];
    expect(url).toBe("./api/baby-buddy/temperature/42/");
    expect(config.method).toBe("DELETE");
  });

  it("returns null for a 204 No Content response", async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await expect(api.deleteNote(1)).resolves.toBeNull();
  });

  it("throws with the status code on a non-ok response", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ detail: "not found" }, { status: 404 }));
    await expect(api.getWeight()).rejects.toThrow(/API error 404/);
  });
});

describe("clock skew diagnostic on API errors", () => {
  // Regression coverage for a real report: "Date/time can not be in the future" on a
  // payload that was already computed correctly (see toApiDatetime). The backend forwards
  // Baby Buddy's own Date response header as X-Baby-Buddy-Date (not as `Date` - uvicorn
  // always emits its own `Date`, so reusing that name would produce two headers merged into
  // one unparseable string by the browser). Comparing it against the device's clock at the
  // same instant tells us whether a "future" rejection is a genuine clock skew.
  it("appends a device-vs-server clock comparison when the backend forwarded Baby Buddy's Date header", async () => {
    fetch.mockResolvedValueOnce(
      jsonResponse(
        { time: ["Date/time can not be in the future."] },
        { status: 400, headers: { "X-Baby-Buddy-Date": "Mon, 01 Jan 2024 00:00:00 GMT" } }
      )
    );
    await expect(api.getWeight()).rejects.toThrow(
      /clockCheck: device=.+ server=2024-01-01T00:00:00\.000Z deviceAheadByMs=\d+/
    );
  });

  it("does not append anything when the header is absent (e.g. a network-layer error with no upstream response)", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ detail: "bad request" }, { status: 400 }));
    await expect(api.getWeight()).rejects.not.toThrow(/clockCheck/);
  });
});

describe("request timeout", () => {
  // A request that just never settles (dead wifi, a backgrounded mobile tab, a proxy that
  // drops the response) must not hang forever - especially getConfig(), whose promise
  // chain gates the whole app's initial loading spinner.
  function hangingFetchRespectingAbort() {
    return vi.fn((url, options) => {
      return new Promise((resolve, reject) => {
        options?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aborts a hung API request after the timeout and rejects instead of hanging forever", async () => {
    vi.stubGlobal("fetch", hangingFetchRespectingAbort());
    const promise = api.getChildren();
    const assertion = expect(promise).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });

  it("aborts a hung getConfig() request after the timeout and rejects instead of hanging forever", async () => {
    vi.stubGlobal("fetch", hangingFetchRespectingAbort());
    const promise = api.getConfig();
    const assertion = expect(promise).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });

  it("passes an abort signal to fetch so a real browser request actually cancels", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await api.getChildren();
    const [, config] = fetchMock.mock.calls[0];
    expect(config.signal).toBeInstanceOf(AbortSignal);
  });

  it("does not time out a request that resolves well within the deadline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse({ results: [] })));
    await expect(api.getChildren()).resolves.toEqual({ results: [] });
  });
});
