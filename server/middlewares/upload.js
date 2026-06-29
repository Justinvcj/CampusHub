import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

const storage = multer.diskStorage({
  destination: "server/uploads",
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /image\/(jpeg|png|webp)|application\/pdf/.test(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error("Only JPG, PNG, WebP, or PDF files are allowed"), { status: 422 })),
});
