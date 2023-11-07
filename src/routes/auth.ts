import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import prisma from "../utilities/prismaClient";
import CustomError from "../utilities/CustomError";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcrypt";
const jwt = require("jsonwebtoken");
import { Resend } from "resend";
import SpecialToken, { SpecialTokenType } from "../utilities/SpecialToken";
//
const resend = new Resend(process.env.RESEND_KEY);

const SALT_ROUNDS = 15;

const auth = new Hono();

/// PASSWORD
auth.get(
  "/confirm",
  zValidator(
    "query",
    z.object({
      token: z.string().optional(),
    })
  ),
  async (c) => {
    const { token } = c.req.valid("query");
    try {
      jwt.verify(token, SpecialToken(SpecialTokenType.confirm_account));
      const { userId } = jwt.decode(token) as any;

      await prisma.user.update({
        where: {
          id: parseInt(userId),
        },
        data: {
          confirmed: true,
        },
      });

      return c.redirect(
        `${process.env.WEBSITE_URL}/recipes?authFlow=confirm_success`
      );
    } catch {
      return c.redirect(
        `${process.env.WEBSITE_URL}/recipes?authFlow=confirm_error`
      );
    }
  }
);

auth.post(
  "/resend",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { email } = c.req.valid("json");

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!!user) {
      const token = jwt.sign(
        { userId: user.id },
        SpecialToken(SpecialTokenType.confirm_account)
      );
      try {
        await resend.emails.send({
          from: "Recipio <no-reply@mail.joshkeller.info>",
          to: [email],
          subject: "Confirm Email",
          html: `
            <div>
                <p>Click the following link to confirm your email:  <a href="${process.env.API_URL}/auth/confirm?token=${token}"> ${process.env.API_URL}/auth/confirm?token=${token}</a></p>
            </div>
            `,
          text: `Click the following link to confirm your email: ${process.env.API_URL}/auth/confirm?token=${token}`,
        });
      } catch (error) {
        console.error(error);
      }
      return c.json({
        message: "Email sent successfully",
      });
    } else {
      return CustomError(
        c,
        "No account with this email was found. Please create a new account",
        400
      );
    }
  }
);

auth.post(
  "/password/create_account",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      name: z.string(),
      password: z.string().min(8, "Password must be 8 characters or more "),
    })
  ),
  async (c) => {
    const { email, name, password } = c.req.valid("json");

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!!user) {
      return CustomError(c, "Email already in use", 400);
    } else {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);

      user = await prisma.user.create({
        data: {
          email,
          name,
          confirmed: false,
          password: {
            create: {
              hash,
            },
          },
        },
      });

      const token = jwt.sign(
        { userId: user.id },
        SpecialToken(SpecialTokenType.confirm_account)
      );
      try {
        await resend.emails.send({
          from: "Recipio <no-reply@mail.joshkeller.info>",
          to: [email],
          subject: "Confirm Email",
          html: `
            <div>
                <p>Click the following link to confirm your email:  <a href="${process.env.API_URL}/auth/confirm?token=${token}"> ${process.env.API_URL}/auth/confirm?token=${token}</a></p>
            </div>
            `,
          text: `<p>Click the following link to confirm your email: ${process.env.API_URL}/auth/confirm?token=${token}`,
        });
      } catch (error) {
        console.error(error);
      }

      return c.json({
        message:
          "Account created successfully. Confirm email before signing in.",
      });
    }
  }
);

