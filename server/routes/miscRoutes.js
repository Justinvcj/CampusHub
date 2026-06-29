import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as misc from "../controllers/miscController.js";
import * as posts from "../controllers/postController.js";

const router = Router();
router.get("/notifications", authenticate, asyncHandler(misc.notifications));
router.patch("/notifications/:id/read", authenticate, asyncHandler(misc.readNotification));
router.get("/search", authenticate, asyncHandler(misc.search));
router.get("/users", authenticate, authorize("admin"), asyncHandler(misc.users));
router.post("/posts/:id/comments", authenticate, body("body").notEmpty(), validate, asyncHandler(posts.comment));
router.post("/posts/:id/likes", authenticate, asyncHandler(posts.like));
export default router;
