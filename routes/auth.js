import { Router } from "express";
import authController from "../controllers/authController.js";

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

export default router;