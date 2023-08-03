import { serve } from "@hono/node-server";
import { Hono } from "hono";
import auth from "./routes/auth";
import { createServer } from "node:https";
import fs from "node:fs";

const app = new Hono();
app.route("/auth", auth);

app.onError((err, c) => {
  console.error(err.message);
  return c.json({ error: err.message }, c.res.status ?? 500);
});

const prod = process.env.NODE_ENV === "production";

serve({
  fetch: app.fetch,
  port: prod ? 80 : 4500,
  // serverOptions: prod ?
  //   {
  //     key: fs.readFileSync('../keys/agent1-key.pem'),
  //     cert: fs.readFileSync('../keys/agent1-cert.pem'),
  //   } : undefined,
  //   hostname
  // createServer
  // https://github.com/honojs/node-server
});

console.log(`Running on http://localhost:${process.env.PORT ?? 4500}`);
