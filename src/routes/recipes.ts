import { Hono } from "hono";
import prisma from "../utilities/prismaClient";
import CustomError from "../utilities/CustomError";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
const jwt = require("jsonwebtoken");

const recipes = new Hono();

recipes.use(async (c, next) => {
  c.header("userId", undefined);
  const token = c.req.header("Authorization");
  let verified = false;
  if (!!token) {
    if (jwt.verify(token, process.env.JWT_SECRET)) {
      verified = true;
    } else {
      return CustomError(c, "Invalid token", 403);
    }
  } else {
    return CustomError(c, "Missing Authorization Header", 403);
  }

  if (verified) {
    const { userId } = jwt.decode(token) as any;
    c.req.headers.set("userId", userId);
  } else {
    return CustomError(c, "Invalid token");
  }
  if (!c.req.header("userId")) {
    return CustomError(c, "Invalid token");
  }
  await next();
});

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