auth.post(
  "/password/sign_in",
  zValidator(
    "json",
    z.object({
      email: z.string(),
      password: z.string(),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    let user;
    try {
      user = await prisma.user.findUniqueOrThrow({
        where: {
          email,
        },
        include: {
          password: true,
        },
      });
    } catch {
      return CustomError(c, "Could not find an account with this email", 400);
    }
    if (!user.confirmed) {
      return CustomError(c, "Please confirm email before signing in", 400);
    }

    // Missing code
    if (!user.password) {
      return CustomError(c, "Please reset password");
    }

    const valid = await bcrypt.compare(password, user.password.hash);

    if (valid === true) {
      if (process.env.JWT_SECRET) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        setCookie(c, "token", token, {
          path: "/",
        });
        return c.json({ token });
      } else {
        return CustomError(c, "Mising jwt secret", 400);
      }
    } else {
      return CustomError(c, "Incorrect email or password", 403);
    }
  }
);

//// SMS

// auth.post(
//   "/create_account",
//   zValidator(
//     "json",
//     z.object({
//       name: z.string(),
//       phone: z
//         .string()
//         .regex(new RegExp(/^\+[1-9]\d{1,14}$/), "Invalid number"),
//     })
//   ),
//   async (c) => {
//     const { name, phone } = c.req.valid("json");

//     const phoneRegex = /^\+1\d{10}$/;
//     const isValidPhone = phoneRegex.test(phone);

//     if (isValidPhone) {
//       let account = await prisma.user.findUnique({
//         where: { phone },
//       });
//       if (account) {
//         return CustomError(c, "Number already in use", 400);
//       } else {
//         const code = Math.floor(Math.random() * 900000) + 100000;
//         account = await prisma.user.create({
//           data: {
//             phone,
//             name,
//             accessCode: {
//               create: {
//                 code,
//               },
//             },
//           },
//         });

//         // await client.messages.create({
//         //   body: `Your code is ${code}`,
//         //   from: process.env.TWILIO_PHONE,
//         //   to: phone,
//         // });
//         return c.json({
//           message: "Account created and verification code sent",
//         });
//       }
//     } else {
//       return c.json({ message: "Invalid phone" });
//     }
//   }
// );

// auth.post(
//   "/request_code",
//   zValidator(
//     "json",
//     z.object({
//       phone: z.string(),
//     })
//   ),
//   async (c) => {
//     const { phone } = c.req.valid("json");

//     const phoneRegex = /^\+1\d{10}$/;
//     const isValidPhone = phoneRegex.test(phone);

//     let user = await prisma.user.findUniqueOrThrow({
//       where: {
//         phone,
//       },
//       include: {
//         accessCode: true,
//       },
//     });

//     if (isValidPhone && !!user) {
//       const code = Math.floor(Math.random() * 900000) + 100000;
//       if (user?.accessCode?.code) {
//         await prisma.user.update({
//           where: { phone },
//           data: { accessCode: { delete: true } },
//         });
//       }
//       await prisma.user.update({
//         where: { phone },
//         data: { accessCode: { create: { code } } },
//       });

//       // await client.messages.create({
//       //   body: `Your code is ${code}`,
//       //   from: process.env.TWILIO_PHONE,
//       //   to: phone,
//       // });
//       return c.json({ message: "Message sent" });
//     } else {
//       if (!isValidPhone) return CustomError(c, "Invalid phone", 400);
//       if (!user) return CustomError(c, "No user found", 400);
//     }
//   }
// );

// auth.post(
//   "/sign_in",
//   zValidator(
//     "json",
//     z.object({
//       code: z.string(),
//       phone: z.string(),
//     })
//   ),
//   async (c) => {
//     const { code, phone } = c.req.valid("json");

//     const user = await prisma.user.findUniqueOrThrow({
//       where: {
//         phone,
//       },
//       include: {
//         accessCode: true,
//       },
//     });

//     // Missing code
//     if (!user.accessCode) {
//       return CustomError(c, "Missing access code");
//     }
//     // Too many attempts
//     else if (user.accessCode.attempts > 5) {
//       await prisma.accessCode.delete({
//         where: {
//           userId: user.id,
//         },
//       });
//       return CustomError(c, "Maxiumum number of tries exceeded", 400);
//     }
//     // Incorrect code
//     else if (user.accessCode.code !== parseInt(code)) {
//       await prisma.accessCode.update({
//         where: {
//           userId: user.id,
//         },
//         data: {
//           attempts: {
//             increment: 1,
//           },
//         },
//       });
//       return CustomError(c, "Incorrect Code", 403);
//     }
//     // Expired code (5 minutes)
//     else if (Date.now() - user.accessCode.createdAt.getTime() > 5 * 60 * 1000) {
//       await prisma.accessCode.delete({
//         where: {
//           userId: user.id,
//         },
//       });
//       return CustomError(
//         c,
//         "Code has expired. Please request a new code.",
//         400
//       );
//     }

//     if (user.accessCode && user.accessCode.code === parseInt(code)) {
//       if (process.env.JWT_SECRET) {
//         await prisma.accessCode.delete({
//           where: {
//             userId: user.id,
//           },
//         });
//         // SUCCESS
//         const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
//         setCookie(c, "token", token, {
//           path: "/",
//           // domain: "recipes-api.joshkeller.info",
//         });
//         return c.json({ token });
//       } else {
//         return CustomError(c, "Could not create token.", 400);
//       }
//     } else {
//       return CustomError(c, "Incorrect phone or code!", 400);
//     }
//   }
// );

export default auth;
