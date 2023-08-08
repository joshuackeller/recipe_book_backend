import { serve } from "@hono/node-server";
import { Hono } from "hono";
import auth from "./routes/auth";
import recipes from "./routes/recipes";
import recipeTags from "./routes/recipes/tags";

const app = new Hono();

app.get("/", (c) => c.text("hello there testin"));

app.route("/auth", auth);
app.route("/recipes", recipes);
app.route("/tags");
app.route("/recipes/:recipeId/tags", recipeTags);

app.onError((err, c) => {
  console.error(err.message);
  return c.json({ error: err.message }, c.res.status ?? 500);
});

// const prod = process.env.NODE_ENV === "production";

serve({
  fetch: app.fetch,
  port: 4500,
  // https://infisical.com/
});

console.log(`Running on http://localhost:${process.env.PORT ?? 4500}`);
