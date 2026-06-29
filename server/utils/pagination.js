export function pagination(req) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  return { page, limit, offset: (page - 1) * limit };
}

export const paged = (items, total, page, limit) => ({
  items,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) },
});
