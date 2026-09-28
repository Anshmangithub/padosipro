import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { taskSelectionSchema } from './tasks.schema';
import { getSelectionHandler, listCatalogueHandler, saveSelectionHandler } from './tasks.controller';

const router = Router();

router.use(requireAuth);
router.get('/', listCatalogueHandler);
router.get('/selection', getSelectionHandler);
router.post('/selection', validateBody(taskSelectionSchema), saveSelectionHandler);

export default router;
