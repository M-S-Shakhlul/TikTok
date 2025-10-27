// Auth routes
import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    registerValidation,
    loginValidation,
    resetPasswordValidation
} from '../validation/userValidate.js';

const router = express.Router();

router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', validate(loginValidation), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), authController.resetPassword);

export default router;