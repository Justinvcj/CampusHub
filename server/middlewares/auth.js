import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) return next(Object.assign(new Error("Authentication required"), { status: 401 }));
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const users = await query(
      "SELECT id, name, email, role, department, avatar_url FROM users WHERE id=:id AND deleted_at IS NULL",
      { id: payload.sub },
    );
    if (!users[0]) return next(Object.assign(new Error("Account not found"), { status: 401 }));
    req.user = users[0];
    next();
  } catch {
    next(Object.assign(new Error("Invalid or expired access token"), { status: 401 }));
  }
}

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(Object.assign(new Error("You do not have permission for this action"), { status: 403 }));
