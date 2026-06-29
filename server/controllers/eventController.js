import { query } from "../config/db.js";
import { pagination, paged } from "../utils/pagination.js";
import { notify } from "../services/notificationService.js";
import { audit } from "../services/auditService.js";
import QRCode from "qrcode";
import crypto from "node:crypto";

export async function list(req, res) {
  const { page, limit, offset } = pagination(req);
  const filters = ["e.deleted_at IS NULL"];
  const params = { limit, offset };
  for (const [key, col] of [["category", "e.category"], ["status", "e.status"], ["department", "e.department"]]) {
    if (req.query[key]) { filters.push(`${col}=:${key}`); params[key] = req.query[key]; }
  }
  if (req.query.search) { filters.push("(e.title LIKE :search OR e.description LIKE :search)"); params.search = `%${req.query.search}%`; }
  if (req.query.date) { filters.push("DATE(e.starts_at)=:date"); params.date = req.query.date; }
  const where = filters.join(" AND ");
  const items = await query(
    `SELECT e.*,u.name organizer_name,(SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id AND r.status='registered') registered_count FROM events e JOIN users u ON u.id=e.organizer_id WHERE ${where} ORDER BY e.starts_at LIMIT :limit OFFSET :offset`,
    params,
  );
  const [{ total }] = await query(`SELECT COUNT(*) total FROM events e WHERE ${where}`, params);
  res.json({ success: true, data: paged(items, total, page, limit) });
}

export async function get(req, res) {
  const items = await query("SELECT e.*,u.name organizer_name FROM events e JOIN users u ON u.id=e.organizer_id WHERE e.id=:id AND e.deleted_at IS NULL", { id: req.params.id });
  if (!items[0]) throw Object.assign(new Error("Event not found"), { status: 404 });
  res.json({ success: true, data: items[0] });
}

export async function create(req, res) {
  const bannerUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const result = await query(
    `INSERT INTO events (title,description,venue,starts_at,category,banner_url,max_capacity,registration_deadline,organizer_id,department,status)
     VALUES (:title,:description,:venue,:startsAt,:category,:bannerUrl,:maxCapacity,:deadline,:organizerId,:department,:status)`,
    { ...req.body, bannerUrl, organizerId: req.user.id, maxCapacity: Number(req.body.maxCapacity), status: req.body.status || "published", department: req.body.department || req.user.department },
  );
  await audit(req.user.id, "create", "event", result.insertId);
  res.status(201).json({ success: true, data: { id: result.insertId } });
}

export async function update(req, res) {
  const allowed = ["title", "description", "venue", "category", "department", "status"];
  const fields = allowed.filter((key) => req.body[key] !== undefined);
  if (!fields.length) throw Object.assign(new Error("No editable fields supplied"), { status: 422 });
  const sets = fields.map((key) => `${key}=:${key}`).join(",");
  await query(`UPDATE events SET ${sets} WHERE id=:id AND deleted_at IS NULL`, { ...req.body, id: req.params.id });
  await audit(req.user.id, "update", "event", req.params.id, req.body);
  res.json({ success: true, message: "Event updated" });
}

export async function remove(req, res) {
  await query("UPDATE events SET deleted_at=NOW() WHERE id=:id", { id: req.params.id });
  await audit(req.user.id, "delete", "event", req.params.id);
  res.json({ success: true, message: "Event deleted" });
}

export async function register(req, res) {
  const events = await query(
    "SELECT id,title,max_capacity,registration_deadline,(SELECT COUNT(*) FROM registrations WHERE event_id=events.id AND status='registered') registered FROM events WHERE id=:id AND status='published' AND deleted_at IS NULL",
    { id: req.params.id },
  );
  const event = events[0];
  if (!event) throw Object.assign(new Error("Event is not accepting registrations"), { status: 400 });
  if (new Date(event.registration_deadline) < new Date()) throw Object.assign(new Error("Registration deadline has passed"), { status: 400 });
  if (event.registered >= event.max_capacity) throw Object.assign(new Error("Event has reached capacity"), { status: 409 });
  await query(
    "INSERT INTO registrations (event_id,user_id,status) VALUES (:eventId,:userId,'registered') ON DUPLICATE KEY UPDATE status='registered',cancelled_at=NULL",
    { eventId: event.id, userId: req.user.id },
  );
  await notify(req.user.id, "event_registration", "Registration confirmed", `You are registered for ${event.title}.`, `/events/${event.id}`);
  res.status(201).json({ success: true, message: "Registration confirmed" });
}

export async function cancel(req, res) {
  await query("UPDATE registrations SET status='cancelled',cancelled_at=NOW() WHERE event_id=:eventId AND user_id=:userId", { eventId: req.params.id, userId: req.user.id });
  res.json({ success: true, message: "Registration cancelled" });
}

export async function participants(req, res) {
  const { page, limit, offset } = pagination(req);
  const items = await query("SELECT u.id,u.name,u.email,u.department,r.status,r.attended,r.created_at FROM registrations r JOIN users u ON u.id=r.user_id WHERE r.event_id=:id ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset", { id: req.params.id, limit, offset });
  const [{ total }] = await query("SELECT COUNT(*) total FROM registrations WHERE event_id=:id", { id: req.params.id });
  res.json({ success: true, data: paged(items, total, page, limit) });
}

export async function attendanceQr(req, res) {
  const value = `${process.env.CLIENT_URL}/attendance/${req.params.id}?code=${crypto.randomUUID()}`;
  res.json({ success: true, data: { qr: await QRCode.toDataURL(value) } });
}
