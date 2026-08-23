# ts-feed-digest

A self-hosted RSS/Atom reader: subscribe to feeds, get full-text search over
everything you've ever read, and generate a daily digest instead of doom
scrolling twenty separate sites.

## Why this exists

RSS reader tutorials usually stop at "fetch and display." The interesting
parts are: polling feeds without hammering the origin server, indexing
content for real search (not `.includes()`), and turning a firehose of items
into something skimmable — a digest grouped by feed, exportable as Markdown.

## Architecture

```
server/   Node + TypeScript + Express API backed by SQLite (better-sqlite3)
          - polls subscribed feeds on an interval (rss-parser)
          - FTS5 virtual table + triggers keep a search index in sync with items
          - digest builder groups recent items by feed and renders Markdown
client/   React + TypeScript + Vite UI
          - Reader view: feed sidebar, search + unread filter, item list, reader pane
          - Digest view: recent items grouped by feed, copy-as-Markdown
```

Feed items are stored as plain text/snippet only — the app deliberately does
not render raw feed HTML (`dangerouslySetInnerHTML`) to avoid pulling
untrusted third-party markup into the page; it links out to the original
article instead.

## Running locally

```bash
npm run install:all
npm run dev
```

- Server: `http://localhost:8787` (health check at `/healthz`)
- Client: `http://localhost:5174` (proxies `/api` to the server in dev)

Add a feed by pasting its URL (e.g. `https://hnrss.org/frontpage`) in the
sidebar. The server polls all subscribed feeds every 15 minutes by default
(`POLL_INTERVAL_MS` env var), or hit the ↻ button for an immediate refresh.

## API

| Method | Path                    | Description                          |
| ------ | ----------------------- | ------------------------------------- |
| GET    | `/api/feeds`             | List feeds with unread counts         |
| POST   | `/api/feeds`             | Add a feed (`{ url }`)                |
| DELETE | `/api/feeds/:id`         | Remove a feed                         |
| POST   | `/api/feeds/:id/refresh` | Poll one feed immediately             |
| POST   | `/api/feeds/refresh-all` | Poll all feeds immediately            |
| GET    | `/api/items`             | Search/list items (`q`, `feedId`, `unreadOnly`) |
| POST   | `/api/items/:id/read`    | Mark read/unread (`{ isRead }`)       |
| GET    | `/api/digest?hours=24`   | Grouped digest + Markdown export      |

## Building for production

```bash
npm run build --prefix server
npm run build --prefix client
```

Serve `client/dist` as static files and run `node server/dist/server.js`
(reads `PORT`, `FEED_DIGEST_DB`, `POLL_INTERVAL_MS` env vars) behind a
reverse proxy.
