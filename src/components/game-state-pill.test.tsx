import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameStatePill, pillText } from "./game-state-pill";

describe("pillText", () => {
  it("renders LIVE with period and clock when both are present", () => {
    expect(pillText({ state: "LIVE", period: 2, clock: "8:14" })).toBe("LIVE 2P 8:14");
  });

  it("treats CRIT identically to LIVE", () => {
    expect(pillText({ state: "CRIT", period: 3, clock: "0:23" })).toBe("LIVE 3P 0:23");
  });

  it("renders LIVE without period/clock when missing", () => {
    expect(pillText({ state: "LIVE" })).toBe("LIVE");
  });

  it("renders OT for period 4 and 2OT for period 5", () => {
    expect(pillText({ state: "LIVE", period: 4, clock: "1:00" })).toBe("LIVE OT 1:00");
    expect(pillText({ state: "LIVE", period: 5, clock: "1:00" })).toBe("LIVE 2OT 1:00");
  });

  it("renders FINAL for FINAL and OFF", () => {
    expect(pillText({ state: "FINAL" })).toBe("FINAL");
    expect(pillText({ state: "OFF" })).toBe("FINAL");
  });

  it("renders the formatted start time for PRE/FUT when provided", () => {
    const time = "2026-05-09T23:00:00Z";
    const got = pillText({ state: "PRE", startTimeUTC: time });
    // Locale-dependent format; assert it looks like a clock value.
    expect(got).toMatch(/\d{1,2}:\d{2}/);
  });

  it("renders SCHEDULED for PRE/FUT without a start time", () => {
    expect(pillText({ state: "PRE" })).toBe("SCHEDULED");
    expect(pillText({ state: "FUT" })).toBe("SCHEDULED");
  });

  it("falls through to the raw state string for unknown values", () => {
    expect(pillText({ state: "MYSTERY" })).toBe("MYSTERY");
  });
});

describe("<GameStatePill />", () => {
  it("uses the live color class for LIVE state", () => {
    render(<GameStatePill state="LIVE" period={1} clock="5:00" />);
    const pill = screen.getByText(/LIVE 1P 5:00/);
    expect(pill.className).toMatch(/text-\(--live\)/);
  });

  it("uses the muted color class for FINAL state", () => {
    render(<GameStatePill state="FINAL" />);
    const pill = screen.getByText("FINAL");
    expect(pill.className).toMatch(/text-\(--text-muted\)/);
  });
});
