import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../../../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/otp', AuthController.signInWithOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;
