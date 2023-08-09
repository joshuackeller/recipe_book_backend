import { Hono } from "hono";
import prisma from "../../utilities/prismaClient";
import CustomError from "../../utilities/CustomError";
import Authorize from "../../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const groups = new Hono();

groups.use("*", Authorize);

groups.get("/", async (c) => {
  const userId = c.req.header("userId");
  if (!userId) return CustomError(c, "Invalid token", 403);

  return c.json(
    await prisma.group.findMany({
      where: {
        users: {
          some: {
            userId: parseInt(userId),
          },
        },
      },
    })
  );
});

groups.get(
  "/:groupId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { groupId } = c.req.valid("param");

    return c.json(
      await prisma.group.findUniqueOrThrow({
        where: {
          id: parseInt(groupId),
          users: {
            some: {
              userId: parseInt(userId),
            },
          },
        },
      })
    );
  }
);

groups.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      autoAddRecipes: z.boolean(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { name, autoAddRecipes } = c.req.valid("json");

    return c.json(
      await prisma.group.create({
        data: {
          name,
          users: {
            create: {
              userId: parseInt(userId),
              autoAddRecipes,
            },
          },
        },
      })
    );
  }
);

groups.put(
  "/:groupId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
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

    const { groupId } = c.req.valid("param");
    const { name } = c.req.valid("json");

    return c.json(
      await prisma.group.update({
        where: {
          id: parseInt(groupId),
          users: {
            some: {
              userId: parseInt(userId),
            },
          },
        },
        data: {
          name,
        },
      })
    );
  }
);

groups.delete(
  "/:groupId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { groupId } = c.req.valid("param");

    return c.json(
      await prisma.group.delete({
        where: {
          id: parseInt(groupId),
          users: {
            some: {
              userId: parseInt(userId),
            },
          },
        },
      })
    );
  }
);

export default groups;
