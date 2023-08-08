import { Hono } from "hono";
import prisma from "../../utilities/prismaClient";
import CustomError from "../../utilities/CustomError";
import Authorize from "../../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const recipeTags = new Hono();

recipeTags.use("*", Authorize);

recipeTags.use(
  "/:tagId",
  zValidator(
    "param",
    z.object({
      recipeId: z.string(),
      tagId: z.string(),
    })
  ),
  async (c) => {
    const { recipeId, tagId } = c.req.valid("param");

    return c.text(`made it to recipeId ${recipeId} and tag ${tagId}`);
  }
);

recipeTags.post(
  "/:tagId",
  zValidator(
    "param",
    z.object({
      recipeId: z.string(),
      tagId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { recipeId, tagId } = c.req.valid("param");

    return c.json(
      await prisma.tag.update({
        where: {
          id_userId: {
            id: parseInt(tagId),
            userId: parseInt(userId),
          },
        },
        data: {
          recipes: {
            connect: {
              id_userId: {
                id: parseInt(recipeId),
                userId: parseInt(userId),
              },
            },
          },
        },
      })
    );
  }
);

recipeTags.delete(
  "/:tagId",
  zValidator(
    "param",
    z.object({
      recipeId: z.string(),
      tagId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);
    const { recipeId, tagId } = c.req.valid("param");

    return c.json(
      await prisma.tag.update({
        where: {
          id_userId: {
            id: parseInt(tagId),
            userId: parseInt(userId),
          },
        },
        data: {
          recipes: {
            disconnect: {
              id_userId: {
                id: parseInt(recipeId),
                userId: parseInt(userId),
              },
            },
          },
        },
      })
    );
  }
);

export default recipeTags;
