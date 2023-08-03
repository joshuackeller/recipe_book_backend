import { Hono } from "hono";
import prisma from "../utilities/prismaClient";
import CustomError from "../utilities/CustomError";
import Authorize from "../utilities/Authorize";

const recipes = new Hono();

recipes.use("*", Authorize);

recipes.get("/", async (c) => {
  const userId = c.req.header("userId");
  if (!userId) return CustomError(c, "Invalid token", 403);

  //   const search = req.nextUrl.searchParams.get("search");
  //   const stringTagIds = req.nextUrl.searchParams.get("tagIds");
  //   const stringArrayTagIds = stringTagIds?.split(",");
  //   const tagIds = stringArrayTagIds?.map((tagId) => parseInt(tagId));

  // FIX mode: "insensitive"
  //   const where: Prisma.RecipeWhereInput = {
  //     userId,
  //     tags: !!tagIds ? { some: { id: { in: tagIds } } } : undefined,
  //     name: search ? { contains: search } : undefined,
  //   };

  const recipes = await prisma.recipe.findMany({
    where: {
      userId: parseInt(userId),
    },
    take: 25,
  });

  return c.json(recipes);
});

export default recipes;
