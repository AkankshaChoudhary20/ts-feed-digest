import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.FEED_DIGEST_DB = ':memory:';
const { insertFeed, upsertItem, queryItems, markRead } = await import('../src/repo.js');
const feed = insertFeed('https://example.test/update', 'Updates', null);

test('refresh updates all changed fields without resetting read state or identity', () => {
  const original = { feedId: feed.id, guid: 'one', title: 'Same title', link: 'https://old.test', contentSnippet: 'Same snippet', contentHtml: '<p>Old</p>', publishedAt: '2026-01-01T00:00:00Z' };
  upsertItem(original);
  const first = queryItems({ limit: 10, offset: 0 })[0];
  markRead(first.id, true);
  for (const change of [{ link: 'https://new.test' }, { contentHtml: '<p>Corrected</p>' }, { publishedAt: '2026-02-01T00:00:00Z' }]) {
    Object.assign(original, change);
    upsertItem(original);
    const rows = queryItems({ limit: 10, offset: 0 });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, first.id);
    assert.equal(rows[0].is_read, 1);
    assert.equal(rows[0].link, original.link);
    assert.equal(rows[0].content_html, original.contentHtml);
    assert.equal(rows[0].published_at, original.publishedAt);
  }
});
