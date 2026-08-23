import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Feed } from '../types';

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { feeds } = await api.listFeeds();
      setFeeds(feeds);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFeed = useCallback(
    async (url: string) => {
      const { feed } = await api.addFeed(url);
      await refresh();
      return feed;
    },
    [refresh],
  );

  const removeFeed = useCallback(
    async (id: number) => {
      await api.deleteFeed(id);
      await refresh();
    },
    [refresh],
  );

  const refreshAll = useCallback(async () => {
    await api.refreshAll();
    await refresh();
  }, [refresh]);

  return { feeds, loading, error, addFeed, removeFeed, refreshAll, refresh };
}
