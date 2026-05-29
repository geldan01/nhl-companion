"use client";

import Image from "next/image";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { useNews, type NewsItem } from "@/lib/nhl/news";

const NHL_NEWS_URL = "https://www.nhl.com/news";

export function NewsFeed({ limit = 5 }: { limit?: number }) {
  const query = useNews(limit);
  const items = query.data?.items ?? [];

  return (
    <section className="rounded-lg border border-(--border) bg-(--surface)">
      <header className="flex items-center justify-between border-b border-(--border) px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-tight">Latest from the NHL</h2>
        <a
          href={NHL_NEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-(--accent) hover:underline"
        >
          All news →
        </a>
      </header>
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={items.length > 0}
        skeleton={
          <div className="p-4">
            <Skeleton variant="row" count={5} />
          </div>
        }
        emptyState={
          <p className="px-4 py-8 text-center text-sm text-(--text-muted)">
            No news right now.
          </p>
        }
      >
        <ul className="divide-y divide-(--border)">
          {items.map((item) => (
            <li key={item.slug}>
              <NewsRow item={item} />
            </li>
          ))}
        </ul>
      </DataState>
    </section>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-(--surface-hover)"
    >
      {item.thumbnailUrl ? (
        <Image
          src={item.thumbnailUrl}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 shrink-0 rounded object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
        {item.summary ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-(--text-muted)">{item.summary}</p>
        ) : null}
        {item.contentDate ? (
          <p className="mt-1 text-[11px] text-(--text-muted)">{formatDate(item.contentDate)}</p>
        ) : null}
      </div>
    </a>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
