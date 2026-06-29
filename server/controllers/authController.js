import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { refreshCookie, signAccessToken, signRefreshToken } from "../utils/tokens.js";
import { notify } from "../services/notificationService.js";

const publicUser = ({ password_hash, refresh_token_hash, reset_token_hash, ...user }) => user;

export async function register(req, res) {
  const { name, email, password, role = "student", department } = req.body;
  if (role === "admin") throw Object.assign(new Error("Admin accounts cannot be self-registered"), { status: 403 });
  const existing = await query("SELECT id FROM users WHERE email=:email", { email });
  if (existing.length) throw Object.assign(new Error("An account with this email already exists"), { status: 409 });
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    "INSERT INTO users (name,email,password_hash,role,department) VALUES (:name,:email,:passwordHash,:role,:department)",
    { name, email, passwordHash, role, department: department || null },
  );
  const user = { id: result.insertId, name, email, role, department };
  const refreshToken = signRefreshToken(user);
  await query("UPDATE users SET refresh_token_hash=:hash WHERE id=:id", {
    hash: await bcrypt.hash(refreshToken, 10),
    id: user.id,
  });
  await notify(user.id, "welcome", "Welcome to CampusHub", "Your campus community is ready.");
  res.cookie("campushub_refresh", refreshToken, refreshCookie).status(201).json({ success: true, data: { user, accessToken: signAccessToken(user) } });
}

export async function login(req, res) {
  const users = await query("SELECT * FROM users WHERE email=:email AND deleted_at IS NULL", { email: req.body.email });
  const user = users[0];
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }
  const refreshToken = signRefreshToken(user);
  await query("UPDATE users SET refresh_token_hash=:hash,last_login_at=NOW() WHERE id=:id", {
    hash: await bcrypt.hash(refreshToken, 10),
    id: user.id,
  });
  res.cookie("campushub_refresh", refreshToken, refreshCookie).json({
    success: true,
    data: { user: publicUser(user), accessToken: signAccessToken(user) },
  });
}

export async function refresh(req, res) {
  const token = req.cookies.campushub_refresh;
  if (!token) throw Object.assign(new Error("Refresh token required"), { status: 401 });
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const users = await query("SELECT * FROM users WHERE id=:id AND deleted_at IS NULL", { id: payload.sub });
  if (!users[0]?.refresh_token_hash || !(await bcrypt.compare(token, users[0].refresh_token_hash))) {
    throw Object.assign(new Error("Refresh token is no longer valid"), { status: 401 });
  }
  res.json({ success: true, data: { accessToken: signAccessToken(users[0]) } });
}

export async function logout(req, res) {
  const token = req.cookies.campushub_refresh;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await query("UPDATE users SET refresh_token_hash=NULL WHERE id=:id", { id: payload.sub });
    } catch {}
  }
  res.clearCookie("campushub_refresh", refreshCookie).json({ success: true, message: "Signed out" });
}

export async function forgotPassword(req, res) {
  const users = await query("SELECT id FROM users WHERE email=:email", { email: req.body.email });
  if (users[0]) {
    const token = crypto.randomBytes(32).toString("hex");
    await query("UPDATE users SET reset_token_hash=:hash,reset_token_expires=DATE_ADD(NOW(),INTERVAL 1 HOUR) WHERE id=:id", {
      hash: crypto.createHash("sha256").update(token).digest("hex"),
      id: users[0].id,
    });
    await notify(users[0].id, "password_reset", "Password reset requested", "A password reset was requested for your account.");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Reset-Token", token);
  }
  res.json({ success: true, message: "If that email exists, reset instructions have been prepared." });
}

export async function resetPassword(req, res) {
  const hash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const users = await query(
    "SELECT id FROM users WHERE reset_token_hash=:hash AND reset_token_expires>NOW()",
    { hash },
  );
  if (!users[0]) throw Object.assign(new Error("Reset link is invalid or expired"), { status: 400 });
  await query(
    "UPDATE users SET password_hash=:password,reset_token_hash=NULL,reset_token_expires=NULL,refresh_token_hash=NULL WHERE id=:id",
    { password: await bcrypt.hash(req.body.password, 12), id: users[0].id },
  );
  res.json({ success: true, message: "Password updated successfully" });
}

export const me = (req, res) => res.json({ success: true, data: req.user });
