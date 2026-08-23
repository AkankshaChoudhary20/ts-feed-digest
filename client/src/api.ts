import type { Digest, Feed, Item } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listFeeds: () => request<{ feeds: Feed[] }>('/feeds'),
  addFeed: (url: string) => request<{ feed: Feed }>('/feeds', { method: 'POST', body: JSON.stringify({ url }) }),
  deleteFeed: (id: number) => request<void>(`/feeds/${id}`, { method: 'DELETE' }),
  refreshFeed: (id: number) => request<{ added: number; error: string | null }>(`/feeds/${id}/refresh`, { method: 'POST' }),
  refreshAll: () => request<{ ok: true }>('/feeds/refresh-all', { method: 'POST' }),
  listItems: (params: { feedId?: number; q?: string; unreadOnly?: boolean; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params.feedId) search.set('feedId', String(params.feedId));
    if (params.q) search.set('q', params.q);
    if (params.unreadOnly) search.set('unreadOnly', 'true');
    if (params.limit) search.set('limit', String(params.limit));
    if (params.offset) search.set('offset', String(params.offset));
    return request<{ items: Item[] }>(`/items?${search.toString()}`);
  },
  markRead: (id: number, isRead: boolean) => request<void>(`/items/${id}/read`, { method: 'POST', body: JSON.stringify({ isRead }) }),
  digest: (hours: number) => request<Digest>(`/digest?hours=${hours}`),
};
