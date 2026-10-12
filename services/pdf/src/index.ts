import { serve } from '@hono/node-server';
import { reportStatusSchema } from '@nimzo/shared';
import { Hono } from 'hono';

import { env } from './env';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', reportStatuses: reportStatusSchema.options }));

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`PDF service listening on http://localhost:${info.port}`);
});
