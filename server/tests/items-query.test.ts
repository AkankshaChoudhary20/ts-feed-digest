import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.FEED_DIGEST_DB = ':memory:';
const { querySchema } = await import('../src/routes/items.js');

test('unreadOnly parses explicit query booleans', () => {
  assert.equal(querySchema.parse({ unreadOnly: 'false' }).unreadOnly, false);
  assert.equal(querySchema.parse({ unreadOnly: 'true' }).unreadOnly, true);
  assert.equal(querySchema.parse({}).unreadOnly, undefined);
});

test('unreadOnly rejects ambiguous values', () => {
  for (const value of ['', '0', '1', 'no', ['true', 'false'], {}]) {
    assert.equal(querySchema.safeParse({ unreadOnly: value }).success, false);
  }
});
