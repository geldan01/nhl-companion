import { z } from 'zod';

// The Forge CMS story payload is large and noisy; we validate only the fields
// the UI needs and `.passthrough()` the rest so an upstream addition never
// trips the schema guard. The schema also normalizes each story into the flat
// `NewsItem` the components consume (public URL, thumbnail, date).

const Thumbnail = z
  .object({
    thumbnailUrl: z.string().optional(),
    title: z.string().optional(),
  })
  .passthrough();

const Story = z
  .object({
    title: z.string(),
    slug: z.string(),
    summary: z.string().optional(),
    contentDate: z.string().optional(),
    thumbnail: Thumbnail.nullish(),
  })
  .passthrough();

export const NewsResponse = z
  .object({
    items: z.array(Story),
  })
  .passthrough()
  .transform((data) => ({
    items: data.items.map((s) => ({
      title: s.title,
      slug: s.slug,
      summary: s.summary ?? '',
      contentDate: s.contentDate ?? null,
      thumbnailUrl: s.thumbnail?.thumbnailUrl ?? null,
      // Forge slugs map 1:1 to the public article URL.
      url: `https://www.nhl.com/news/${s.slug}`,
    })),
  }));

export type NewsResponse = z.infer<typeof NewsResponse>;
export type NewsItem = NewsResponse['items'][number];
