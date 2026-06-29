import { query } from "../config/db.js";

const scalar = async (sql, params = {}) => (await query(sql, params))[0]?.value || 0;

export async function student(req, res) {
  const userId = req.user.id;
  const [upcoming, registered, clubs, reports, claims, notifications, activity] = await Promise.all([
    query("SELECT id,title,starts_at,venue FROM events WHERE starts_at>NOW() AND status='published' AND deleted_at IS NULL ORDER BY starts_at LIMIT 5"),
    scalar("SELECT COUNT(*) value FROM registrations WHERE user_id=:userId AND status='registered'", { userId }),
    scalar("SELECT COUNT(*) value FROM club_members WHERE user_id=:userId AND status='active'", { userId }),
    scalar("SELECT COUNT(*) value FROM lost_items WHERE reporter_id=:userId AND deleted_at IS NULL", { userId }),
    scalar("SELECT COUNT(*) value FROM claims WHERE claimer_id=:userId AND status='pending'", { userId }),
    query("SELECT * FROM notifications WHERE user_id=:userId ORDER BY created_at DESC LIMIT 6", { userId }),
    query("SELECT action,entity_type,created_at FROM audit_logs WHERE user_id=:userId ORDER BY created_at DESC LIMIT 6", { userId }),
  ]);
  res.json({ success: true, data: { stats: { registered, clubs, reports, claims }, upcoming, notifications, activity } });
}

export async function admin(_req, res) {
  const [students, faculty, events, clubs, lostItems, pendingClaims, registrations, recentUsers] = await Promise.all([
    scalar("SELECT COUNT(*) value FROM users WHERE role='student' AND deleted_at IS NULL"),
    scalar("SELECT COUNT(*) value FROM users WHERE role='faculty' AND deleted_at IS NULL"),
    scalar("SELECT COUNT(*) value FROM events WHERE deleted_at IS NULL"),
    scalar("SELECT COUNT(*) value FROM clubs WHERE deleted_at IS NULL"),
    scalar("SELECT COUNT(*) value FROM lost_items WHERE deleted_at IS NULL"),
    scalar("SELECT COUNT(*) value FROM claims WHERE status='pending'"),
    query("SELECT DATE_FORMAT(created_at,'%b') label,COUNT(*) value FROM registrations WHERE created_at>DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY YEAR(created_at),MONTH(created_at),label ORDER BY MIN(created_at)"),
    query("SELECT id,name,email,role,created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6"),
  ]);
  res.json({ success: true, data: { stats: { students, faculty, events, clubs, lostItems, pendingClaims }, charts: { registrations }, recentUsers } });
}

export async function faculty(req, res) {
  const [clubs, events, announcements] = await Promise.all([
    query("SELECT id,name,department FROM clubs WHERE faculty_id=:id AND deleted_at IS NULL", { id: req.user.id }),
    query("SELECT id,title,starts_at,status FROM events WHERE organizer_id=:id AND deleted_at IS NULL ORDER BY starts_at DESC LIMIT 6", { id: req.user.id }),
    query("SELECT a.title,a.created_at,c.name club_name FROM announcements a JOIN clubs c ON c.id=a.club_id WHERE a.author_id=:id ORDER BY a.created_at DESC LIMIT 6", { id: req.user.id }),
  ]);
  res.json({ success: true, data: { clubs, events, announcements } });
}
