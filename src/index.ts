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
import invitations from "./routes/invitations";
import { getCookie } from "hono/cookie";
import waitlist from "./routes/waitlist";
import { Prisma } from "@prisma/client";

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
app.route("/invitations", invitations);
app.route("/waitlist", waitlist);

app.onError((err, c) => {
  let message: string = err.message ?? "Unkown error";
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "Record already exists";
    }
  }
  console.error(err);
  return c.json({ error: message }, c.res.status ?? 500);
});

serve({
  fetch: app.fetch,
  port: 4500,
});

console.log(`Running on http://localhost:4500`);
