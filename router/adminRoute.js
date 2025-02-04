import express from "express";
import { isAuthenticated, isAuthorized } from "../middleware/auth.js";
import { isAdminActiveInActive } from "../controller/superAdminController.js";

const router = express.Router();

// admins routes
router.get('/admin/status/active-inactive', isAuthenticated, isAuthorized("Admin"), isAdminActiveInActive)

export default router;