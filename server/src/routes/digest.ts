import { Router } from 'express';
import { z } from 'zod';
import { buildDigest } from '../digest.js';

export const digestRouter = Router();

const querySchema = z.object({
  hours: z.coerce.number().int().min(1).max(24 * 30).default(24),
});

digestRouter.get('/', (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const sinceIso = new Date(Date.now() - parsed.data.hours * 60 * 60 * 1000).toISOString();
  res.json(buildDigest(sinceIso));
});
