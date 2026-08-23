import { Router } from 'express';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/register', ctrl.register);
router.post('/verify-otp', ctrl.verifyOtp);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.get('/me', ctrl.getMe);

export default router;
