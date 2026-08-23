export interface Feed {
  id: number;
  url: string;
  title: string | null;
  site_url: string | null;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
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
}

export interface ItemWithFeed extends Item {
  feed_title: string | null;
}
