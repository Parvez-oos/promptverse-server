import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  updateProfile,
  getTopCreators,
  getUserProfile,
} from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema, updateRoleSchema } from '../validations/userValidation';

const router = Router();

router.get('/top-creators', getTopCreators);
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/role', authenticate, authorize('admin'), validate(updateRoleSchema), updateUserRole);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
