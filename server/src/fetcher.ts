import Parser from 'rss-parser';
import { getFeedByUrl, insertFeed, markFeedFetched, upsertItem, type NewItem } from './repo.js';
import type { Feed } from './types.js';

const parser = new Parser({ timeout: 15000 });

export async function addFeedByUrl(url: string): Promise<Feed> {
  const existing = getFeedByUrl(url);
  if (existing) return existing;

  const parsed = await parser.parseURL(url);
  const feed = insertFeed(url, parsed.title ?? url, parsed.link ?? null);
  ingestItems(feed.id, parsed.items ?? []);
  markFeedFetched(feed.id, null);
  return feed;
}

export async function fetchFeed(feed: Feed): Promise<{ added: number; error: string | null }> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const added = ingestItems(feed.id, parsed.items ?? []);
    markFeedFetched(feed.id, null);
    return { added, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markFeedFetched(feed.id, message);
    return { added: 0, error: message };
  }
}

type RawFeedItem = Parser.Item & Record<string, unknown>;

function ingestItems(feedId: number, entries: RawFeedItem[]): number {
  let added = 0;
  for (const entry of entries) {
    const guid = (entry.guid ?? entry.id ?? entry.link ?? entry.title ?? crypto.randomUUID()) as string;
    const item: NewItem = {
      feedId,
      guid,
      title: entry.title ?? '(untitled)',
      link: entry.link ?? null,
      contentSnippet: entry.contentSnippet ?? (entry.summary as string | undefined) ?? null,
      contentHtml: entry.content ?? (entry['content:encoded'] as string | undefined) ?? null,
      publishedAt: normalizeDate(entry.isoDate ?? entry.pubDate),
    };
    upsertItem(item);
    added += 1;
  }
  return added;
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function fetchAllFeeds(feeds: Feed[]): Promise<void> {
  // Sequential on purpose: politeness to feed hosts and predictable logging,
  // and the feed counts this tool targets don't need concurrency.
  for (const feed of feeds) {
    await fetchFeed(feed);
  }
}
