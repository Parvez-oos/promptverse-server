import { Router } from 'express';
import { register, login, googleLogin, refreshToken, getMe } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema, googleLoginSchema, refreshTokenSchema } from '../validations/authValidation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google-login', validate(googleLoginSchema), googleLogin);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.get('/me', authenticate, getMe);

export default router;
