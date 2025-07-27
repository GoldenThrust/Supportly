
import { COOKIE_NAME } from "../utils/constants.js";
import jwt from "jsonwebtoken";
import process from "process";
import User from "../model/User.js";
import { verifyToken } from "./tokenManager.js";

export default async function socketAuthenticateToken(socket, next) {
  const req = socket.request;
  const token = req.signedCookies[COOKIE_NAME];

  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new Error("Unauthorized"));
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    return next(new Error("User not found"));
  }
  socket.user = decoded;
  socket._id = decoded._id;
  next();
}
