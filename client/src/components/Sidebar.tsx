import { useState } from 'react';
import type { Feed } from '../types';

interface Props {
  feeds: Feed[];
  selectedFeedId: number | null;
  onSelectFeed: (id: number | null) => void;
  onAddFeed: (url: string) => Promise<unknown>;
  onRemoveFeed: (id: number) => void;
  onRefreshAll: () => void;
  view: 'reader' | 'digest';
  onChangeView: (view: 'reader' | 'digest') => void;
}

export function Sidebar({ feeds, selectedFeedId, onSelectFeed, onAddFeed, onRemoveFeed, onRefreshAll, view, onChangeView }: Props) {
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const submit = async () => {
    if (!url.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await onAddFeed(url.trim());
      setUrl('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  };

  const totalUnread = feeds.reduce((sum, f) => sum + f.unread_count, 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>Feed Digest</strong>
        <button className="ghost-btn" onClick={onRefreshAll} title="Fetch all feeds now">
          ↻
        </button>
      </div>

      <nav className="view-tabs">
        <button className={view === 'reader' ? 'active' : ''} onClick={() => onChangeView('reader')}>
          Reader
        </button>
        <button className={view === 'digest' ? 'active' : ''} onClick={() => onChangeView('digest')}>
          Digest
        </button>
      </nav>

      <div className="add-feed">
        <input
          value={url}
          placeholder="https://example.com/feed.xml"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button onClick={submit} disabled={adding}>
          {adding ? '…' : 'Add'}
        </button>
      </div>
      {addError && <p className="error-text">{addError}</p>}

      <ul className="feed-list">
        <li>
          <button className={selectedFeedId === null ? 'feed-item active' : 'feed-item'} onClick={() => onSelectFeed(null)}>
            <span>All feeds</span>
            {totalUnread > 0 && <span className="badge">{totalUnread}</span>}
          </button>
        </li>
        {feeds.map((feed) => (
          <li key={feed.id}>
            <button
              className={selectedFeedId === feed.id ? 'feed-item active' : 'feed-item'}
              onClick={() => onSelectFeed(feed.id)}
              title={feed.last_error ?? undefined}
            >
              <span>
                {feed.title ?? feed.url}
                {feed.last_error && <span className="feed-error-dot" title={feed.last_error} />}
              </span>
              {feed.unread_count > 0 && <span className="badge">{feed.unread_count}</span>}
            </button>
            <button className="remove-btn" onClick={() => onRemoveFeed(feed.id)} aria-label="Remove feed">
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
