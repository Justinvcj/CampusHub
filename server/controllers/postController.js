import { query } from "../config/db.js";
import { pagination, paged } from "../utils/pagination.js";

export async function list(req, res) {
  const { page, limit, offset } = pagination(req);
  const items = await query(
    "SELECT p.*,u.name author_name,(SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) like_count,(SELECT COUNT(*) FROM comments WHERE post_id=p.id AND deleted_at IS NULL) comment_count FROM posts p JOIN users u ON u.id=p.author_id WHERE p.club_id=:club AND p.deleted_at IS NULL ORDER BY p.is_pinned DESC,p.created_at DESC LIMIT :limit OFFSET :offset",
    { club: req.params.clubId, limit, offset },
  );
  const [{ total }] = await query("SELECT COUNT(*) total FROM posts WHERE club_id=:club AND deleted_at IS NULL", { club: req.params.clubId });
  res.json({ success: true, data: paged(items, total, page, limit) });
}

export async function create(req, res) {
  const result = await query("INSERT INTO posts (club_id,author_id,body,image_url) VALUES (:club,:author,:body,:image)", { club: req.params.clubId, author: req.user.id, body: req.body.body, image: req.file ? `/uploads/${req.file.filename}` : null });
  res.status(201).json({ success: true, data: { id: result.insertId } });
}

export async function comment(req, res) {
  const result = await query("INSERT INTO comments (post_id,author_id,body) VALUES (:post,:author,:body)", { post: req.params.id, author: req.user.id, body: req.body.body });
  res.status(201).json({ success: true, data: { id: result.insertId } });
}

export async function like(req, res) {
  await query("INSERT IGNORE INTO post_likes (post_id,user_id) VALUES (:post,:user)", { post: req.params.id, user: req.user.id });
  res.json({ success: true, message: "Post liked" });
}
