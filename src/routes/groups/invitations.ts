import { Hono } from "hono";
import prisma from "../../utilities/prismaClient";
import CustomError from "../../utilities/CustomError";
import Authorize from "../../utilities/Authorize";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const groupInvitations = new Hono();

groupInvitations.use("*", Authorize);

groupInvitations.get(
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
      await prisma.groupInvite.findMany({
        where: {
          groupId: parseInt(groupId),
          group: {
            users: {
              some: {
                userId: parseInt(userId),
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      })
    );
  }
);

groupInvitations.get(
  "/:invitationId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
      invitationId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { groupId, invitationId } = c.req.valid("param");

    return c.json(
      await prisma.groupInvite.findUniqueOrThrow({
        where: {
          id: parseInt(invitationId),
          group: {
            id: parseInt(groupId),
            users: {
              some: {
                userId: parseInt(userId),
              },
            },
          },
        },
      })
    );
  }
);

groupInvitations.post(
  "/",
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
      email: z.string().email(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { groupId } = c.req.valid("param");
    const { name, email } = c.req.valid("json");

    // validate user is in group
    await prisma.group.findUniqueOrThrow({
      where: {
        id: parseInt(groupId),
        users: {
          some: {
            userId: parseInt(userId),
          },
        },
      },
    });

    return c.json(
      await prisma.groupInvite.create({
        data: {
          name,
          email,
          groupId: parseInt(groupId),
        },
      })
    );
  }
);

groupInvitations.delete(
  "/:invitationId",
  zValidator(
    "param",
    z.object({
      groupId: z.string(),
      invitationId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { groupId, invitationId } = c.req.valid("param");

    return c.json(
      await prisma.groupInvite.delete({
        where: {
          id: parseInt(invitationId),
          group: {
            id: parseInt(groupId),
            users: {
              some: {
                userId: parseInt(userId),
              },
            },
          },
        },
      })
    );
  }
);

export default groupInvitations;
