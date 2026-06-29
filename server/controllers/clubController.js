import { query } from "../config/db.js";
import { pagination, paged } from "../utils/pagination.js";
import { notify } from "../services/notificationService.js";

export async function list(req, res) {
  const { page, limit, offset } = pagination(req);
  const where = req.query.search ? "c.deleted_at IS NULL AND c.name LIKE :search" : "c.deleted_at IS NULL";
  const params = { search: `%${req.query.search || ""}%`, limit, offset };
  const items = await query(`SELECT c.*,u.name faculty_name,(SELECT COUNT(*) FROM club_members m WHERE m.club_id=c.id AND m.status='active') member_count FROM clubs c JOIN users u ON u.id=c.faculty_id WHERE ${where} ORDER BY member_count DESC LIMIT :limit OFFSET :offset`, params);
  const [{ total }] = await query(`SELECT COUNT(*) total FROM clubs c WHERE ${where}`, params);
  res.json({ success: true, data: paged(items, total, page, limit) });
}

export async function create(req, res) {
  const result = await query("INSERT INTO clubs (name,description,department,faculty_id,logo_url) VALUES (:name,:description,:department,:facultyId,:logo)", { ...req.body, facultyId: req.user.id, logo: req.file ? `/uploads/${req.file.filename}` : null });
  res.status(201).json({ success: true, data: { id: result.insertId } });
}

export async function update(req, res) {
  await query("UPDATE clubs SET name=:name,description=:description,department=:department WHERE id=:id", { ...req.body, id: req.params.id });
  res.json({ success: true, message: "Club updated" });
}

export async function remove(req, res) {
  await query("UPDATE clubs SET deleted_at=NOW() WHERE id=:id", { id: req.params.id });
  res.json({ success: true, message: "Club deleted" });
}

export async function join(req, res) {
  await query("INSERT INTO club_members (club_id,user_id,status) VALUES (:clubId,:userId,'active') ON DUPLICATE KEY UPDATE status='active'", { clubId: req.params.id, userId: req.user.id });
  await notify(req.user.id, "club_join", "Club joined", "Welcome to your new club.", `/clubs/${req.params.id}`);
  res.status(201).json({ success: true, message: "Club joined" });
}

export async function leave(req, res) {
  await query("UPDATE club_members SET status='left' WHERE club_id=:clubId AND user_id=:userId", { clubId: req.params.id, userId: req.user.id });
  res.json({ success: true, message: "You left the club" });
}

export async function members(req, res) {
  const rows = await query("SELECT u.id,u.name,u.email,u.department,m.member_role,m.joined_at FROM club_members m JOIN users u ON u.id=m.user_id WHERE m.club_id=:id AND m.status='active'", { id: req.params.id });
  res.json({ success: true, data: rows });
}

export async function announce(req, res) {
  const result = await query("INSERT INTO announcements (club_id,author_id,title,body,is_pinned) VALUES (:clubId,:authorId,:title,:body,:pinned)", { clubId: req.params.id, authorId: req.user.id, title: req.body.title, body: req.body.body, pinned: Boolean(req.body.isPinned) });
  const members = await query("SELECT user_id FROM club_members WHERE club_id=:id AND status='active'", { id: req.params.id });
  await Promise.all(members.map((m) => notify(m.user_id, "announcement", req.body.title, req.body.body, `/clubs/${req.params.id}`)));
  res.status(201).json({ success: true, data: { id: result.insertId } });
}
