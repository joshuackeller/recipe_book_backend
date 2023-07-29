import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const PORT = 4500

const app = new Hono()
app.get('/', (c) => c.text('Hello Hono!!'))


serve({
    fetch: app.fetch,
    port: PORT,
  })

console.log(`Running on http://localhost:${PORT}`)