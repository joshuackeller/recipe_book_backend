import { Hono } from "hono";
import prisma from "../../utilities/prismaClient";
import CustomError from "../../utilities/CustomError";
import Authorize from "../../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

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

  return c.json(
    await prisma.recipe.findMany({
      where: {
        userId: parseInt(userId),
      },
      take: 25,
    })
  );
});

recipes.get(
  "/:recipeId",
  zValidator(
    "param",
    z.object({
      recipeId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { recipeId } = c.req.valid("param");

    return c.json(
      await prisma.recipe.findUniqueOrThrow({
        where: {
          id_userId: {
            id: parseInt(recipeId),
            userId: parseInt(userId),
          },
        },
        include: {
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    );
  }
);

recipes.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      html: z.string(),
      tags: z.array(z.object({ id: z.string() })),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { name, html, tags } = c.req.valid("json");

    return c.json(
      await prisma.recipe.create({
        data: {
          user: { connect: { id: parseInt(userId) } },
          name,
          html,
          tags:
            tags && tags.length > 0
              ? {
                  connectOrCreate: tags.map((tag: any) => ({
                    where: {
                      id_userId: {
                        id: tag.id,
                        userId: parseInt(userId),
                      },
                    },
                    create: {
                      name: tag.name,
                      user: { connect: { id: parseInt(userId) } },
                    },
                  })),
                }
              : undefined,
        },
      })
    );
  }
);

recipes.put(
  "/:recipeId",
  zValidator(
    "param",
    z.object({
      recipeId: z.string(),
    })
  ),
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      html: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { recipeId } = c.req.valid("param");

    const { name, html } = c.req.valid("json");

    return c.json(
      await prisma.recipe.update({
        where: {
          id_userId: {
            userId: parseInt(userId),
            id: parseInt(recipeId),
          },
        },
        data: {
          name,
          html,
        },
      })
    );
  }
);

recipes.delete(
  "/:recipeId",
  zValidator(
    "param",
    z.object({
      recipeId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { recipeId } = c.req.valid("param");

    return c.json(
      await prisma.recipe.delete({
        where: {
          id_userId: {
            userId: parseInt(userId),
            id: parseInt(recipeId),
          },
        },
      })
    );
  }
);

export default recipes;
