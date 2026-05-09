"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NowWatchingPill } from "./now-watching-pill";

const NAV_ITEMS = [
  { href: "/", label: "Scoreboard" },
  { href: "/standings", label: "Standings" },
  { href: "/stats", label: "Stats" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <Sidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 pb-[calc(theme(spacing.14)+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav pathname={pathname} />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 backdrop-blur">
      <Link href="/" className="font-semibold tracking-tight">
        NHL Companion
      </Link>
      <div className="ml-auto">
        <NowWatchingPill />
      </div>
    </header>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg)] lg:flex lg:flex-col">
      <div className="flex h-12 items-center border-b border-[var(--border)] px-4 font-semibold tracking-tight">
        Menu
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-3 py-2 text-sm transition-colors ${
              isActive(pathname, item.href)
                ? "bg-[var(--surface)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-stretch border-t border-[var(--border)] bg-[var(--bg)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center text-xs ${
              active
                ? "text-[var(--text)] font-semibold"
                : "text-[var(--text-muted)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
