import { query } from "../config/db.js";
import { pagination, paged } from "../utils/pagination.js";
import { notify } from "../services/notificationService.js";

export async function list(req, res) {
  const { page, limit, offset } = pagination(req);
  const filters = ["l.deleted_at IS NULL"];
  const params = { limit, offset };
  for (const key of ["category", "status", "item_type"]) if (req.query[key]) { filters.push(`l.${key}=:${key}`); params[key] = req.query[key]; }
  if (req.query.search) { filters.push("(l.title LIKE :search OR l.description LIKE :search OR l.location LIKE :search)"); params.search = `%${req.query.search}%`; }
  const where = filters.join(" AND ");
  const items = await query(`SELECT l.*,u.name reporter_name FROM lost_items l JOIN users u ON u.id=l.reporter_id WHERE ${where} ORDER BY l.item_date DESC LIMIT :limit OFFSET :offset`, params);
  const [{ total }] = await query(`SELECT COUNT(*) total FROM lost_items l WHERE ${where}`, params);
  res.json({ success: true, data: paged(items, total, page, limit) });
}

export async function create(req, res) {
  const result = await query(
    "INSERT INTO lost_items (title,description,category,location,item_date,image_url,item_type,status,reporter_id) VALUES (:title,:description,:category,:location,:itemDate,:image,:itemType,'open',:userId)",
    { ...req.body, image: req.file ? `/uploads/${req.file.filename}` : null, userId: req.user.id },
  );
  res.status(201).json({ success: true, data: { id: result.insertId } });
}

export async function claim(req, res) {
  const items = await query("SELECT id,reporter_id,title,status FROM lost_items WHERE id=:id AND deleted_at IS NULL", { id: req.params.id });
  if (!items[0] || items[0].status !== "open") throw Object.assign(new Error("This item cannot be claimed"), { status: 409 });
  const result = await query("INSERT INTO claims (lost_item_id,claimer_id,proof,status) VALUES (:itemId,:userId,:proof,'pending')", { itemId: req.params.id, userId: req.user.id, proof: req.body.proof });
  await notify(items[0].reporter_id, "claim", "New claim request", `Someone submitted a claim for ${items[0].title}.`, "/claims");
  res.status(201).json({ success: true, data: { id: result.insertId } });
}

export async function claims(req, res) {
  const rows = await query("SELECT c.*,l.title item_title,u.name claimer_name FROM claims c JOIN lost_items l ON l.id=c.lost_item_id JOIN users u ON u.id=c.claimer_id ORDER BY c.created_at DESC");
  res.json({ success: true, data: rows });
}

export async function reviewClaim(req, res) {
  const status = req.body.status;
  await query("UPDATE claims SET status=:status,reviewed_by=:admin,reviewed_at=NOW(),review_notes=:notes WHERE id=:id", { status, admin: req.user.id, notes: req.body.notes || null, id: req.params.id });
  const rows = await query("SELECT c.claimer_id,c.lost_item_id,l.title FROM claims c JOIN lost_items l ON l.id=c.lost_item_id WHERE c.id=:id", { id: req.params.id });
  if (status === "approved") await query("UPDATE lost_items SET status='claimed' WHERE id=:id", { id: rows[0].lost_item_id });
  await notify(rows[0].claimer_id, "claim_review", `Claim ${status}`, `Your claim for ${rows[0].title} was ${status}.`, "/lost-found");
  res.json({ success: true, message: `Claim ${status}` });
}

export async function close(req, res) {
  await query("UPDATE lost_items SET status=:status WHERE id=:id", { status: req.body.status || "closed", id: req.params.id });
  res.json({ success: true, message: "Case updated" });
}
