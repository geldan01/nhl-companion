import type { ReactNode } from "react";
import type { NhlApiError } from "@/lib/nhl";

export type DataStateProps = {
  isLoading: boolean;
  error: NhlApiError | null;
  hasData: boolean;
  skeleton: ReactNode;
  emptyState?: ReactNode;
  children: ReactNode;
};

// Maps the data layer's NhlApiError categories to a uniform UI presentation.
// Branch order matters: hard errors (404 empty state, schema/5xx banner)
// take precedence over soft errors (network/timeout delayed badge), and the
// loading skeleton only shows when there is no data at all to display.
export function DataState({
  isLoading,
  error,
  hasData,
  skeleton,
  emptyState,
  children,
}: DataStateProps) {
  if (error?.kind === "http" && error.status >= 400 && error.status < 500) {
    return <>{emptyState ?? <DefaultEmptyState status={error.status} />}</>;
  }

  if (
    error?.kind === "schema" ||
    (error?.kind === "http" && error.status >= 500)
  ) {
    return (
      <div>
        <HardErrorBanner error={error} />
        {hasData ? children : null}
      </div>
    );
  }

  if (isLoading && !hasData) {
    return <>{skeleton}</>;
  }

  if (error?.kind === "network" || error?.kind === "timeout") {
    return (
      <div className="relative">
        <DelayedBadge />
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

function DefaultEmptyState({ status }: { status: number }) {
  return (
    <div
      role="status"
      className="px-4 py-12 text-center text-sm text-(--text-muted)"
    >
      {status === 404 ? "Not found." : `Unavailable (${status}).`}
    </div>
  );
}

function HardErrorBanner({ error }: { error: NhlApiError }) {
  return (
    <div
      role="alert"
      className="border-b border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--text-muted)"
    >
      Data unavailable. Showing last-known values.
      <span className="sr-only">{error.message}</span>
    </div>
  );
}

function DelayedBadge() {
  return (
    <span
      role="status"
      className="absolute right-2 top-2 z-10 rounded-full border border-(--border) bg-(--surface) px-2 py-0.5 text-[10px] uppercase tracking-wide text-(--text-muted)"
    >
      Delayed
    </span>
  );
}
