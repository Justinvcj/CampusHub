import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as dashboard from "../controllers/dashboardController.js";

const router = Router();
router.use(authenticate);
router.get("/student", authorize("student"), asyncHandler(dashboard.student));
router.get("/faculty", authorize("faculty"), asyncHandler(dashboard.faculty));
router.get("/admin", authorize("admin"), asyncHandler(dashboard.admin));
export default router;
