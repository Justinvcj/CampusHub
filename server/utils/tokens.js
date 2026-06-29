import jwt from "jsonwebtoken";
import crypto from "node:crypto";

export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, nonce: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${process.env.REFRESH_TOKEN_DAYS || 7}d`,
  });

export const refreshCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 7) * 86400000,
};
