import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Digest } from '../types';

export function DigestView() {
  const [hours, setHours] = useState(24);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .digest(hours)
      .then(setDigest)
      .finally(() => setLoading(false));
  }, [hours]);

  const copy = async () => {
    if (!digest) return;
    await navigator.clipboard.writeText(digest.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="digest-pane">
      <div className="digest-header">
        <h1>Digest</h1>
        <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
          <option value={24}>Last 24 hours</option>
          <option value={72}>Last 3 days</option>
          <option value={24 * 7}>Last 7 days</option>
          <option value={24 * 30}>Last 30 days</option>
        </select>
        <button onClick={copy} disabled={!digest}>
          {copied ? 'Copied!' : 'Copy as Markdown'}
        </button>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {!loading && digest && digest.totalItems === 0 && <p className="muted">No new items in this window.</p>}

      {!loading &&
        digest?.groups.map((group) => (
          <div key={group.feedTitle} className="digest-group">
            <h2>
              {group.feedTitle} <span className="count">{group.items.length}</span>
            </h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <a href={item.link ?? undefined} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                  {item.content_snippet && <p className="digest-snippet">{truncate(item.content_snippet, 160)}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
