import { Hono } from "hono";
import prisma from "../utilities/prismaClient";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const waitlist = new Hono();

waitlist.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { name, email } = c.req.valid("json");

    return c.json(
      await prisma.waitlistMember.create({
        data: {
          name,
          email,
        },
      })
    );
  }
);

export default waitlist;
