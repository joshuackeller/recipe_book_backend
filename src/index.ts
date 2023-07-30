import { serve } from "@hono/node-server";
import { Hono } from "hono";
import prisma from "./utilities/prismaClient";

const app = new Hono();
app.get("/", async (c) => {
  // const recipes = await prisma.recipe.findMany({});
  return c.json({
    env: process.env.NODE_ENV,
    // recipes,
  });
});

serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT ?? "4500"),
});

console.log(`Running on http://localhost:${process.env.PORT ?? 4500}`);
