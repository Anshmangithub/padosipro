import { Router } from 'express';
import { validateBody } from '../../middleware/validate.middleware';
import { loginSchema, registerSchema, resendOtpSchema, verifyOtpSchema } from './auth.schema';
import { loginHandler, registerHandler, resendOtpHandler, verifyOtpHandler } from './auth.controller';

const router = Router();

router.post('/register', validateBody(registerSchema), registerHandler);
router.post('/login', validateBody(loginSchema), loginHandler);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtpHandler);
router.post('/resend-otp', validateBody(resendOtpSchema), resendOtpHandler);

export default router;
