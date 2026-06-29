import { Router } from "express";
import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import * as auth from "../controllers/authController.js";

const router = Router();
const password = body("password").isLength({ min: 8 }).matches(/[A-Z]/).matches(/[a-z]/).matches(/\d/).withMessage("Password must be 8+ characters with upper, lower, and number");
router.post("/register", body("name").trim().isLength({ min: 2 }), body("email").isEmail().normalizeEmail(), password, validate, asyncHandler(auth.register));
router.post("/login", body("email").isEmail().normalizeEmail(), body("password").notEmpty(), validate, asyncHandler(auth.login));
router.post("/refresh", asyncHandler(auth.refresh));
router.post("/logout", asyncHandler(auth.logout));
router.post("/forgot-password", body("email").isEmail().normalizeEmail(), validate, asyncHandler(auth.forgotPassword));
router.post("/reset-password", body("token").notEmpty(), password, validate, asyncHandler(auth.resetPassword));
router.get("/me", authenticate, auth.me);
export default router;
