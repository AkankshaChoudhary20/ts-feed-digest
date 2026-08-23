import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Item } from '../types';

interface Filters {
  feedId: number | null;
  query: string;
  unreadOnly: boolean;
}

export function useItems(filters: Filters, refreshToken: number) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listItems({
        feedId: filters.feedId ?? undefined,
        q: filters.query || undefined,
        unreadOnly: filters.unreadOnly || undefined,
        limit: 100,
      })
      .then(({ items }) => {
        if (!cancelled) {
          setItems(items);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.feedId, filters.query, filters.unreadOnly, refreshToken]);

  return { items, loading, error, setItems };
}
