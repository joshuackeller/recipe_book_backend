import { Hono } from "hono";
import prisma from "../utilities/prismaClient";
import CustomError from "../utilities/CustomError";
import Authorize from "../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const tags = new Hono();

tags.use("*", Authorize);

tags.get(
  "/",
  zValidator(
    "query",
    z.object({
      search: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { search } = c.req.valid("query");

    return c.json(
      await prisma.tag.findMany({
        where: {
          name: !!search ? { contains: search } : undefined,
          OR: [
            { userId: parseInt(userId) },
            {
              recipes: {
                some: {
                  groups: {
                    some: {
                      users: {
                        some: {
                          userId: parseInt(userId),
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        take: 5,
      })
    );
  }
);

tags.get(
  "/:tagId",
  zValidator(
    "param",
    z.object({
      tagId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { tagId } = c.req.valid("param");

    return c.json(
      await prisma.tag.findUniqueOrThrow({
        where: {
          id_userId: {
            id: parseInt(tagId),
            userId: parseInt(userId),
          },
        },
      })
    );
  }
);

tags.put(
  "/:tagId",
  zValidator(
    "param",
    z.object({
      tagId: z.string(),
    })
  ),
  zValidator(
    "json",
    z.object({
      name: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { tagId } = c.req.valid("param");
    const { name } = c.req.valid("json");

    return c.json(
      await prisma.tag.update({
        where: {
          id_userId: {
            id: parseInt(tagId),
            userId: parseInt(userId),
          },
        },
        data: {
          name,
        },
      })
    );
  }
);

tags.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      recipeId: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { name, recipeId } = c.req.valid("json");

    return c.json(
      await prisma.tag.create({
        data: {
          name,
          userId: parseInt(userId),
          recipes: recipeId
            ? {
                connect: {
                  id_userId: {
                    id: parseInt(recipeId),
                    userId: parseInt(userId),
                  },
                },
              }
            : undefined,
        },
      })
    );
  }
);

tags.delete(
  "/:tagId",
  zValidator(
    "param",
    z.object({
      tagId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { tagId } = c.req.valid("param");

    return c.json(
      await prisma.tag.delete({
        where: {
          id_userId: {
            id: parseInt(tagId),
            userId: parseInt(tagId),
          },
        },
      })
    );
  }
);

export default tags;
