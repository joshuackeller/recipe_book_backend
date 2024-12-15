import { Hono } from "hono";
import prisma from "../../utilities/prismaClient";
import CustomError from "../../utilities/CustomError";
import Authorize from "../../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const recipes = new Hono();

recipes.use("*", Authorize);

recipes.get(
  "/",
  zValidator(
    "query",
    z.object({
      search: z.string().optional(),
    })
  ),
  zValidator(
    "queries",
    z.object({
      tagIds: z.array(z.string().transform((val) => parseInt(val))).optional(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { search } = c.req.valid("query");
    const { tagIds } = c.req.valid("queries");

    const where: Prisma.RecipeWhereInput = {
      OR: [
        { userId: parseInt(userId) },
        { groups: { some: { users: { some: { userId: parseInt(userId) } } } } },
      ],
      tags: !!tagIds ? { some: { id: { in: tagIds } } } : undefined, // MAYBE MAKE THIS USE OR??
      name: search ? { contains: search, mode: "insensitive" } : undefined,
    };

    return c.json(
      await prisma.recipe.findMany({
        where,
      })
    );
  }
);

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
          id: parseInt(recipeId),
          OR: [
            { userId: parseInt(userId) },
            {
              groups: {
                some: { users: { some: { userId: parseInt(userId) } } },
              },
            },
          ],
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
      tags: z.array(z.object({ id: z.number().optional(), name: z.string() })),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { name, html, tags } = c.req.valid("json");

    const { groups } = await prisma.user.findUniqueOrThrow({
      where: { id: parseInt(userId) },
      select: {
        groups: {
          where: {
            autoAddRecipes: true,
          },
          select: {
            groupId: true,
          },
        },
      },
    });

    return c.json(
      await prisma.recipe.create({
        data: {
          user: { connect: { id: parseInt(userId) } },
          name,
          html,
          tags:
            !!tags && tags.length > 0
              ? {
                  connectOrCreate: tags.map((tag: any) => ({
                    where: {
                      id_userId: {
                        id: tag.id ?? -1,
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
          groups:
            !!groups && groups?.length > 0
              ? {
                  connect: groups.map((group) => ({
                    id: group.groupId,
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
          id: parseInt(recipeId),
          OR: [
            { userId: parseInt(userId) },
            {
              groups: {
                some: { users: { some: { userId: parseInt(userId) } } },
              },
            },
          ],
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
