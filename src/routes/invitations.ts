import { Hono } from "hono";
import Authorize from "../utilities/Authorize";
import CustomError from "../utilities/CustomError";
import prisma from "../utilities/prismaClient";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const invitations = new Hono();

invitations.use("*", Authorize);

invitations.get("", async (c) => {
  const userId = c.req.header("userId");
  if (!userId) return CustomError(c, "Invalid token", 403);

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: parseInt(userId),
    },
  });

  return c.json(
    await prisma.groupInvite.findMany({
      where: {
        email: user.email,
      },
      include: {
        group: true,
      },
    })
  );
});

invitations.post(
  "/:invitationId",
  zValidator(
    "param",
    z.object({
      invitationId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { invitationId } = c.req.valid("param");

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: parseInt(userId),
      },
    });

    const invitation = await prisma.groupInvite.findUniqueOrThrow({
      where: {
        id: parseInt(invitationId),
        email: user.email,
      },
    });

    return c.json(
      await prisma.group.update({
        where: {
          id: invitation.groupId,
        },
        data: {
          users: {
            create: {
              userId: parseInt(userId),
            },
          },
          invitations: {
            delete: {
              email_groupId: {
                email: user.email,
                groupId: invitation.groupId,
              },
            },
          },
        },
      })
    );
  }
);

invitations.delete(
  "/:invitationId",
  zValidator(
    "param",
    z.object({
      invitationId: z.string(),
    })
  ),
  async (c) => {
    const userId = c.req.header("userId");
    if (!userId) return CustomError(c, "Invalid token", 403);

    const { invitationId } = c.req.valid("param");

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: parseInt(userId),
      },
    });

    const invitation = await prisma.groupInvite.findUniqueOrThrow({
      where: {
        id: parseInt(invitationId),
        email: user.email,
      },
    });

    return c.json(
      await prisma.group.update({
        where: {
          id: invitation.groupId,
        },
        data: {
          invitations: {
            delete: {
              email_groupId: {
                email: user.email,
                groupId: invitation.groupId,
              },
            },
          },
        },
      })
    );
  }
);

export default invitations;
