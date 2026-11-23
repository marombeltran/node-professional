import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { afterEach, beforeEach, test } from 'node:test';

import { createApp } from '../src/app.js';

let server: Server;
let baseUrl: string;

beforeEach(async () => {
  server = createApp();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected server to listen on a TCP address');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  const closed = once(server, 'close');
  server.close();
  server.closeAllConnections();
  await closed;
});

test('GET /health returns 200 with a JSON body', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('unknown route returns 404 with a JSON body', async () => {
  const response = await fetch(`${baseUrl}/does-not-exist`);

  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/);
  assert.deepEqual(await response.json(), { status: 'Not found' });
});

test('unsupported method on /health returns 404', async () => {
  const response = await fetch(`${baseUrl}/health`, { method: 'POST' });

  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/);
  assert.deepEqual(await response.json(), { status: 'Not found' });
});
