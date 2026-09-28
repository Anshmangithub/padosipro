import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { profileSchema } from './profile.schema';
import { getProfileHandler, saveProfileHandler } from './profile.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getProfileHandler);
router.put('/', validateBody(profileSchema), saveProfileHandler);

export default router;
