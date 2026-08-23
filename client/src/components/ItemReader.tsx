import type { Item } from '../types';

interface Props {
  item: Item | null;
  onMarkRead: (id: number, isRead: boolean) => void;
}

export function ItemReader({ item, onMarkRead }: Props) {
  if (!item) {
    return (
      <section className="reader-pane empty">
        <p className="muted">Select an item to read.</p>
      </section>
    );
  }

  return (
    <section className="reader-pane">
      <h1>{item.title}</h1>
      <div className="reader-meta">
        <span>{item.feed_title}</span>
        {item.published_at && <span>{new Date(item.published_at).toLocaleString()}</span>}
      </div>
      {item.content_snippet && <p className="reader-snippet">{item.content_snippet}</p>}
      <div className="reader-actions">
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            Read full article ↗
          </a>
        )}
        <button onClick={() => onMarkRead(item.id, item.is_read === 0)}>
          Mark as {item.is_read === 0 ? 'read' : 'unread'}
        </button>
      </div>
    </section>
  );
}
