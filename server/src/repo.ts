import { db } from './db.js';
import type { Feed, Item, ItemWithFeed } from './types.js';

export function listFeeds(): Feed[] {
  return db.prepare('SELECT * FROM feeds ORDER BY title COLLATE NOCASE').all() as Feed[];
}

export function getFeed(id: number): Feed | undefined {
  return db.prepare('SELECT * FROM feeds WHERE id = ?').get(id) as Feed | undefined;
}

export function getFeedByUrl(url: string): Feed | undefined {
  return db.prepare('SELECT * FROM feeds WHERE url = ?').get(url) as Feed | undefined;
}

export function insertFeed(url: string, title: string | null, siteUrl: string | null): Feed {
  const info = db.prepare('INSERT INTO feeds (url, title, site_url) VALUES (?, ?, ?)').run(url, title, siteUrl);
  return getFeed(info.lastInsertRowid as number)!;
}

export function deleteFeed(id: number): void {
  db.prepare('DELETE FROM feeds WHERE id = ?').run(id);
}

export function markFeedFetched(id: number, error: string | null): void {
  db.prepare("UPDATE feeds SET last_fetched_at = datetime('now'), last_error = ? WHERE id = ?").run(error, id);
}

export interface NewItem {
  feedId: number;
  guid: string;
  title: string;
  link: string | null;
  contentSnippet: string | null;
  contentHtml: string | null;
  publishedAt: string | null;
}

const upsertItemStmt = db.prepare(`
  INSERT INTO items (feed_id, guid, title, link, content_snippet, content_html, published_at)
  VALUES (@feedId, @guid, @title, @link, @contentSnippet, @contentHtml, @publishedAt)
  ON CONFLICT(feed_id, guid) DO UPDATE SET
    title = excluded.title,
    link = excluded.link,
    content_snippet = excluded.content_snippet,
    content_html = excluded.content_html,
    published_at = excluded.published_at
  WHERE items.title != excluded.title OR items.content_snippet IS NOT excluded.content_snippet
`);

export function upsertItem(item: NewItem): void {
  upsertItemStmt.run(item);
}

export interface ItemQuery {
  feedId?: number;
  query?: string;
  unreadOnly?: boolean;
  sinceIso?: string;
  limit: number;
  offset: number;
}

export function queryItems(q: ItemQuery): ItemWithFeed[] {
  const clauses: string[] = [];
  const params: Record<string, unknown> = { limit: q.limit, offset: q.offset };

  let baseFrom = 'items i JOIN feeds f ON f.id = i.feed_id';
  if (q.query && q.query.trim()) {
    const search = toFtsQuery(q.query);
    if (!search) return [];
    params.query = search;
    baseFrom = 'items_fts fts JOIN items i ON i.id = fts.rowid JOIN feeds f ON f.id = i.feed_id';
    clauses.push('items_fts MATCH @query');
  }
  if (q.feedId) {
    clauses.push('i.feed_id = @feedId');
    params.feedId = q.feedId;
  }
  if (q.unreadOnly) {
    clauses.push('i.is_read = 0');
  }
  if (q.sinceIso) {
    clauses.push('i.published_at >= @sinceIso');
    params.sinceIso = q.sinceIso;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `
    SELECT i.*, f.title as feed_title
    FROM ${baseFrom}
    ${where}
    ORDER BY i.published_at DESC
    LIMIT @limit OFFSET @offset
  `;
  return db.prepare(sql).all(params) as ItemWithFeed[];
}

function toFtsQuery(raw: string): string {
  // Quote literal Unicode word terms so FTS operators/punctuation cannot
  // become query syntax. No terms means no matches, not a malformed MATCH.
  return (raw.match(/[\p{L}\p{N}_]+/gu) ?? [])
    .map((term) => `"${term}"*`).join(' AND ');
}

export function markRead(itemId: number, isRead: boolean): void {
  db.prepare('UPDATE items SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, itemId);
}

export function unreadCounts(): Record<number, number> {
  const rows = db.prepare('SELECT feed_id, COUNT(*) as n FROM items WHERE is_read = 0 GROUP BY feed_id').all() as {
    feed_id: number;
    n: number;
  }[];
  const result: Record<number, number> = {};
  for (const row of rows) result[row.feed_id] = row.n;
  return result;
}

export function itemsSince(sinceIso: string): (Item & { feed_title: string | null })[] {
  return db
    .prepare(
      `SELECT i.*, f.title as feed_title FROM items i JOIN feeds f ON f.id = i.feed_id
       WHERE i.published_at >= ? ORDER BY f.title COLLATE NOCASE, i.published_at DESC`,
    )
    .all(sinceIso) as (Item & { feed_title: string | null })[];
}
