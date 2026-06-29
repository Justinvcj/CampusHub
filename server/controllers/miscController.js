import { query } from "../config/db.js";
import { pagination, paged } from "../utils/pagination.js";

export async function notifications(req, res) {
  const rows = await query("SELECT * FROM notifications WHERE user_id=:id ORDER BY created_at DESC LIMIT 50", { id: req.user.id });
  res.json({ success: true, data: rows });
}
export async function readNotification(req, res) {
  await query("UPDATE notifications SET read_at=NOW() WHERE id=:id AND user_id=:userId", { id: req.params.id, userId: req.user.id });
  res.json({ success: true });
}
export async function search(req, res) {
  const term = `%${req.query.q || ""}%`;
  if (term.length < 4) return res.json({ success: true, data: {} });
  const [events, clubs, lostItems, announcements, users] = await Promise.all([
    query("SELECT id,title label,'event' type FROM events WHERE title LIKE :term AND deleted_at IS NULL LIMIT 5", { term }),
    query("SELECT id,name label,'club' type FROM clubs WHERE name LIKE :term AND deleted_at IS NULL LIMIT 5", { term }),
    query("SELECT id,title label,'lost-item' type FROM lost_items WHERE title LIKE :term AND deleted_at IS NULL LIMIT 5", { term }),
    query("SELECT id,title label,'announcement' type FROM announcements WHERE title LIKE :term LIMIT 5", { term }),
    req.user.role === "admin" ? query("SELECT id,name label,'user' type FROM users WHERE name LIKE :term AND deleted_at IS NULL LIMIT 5", { term }) : [],
  ]);
  res.json({ success: true, data: { events, clubs, lostItems, announcements, users } });
}
export async function users(req, res) {
  const { page, limit, offset } = pagination(req);
  const term = `%${req.query.search || ""}%`;
  const items = await query("SELECT id,name,email,role,department,created_at FROM users WHERE deleted_at IS NULL AND (name LIKE :term OR email LIKE :term) ORDER BY created_at DESC LIMIT :limit OFFSET :offset", { term, limit, offset });
  const [{ total }] = await query("SELECT COUNT(*) total FROM users WHERE deleted_at IS NULL AND (name LIKE :term OR email LIKE :term)", { term });
  res.json({ success: true, data: paged(items, total, page, limit) });
}
