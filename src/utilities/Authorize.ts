import { Context, Next } from "hono";
import CustomError from "./CustomError";
const jwt = require("jsonwebtoken");

const Authorize = async (c: Context, next: Next) => {
  c.header("userId", undefined);
  const token = c.req.header("Authorization");
  let verified = false;
  if (!!token) {
    if (jwt.verify(token, process.env.JWT_SECRET)) {
      verified = true;
    } else {
      return CustomError(c, "Invalid token", 403);
    }
  } else {
    return CustomError(c, "Missing Authorization Header", 403);
  }

  if (verified) {
    const { userId } = jwt.decode(token) as any;
    c.req.headers.set("userId", userId);
  } else {
    return CustomError(c, "Invalid token");
  }
  if (!c.req.header("userId")) {
    return CustomError(c, "Invalid token");
  }
  await next();
};

export default Authorize;
