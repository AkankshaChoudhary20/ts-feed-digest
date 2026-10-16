import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.FEED_DIGEST_DB=':memory:';
const {db}=await import('../src/db.js');
const {insertFeed,upsertItem,queryItems}=await import('../src/repo.js');
const feed=insertFeed('https://example.test/feed','Feed',null);
upsertItem({feedId:feed.id,guid:'one',title:'日本語 OR release',link:null,contentSnippet:'Hello world',contentHtml:null,publishedAt:'2026-01-01'});
test('punctuation-only searches are safe and return no rows',()=>{
  for(const query of [':','"','***','()'])assert.deepEqual(queryItems({query,limit:10,offset:0}),[]);
});
test('Unicode words and literal operator names remain searchable',()=>{
  for(const query of ['日本','OR','hello world'])assert.equal(queryItems({query,limit:10,offset:0}).length,1,query);
});
test('blank searches still list items',()=>{assert.equal(queryItems({query:' ',limit:10,offset:0}).length,1);});
