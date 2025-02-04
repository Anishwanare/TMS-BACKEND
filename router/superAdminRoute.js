import express from "express";
import { fetchAdmins, getAdminProfile, getUsersProfile, isAdminActiveInActive, login, logout, register, UpdateAdminProfile } from "../controller/superAdminController.js";
import { isAuthenticated, isAuthorized } from "../middleware/auth.js";


const router = express.Router();

// superadmin routes
router.post('/register', isAuthenticated, isAuthorized("SuperAdmin"), register)
router.post('/login', login)
router.get('/fetch/admins', isAuthenticated, isAuthorized("SuperAdmin"), fetchAdmins)
router.put('/admin-inactive-active', isAuthenticated, isAuthorized("SuperAdmin"), isAdminActiveInActive)
router.get('/admin-profile-page/:adminId', isAuthenticated, isAuthorized("SuperAdmin"), getAdminProfile)
router.put('/update-admin-profile/:adminId', isAuthenticated, isAuthorized("SuperAdmin"), UpdateAdminProfile)
router.get('/logout', isAuthenticated, isAuthorized("SuperAdmin", "Admin", "User"), logout)



// fetch profiles
router.get('/profile', isAuthenticated, getUsersProfile)





export default router;
