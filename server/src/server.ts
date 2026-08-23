import express from 'express';
import cors from 'cors';
import { feedsRouter } from './routes/feeds.js';
import { itemsRouter } from './routes/items.js';
import { digestRouter } from './routes/digest.js';
import { listFeeds } from './repo.js';
import { fetchAllFeeds } from './fetcher.js';

const PORT = Number(process.env.PORT ?? 8787);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 15 * 60 * 1000);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/api/feeds', feedsRouter);
app.use('/api/items', itemsRouter);
app.use('/api/digest', digestRouter);

app.listen(PORT, () => {
  console.log(`feed-digest server listening on :${PORT}`);
});

function pollAllFeeds(): void {
  const feeds = listFeeds();
  if (feeds.length === 0) return;
  fetchAllFeeds(feeds)
    .then(() => console.log(`polled ${feeds.length} feed(s)`))
    .catch((err) => console.error('poll failed', err));
}

setInterval(pollAllFeeds, POLL_INTERVAL_MS);
