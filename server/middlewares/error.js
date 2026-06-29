export function notFound(req, _res, next) {
  next(Object.assign(new Error(`Route ${req.method} ${req.originalUrl} not found`), { status: 404 }));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.code === "ER_DUP_ENTRY" ? 409 : 500);
  if (process.env.NODE_ENV !== "test") console.error(err);
  res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong" : err.message,
    ...(err.details ? { errors: err.details } : {}),
  });
}
