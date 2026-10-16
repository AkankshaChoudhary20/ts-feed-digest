import { Router } from 'express';
import { z } from 'zod';
import { queryItems, markRead } from '../repo.js';

export const itemsRouter = Router();

export const querySchema = z.object({
  feedId: z.coerce.number().int().optional(),
  q: z.string().optional(),
  unreadOnly: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

itemsRouter.get('/', (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { feedId, q, unreadOnly, limit, offset } = parsed.data;
  const items = queryItems({ feedId, query: q, unreadOnly, limit, offset });
  res.json({ items });
});

itemsRouter.post('/:id/read', (req, res) => {
  const id = Number(req.params.id);
  const isRead = req.body?.isRead !== false;
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  markRead(id, isRead);
  res.status(204).end();
});
