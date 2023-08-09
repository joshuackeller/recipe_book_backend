import { serve } from "@hono/node-server";
import { Hono } from "hono";
import auth from "./routes/auth";
import recipes from "./routes/recipes";
import recipeTags from "./routes/recipes/tags";
import tags from "./routes/tags";
import groups from "./routes/groups";
import groupInvitations from "./routes/groups/invitations";
import groupUsers from "./routes/groups/users";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.text("hello there testin"));

app.route("/auth", auth);
app.route("/recipes", recipes);
app.route("/recipes/:recipeId/tags", recipeTags);
app.route("/tags", tags);
app.route("/groups", groups);
app.route("/groups/:groupId/invitations", groupInvitations);
app.route("/groups/:groupId/users", groupUsers);

app.onError((err, c) => {
  console.error(err.message);
  return c.json({ error: err.message }, c.res.status ?? 500);
});

serve({
  fetch: app.fetch,
  port: 4500,
});

console.log(`Running on http://localhost:4500`);
