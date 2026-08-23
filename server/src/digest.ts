import { itemsSince } from './repo.js';
import type { Item } from './types.js';

export interface DigestGroup {
  feedTitle: string;
  items: Pick<Item, 'id' | 'title' | 'link' | 'content_snippet' | 'published_at'>[];
}

export interface Digest {
  sinceIso: string;
  generatedAt: string;
  totalItems: number;
  groups: DigestGroup[];
  markdown: string;
}

export function buildDigest(sinceIso: string): Digest {
  const rows = itemsSince(sinceIso);
  const byFeed = new Map<string, DigestGroup>();
  for (const row of rows) {
    const feedTitle = row.feed_title ?? 'Unknown feed';
    let group = byFeed.get(feedTitle);
    if (!group) {
      group = { feedTitle, items: [] };
      byFeed.set(feedTitle, group);
    }
    group.items.push({
      id: row.id,
      title: row.title,
      link: row.link,
      content_snippet: row.content_snippet,
      published_at: row.published_at,
    });
  }

  const groups = Array.from(byFeed.values()).sort((a, b) => a.feedTitle.localeCompare(b.feedTitle));
  const generatedAt = new Date().toISOString();

  const markdownLines: string[] = [`# Digest — since ${sinceIso.slice(0, 10)}`, ''];
  for (const group of groups) {
    markdownLines.push(`## ${group.feedTitle} (${group.items.length})`);
    for (const item of group.items) {
      const snippet = item.content_snippet ? ` — ${truncate(item.content_snippet, 160)}` : '';
      markdownLines.push(`- [${item.title}](${item.link ?? ''})${snippet}`);
    }
    markdownLines.push('');
  }
  if (groups.length === 0) markdownLines.push('_No new items._');

  return {
    sinceIso,
    generatedAt,
    totalItems: rows.length,
    groups,
    markdown: markdownLines.join('\n'),
  };
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
