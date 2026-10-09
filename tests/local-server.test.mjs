import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalServer} from '../scripts/serve.mjs';

test('local website serves real app/data from any working directory, with honest missing-file responses', async () => {
  const server = createLocalServer();
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(base + '/?opponent=CLE');
    assert.equal(home.status,200);
    assert.match(await home.text(),/Who are we playing/);
    const module = await fetch(base + '/coaching.js');
    assert.match(module.headers.get('content-type'),/javascript/);
    const audit = await (await fetch(base + '/data/audit.json')).json();
    assert.equal(audit.eligiblePlays,7767);
    for (const route of ['/missing.json','/README.md','/%2e%2e%2fREADME.md','/.git/config']) {
      const result = await fetch(base + route); assert.equal(result.status,404,route);
    }
    assert.equal((await fetch(base + '/%ZZ')).status,400);
    assert.equal((await fetch(base,{method:'POST'})).status,405);
    const head = await fetch(base,{method:'HEAD'});
    assert.equal(head.status,200); assert.equal(await head.text(),'');
  } finally {server.closeAllConnections();await new Promise(resolve => server.close(resolve));}
});
