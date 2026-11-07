import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.FEED_DIGEST_DB=':memory:';
const {insertFeed,upsertItem}=await import('../src/repo.js');
const {buildDigest}=await import('../src/digest.js');
test('different feeds with identical or absent titles remain separate groups',()=>{
 for(const [i,title] of ['News','News',null,null].entries()){
  const feed=insertFeed(`https://example.test/feed-${i}`,title,null);
  upsertItem({feedId:feed.id,guid:'one',title:`Story ${i}`,link:null,contentSnippet:null,contentHtml:null,publishedAt:'2026-11-01'});
 }
 const digest=buildDigest('2026-01-01');
 assert.equal(digest.totalItems,4);assert.equal(digest.groups.length,4);
 assert.ok(digest.groups.every(g=>g.items.length===1));
});
