import { Hono } from "hono";
import prisma from "../utilities/prismaClient";
import CustomError from "../utilities/CustomError";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
const jwt = require("jsonwebtoken");

const auth = new Hono();

auth.post(
  "/create_account",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      phone: z
        .string()
        .regex(new RegExp(/^\+[1-9]\d{1,14}$/), "Invalid number"),
    })
  ),
  async (c) => {
    const { name, phone } = c.req.valid("json");

    const phoneRegex = /^\+1\d{10}$/;
    const isValidPhone = phoneRegex.test(phone);

    if (isValidPhone) {
      let account = await prisma.user.findUnique({
        where: { phone },
      });
      if (account) {
        return CustomError(c, "Number already in use", 400);
      } else {
        const code = Math.floor(Math.random() * 900000) + 100000;
        account = await prisma.user.create({
          data: {
            phone,
            name,
            accessCode: {
              create: {
                code,
              },
            },
          },
        });

        // await client.messages.create({
        //   body: `Your code is ${code}`,
        //   from: process.env.TWILIO_PHONE,
        //   to: phone,
        // });
        return c.json({
          message: "Account created and verification code sent",
        });
      }
    } else {
      return c.json({ message: "Invalid phone" });
    }
  }
);

auth.post(
  "/request_code",
  zValidator(
    "json",
    z.object({
      phone: z.string(),
    })
  ),
  async (c) => {
    const { phone } = c.req.valid("json");

    const phoneRegex = /^\+1\d{10}$/;
    const isValidPhone = phoneRegex.test(phone);

    let user = await prisma.user.findUniqueOrThrow({
      where: {
        phone,
      },
      include: {
        accessCode: true,
      },
    });

    if (isValidPhone && !!user) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      if (user?.accessCode?.code) {
        await prisma.user.update({
          where: { phone },
          data: { accessCode: { delete: true } },
        });
      }
      await prisma.user.update({
        where: { phone },
        data: { accessCode: { create: { code } } },
      });

      // await client.messages.create({
      //   body: `Your code is ${code}`,
      //   from: process.env.TWILIO_PHONE,
      //   to: phone,
      // });
      return c.json({ message: "Message sent" });
    } else {
      if (!isValidPhone) return CustomError(c, "Invalid phone", 400);
      if (!user) return CustomError(c, "No user found", 400);
    }
  }
);

auth.post(
  "/sign_in",
  zValidator(
    "json",
    z.object({
      code: z.string(),
      phone: z.string(),
    })
  ),
  async (c) => {
    const { code, phone } = c.req.valid("json");

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        phone,
      },
      include: {
        accessCode: true,
      },
    });

    // Missing code
    if (!user.accessCode) {
      return CustomError(c, "Missing access code");
    }
    // Too many attempts
    else if (user.accessCode.attempts > 5) {
      await prisma.accessCode.delete({
        where: {
          userId: user.id,
        },
      });
      return CustomError(c, "Maxiumum number of tries exceeded", 400);
    }
    // Incorrect code
    else if (user.accessCode.code !== parseInt(code)) {
      await prisma.accessCode.update({
        where: {
          userId: user.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });
      return CustomError(c, "Incorrect Code", 403);
    }
    // Expired code (5 minutes)
    else if (Date.now() - user.accessCode.createdAt.getTime() > 5 * 60 * 1000) {
      await prisma.accessCode.delete({
        where: {
          userId: user.id,
        },
      });
      return CustomError(
        c,
        "Code has expired. Please request a new code.",
        400
      );
    }

    if (user.accessCode && user.accessCode.code === parseInt(code)) {
      if (process.env.JWT_SECRET) {
        await prisma.accessCode.delete({
          where: {
            userId: user.id,
          },
        });
        // SUCCESS
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        return c.json({ token });
      } else {
        return CustomError(c, "Could not create token.", 400);
      }
    } else {
      return CustomError(c, "Incorrect phone or code!", 400);
    }
  }
);

export default auth;
