import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsModal from "./SettingsModal";
import { clearErrorLog, logError } from "../utils/errorLog";
import { getLanguage, setLanguage } from "../locales";

beforeEach(() => {
  clearErrorLog();
});

describe("SettingsModal connection status", () => {
  it("shows green Connected with the last sync time when healthy", () => {
    const lastSync = new Date("2026-07-20T10:30:00");
    render(<SettingsModal connected lastSync={lastSync} onRefresh={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText(/Last sync/)).toBeInTheDocument();
  });

  it("shows the connection error and message when unhealthy", () => {
    render(
      <SettingsModal connected={false} errorMessage="Cannot reach Baby Buddy" onRefresh={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText("Connection error")).toBeInTheDocument();
    expect(screen.getByText("Cannot reach Baby Buddy")).toBeInTheDocument();
    expect(screen.queryByText(/Last sync/)).not.toBeInTheDocument();
  });

  it("calls onRefresh when the refresh icon is clicked", () => {
    const onRefresh = vi.fn();
    render(<SettingsModal connected onRefresh={onRefresh} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("SettingsModal language selector", () => {
  afterEach(() => setLanguage("en"));

  it("offers all three languages and switches the active one on click", () => {
    render(<SettingsModal connected onRefresh={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italiano" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deutsch" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));
    expect(getLanguage()).toBe("it");
  });

  it("re-renders its own text in the newly selected language", () => {
    render(<SettingsModal connected onRefresh={vi.fn()} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));
    expect(screen.getByText("Connesso")).toBeInTheDocument();
  });
});

describe("SettingsModal error log", () => {
  it("shows the empty state when there are no logged errors", () => {
    render(<SettingsModal connected onRefresh={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/No errors recorded/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export log/ })).toBeDisabled();
  });

  it("lists logged errors and enables export/clear", () => {
    logError("Save feeding", "Network request failed");
    render(<SettingsModal connected onRefresh={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText("Network request failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export log/ })).toBeEnabled();
  });

  it("clears the log when Clear is clicked", () => {
    logError("Save note", "boom");
    render(<SettingsModal connected onRefresh={vi.fn()} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(screen.getByText(/No errors recorded/)).toBeInTheDocument();
  });
});
