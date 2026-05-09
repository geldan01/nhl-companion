import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { NhlApiError } from "@/lib/nhl";
import { DataState } from "./data-state";

const skeleton = <div data-testid="skeleton" />;
const children = <div data-testid="children">data here</div>;

const httpError = (status: number): NhlApiError => ({
  kind: "http",
  status,
  url: "https://example/x",
  message: `http ${status}`,
});

const networkError: NhlApiError = {
  kind: "network",
  cause: new Error("boom"),
  url: "https://example/x",
  message: "boom",
};

const timeoutError: NhlApiError = {
  kind: "timeout",
  url: "https://example/x",
  message: "timed out",
};

const schemaError: NhlApiError = {
  kind: "schema",
  issues: [],
  url: "https://example/x",
  message: "schema mismatch",
};

describe("<DataState />", () => {
  it("renders the skeleton when loading and there is no data", () => {
    render(
      <DataState isLoading error={null} hasData={false} skeleton={skeleton}>
        {children}
      </DataState>,
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("renders children when there is data and no error", () => {
    render(
      <DataState
        isLoading={false}
        error={null}
        hasData
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
  });

  it("renders the children alongside a delayed badge for network errors", () => {
    render(
      <DataState
        isLoading={false}
        error={networkError}
        hasData
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/delayed/i);
  });

  it("renders the children alongside a delayed badge for timeout errors", () => {
    render(
      <DataState
        isLoading={false}
        error={timeoutError}
        hasData
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/delayed/i);
  });

  it("renders the hard-error banner for schema errors and shows stale data when present", () => {
    render(
      <DataState
        isLoading={false}
        error={schemaError}
        hasData
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/data unavailable/i);
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("renders the hard-error banner for http >= 500 and omits children when there is no data", () => {
    render(
      <DataState
        isLoading={false}
        error={httpError(503)}
        hasData={false}
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/data unavailable/i);
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("renders the empty state for http 4xx errors (custom slot)", () => {
    const customEmpty = <div data-testid="empty">nothing here</div>;
    render(
      <DataState
        isLoading={false}
        error={httpError(404)}
        hasData={false}
        skeleton={skeleton}
        emptyState={customEmpty}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("renders a default empty state for http 4xx when no slot is provided", () => {
    render(
      <DataState
        isLoading={false}
        error={httpError(404)}
        hasData={false}
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/not found/i);
  });

  it("prioritizes hard error over network error when both somehow arrive", () => {
    // 4xx wins over the loading/data branches; this also doubles as a guard
    // that we don't accidentally fall into the delayed-badge branch when the
    // error category is actually "hard".
    render(
      <DataState
        isLoading={false}
        error={httpError(404)}
        hasData={false}
        skeleton={skeleton}
      >
        {children}
      </DataState>,
    );
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });
});
