import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as items from "../controllers/lostItemController.js";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(items.list));
router.post("/", upload.single("image"), body("title").trim().notEmpty(), body("itemDate").isISO8601(), body("itemType").isIn(["lost", "found"]), validate, asyncHandler(items.create));
router.post("/:id/claim", body("proof").isLength({ min: 10 }), validate, asyncHandler(items.claim));
router.patch("/:id/status", authorize("admin"), asyncHandler(items.close));
router.get("/claims/all", authorize("admin"), asyncHandler(items.claims));
router.patch("/claims/:id", authorize("admin"), body("status").isIn(["approved", "rejected"]), validate, asyncHandler(items.reviewClaim));
export default router;
