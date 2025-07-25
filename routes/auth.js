import { Router } from "express";
import authController from "../controllers/authController.js";
import { authenticate } from "../middlewares/tokenManager.js";
import { loginValidation, registerValidation, validate } from "../middlewares/validator.js";

const router = Router();

router.post('/login', validate(loginValidation), authController.login);
router.post('/register', validate(registerValidation), authController.register);
router.get('/logout', authenticate, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

export default router;