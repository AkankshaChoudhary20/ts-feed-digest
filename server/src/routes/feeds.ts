import { Router } from 'express';
import { z } from 'zod';
import { listFeeds, deleteFeed, getFeed, unreadCounts } from '../repo.js';
import { addFeedByUrl, fetchFeed, fetchAllFeeds } from '../fetcher.js';

export const feedsRouter = Router();

const addFeedSchema = z.object({ url: z.string().url() });

feedsRouter.get('/', (_req, res) => {
  const counts = unreadCounts();
  const feeds = listFeeds().map((f) => ({ ...f, unread_count: counts[f.id] ?? 0 }));
  res.json({ feeds });
});

feedsRouter.post('/', async (req, res) => {
  const parsed = addFeedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const feed = await addFeedByUrl(parsed.data.url);
    res.status(201).json({ feed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(422).json({ error: `Could not fetch or parse feed: ${message}` });
  }
});

feedsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  deleteFeed(id);
  res.status(204).end();
});

feedsRouter.post('/:id/refresh', async (req, res) => {
  const id = Number(req.params.id);
  const feed = getFeed(id);
  if (!feed) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const result = await fetchFeed(feed);
  res.json(result);
});

feedsRouter.post('/refresh-all', async (_req, res) => {
  await fetchAllFeeds(listFeeds());
  res.json({ ok: true });
});
