export interface Feed {
  id: number;
  url: string;
  title: string | null;
  site_url: string | null;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
  unread_count: number;
}

export interface Item {
  id: number;
  feed_id: number;
  guid: string;
  title: string;
  link: string | null;
  content_snippet: string | null;
  content_html: string | null;
  published_at: string | null;
  fetched_at: string;
  is_read: number;
  feed_title: string | null;
}

export interface DigestGroup {
  feedTitle: string;
  items: Pick<Item, 'id' | 'title' | 'link' | 'content_snippet' | 'published_at'>[];
}

export interface Digest {
  sinceIso: string;
  generatedAt: string;
  totalItems: number;
  groups: DigestGroup[];
  markdown: string;
}
