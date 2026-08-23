import type { Item } from '../types';

interface Props {
  items: Item[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (item: Item) => void;
  query: string;
  onQueryChange: (q: string) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (v: boolean) => void;
}

export function ItemList({ items, loading, selectedId, onSelect, query, onQueryChange, unreadOnly, onUnreadOnlyChange }: Props) {
  return (
    <section className="item-list-pane">
      <div className="search-bar">
        <input placeholder="Search items…" value={query} onChange={(e) => onQueryChange(e.target.value)} />
        <label>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => onUnreadOnlyChange(e.target.checked)} />
          Unread only
        </label>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {!loading && items.length === 0 && <p className="muted">No items.</p>}
      <ul className="item-list">
        {items.map((item) => (
          <li key={item.id}>
            <button className={item.id === selectedId ? 'item active' : 'item'} onClick={() => onSelect(item)}>
              <div className="item-title-row">
                {item.is_read === 0 && <span className="unread-dot" />}
                <span className="item-title">{item.title}</span>
              </div>
              <div className="item-meta">
                {item.feed_title} · {formatDate(item.published_at)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
