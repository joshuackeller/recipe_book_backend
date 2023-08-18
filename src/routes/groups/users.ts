import { Hono } from "hono";
import prisma from "../../utilities/prismaClient";
import CustomError from "../../utilities/CustomError";
import Authorize from "../../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const groupUsers = new Hono();

groupUsers.use("*", Authorize);

groupUsers.get(
  "/",
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
      await prisma.user.findMany({
        where: {
          groups: {
            some: {
              groupId: parseInt(groupId),
              group: {
                users: {
                  some: {
                    userId: parseInt(userId),
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    );
  }
);

groupUsers.get(
  "/:userId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
      userId: z.string(),
    })
  ),
  async (c) => {
    const authUserId = c.req.header("userId");
    if (!authUserId) return CustomError(c, "Invalid token", 403);

    const { groupId, userId } = c.req.valid("param");

    return c.json(
      await prisma.user.findUniqueOrThrow({
        where: {
          id: parseInt(userId),
          groups: {
            some: {
              groupId: parseInt(groupId),
              userId: parseInt(authUserId),
            },
          },
        },
      })
    );
  }
);

groupUsers.delete(
  "/:userId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
      userId: z.string(),
    })
  ),
  async (c) => {
    const authUserId = c.req.header("userId");
    if (!authUserId) return CustomError(c, "Invalid token", 403);

    const { groupId, userId } = c.req.valid("param");

    return c.json(
      await prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId: parseInt(userId),
            groupId: parseInt(groupId),
          },
          group: {
            users: {
              some: {
                userId: parseInt(authUserId),
              },
            },
          },
        },
      })
    );
  }
);

export default groupUsers;
