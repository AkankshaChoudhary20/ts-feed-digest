import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DB_PATH = process.env.FEED_DIGEST_DB ?? join(process.cwd(), 'data', 'feeds.sqlite');
if (!existsSync(dirname(DB_PATH))) mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  site_url TEXT,
  last_fetched_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  content_snippet TEXT,
  content_html TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_read INTEGER NOT NULL DEFAULT 0,
  UNIQUE(feed_id, guid)
);

CREATE INDEX IF NOT EXISTS idx_items_feed_published ON items(feed_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  title,
  content_snippet,
  content='items',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, title, content_snippet) VALUES (new.id, new.title, new.content_snippet);
END;

CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, title, content_snippet) VALUES ('delete', old.id, old.title, old.content_snippet);
END;

CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, title, content_snippet) VALUES ('delete', old.id, old.title, old.content_snippet);
  INSERT INTO items_fts(rowid, title, content_snippet) VALUES (new.id, new.title, new.content_snippet);
END;
`);
