import { Router } from 'express';
import { ApiKeyController } from '../controllers/api-key.controller.js';
import { requireAuth } from '../../../middleware/require-auth.js';
import { validate } from '../../../middleware/validate.js';
import { createApiKeySchema } from '../schemas/api-key.schema.js';
const router = Router();
router.use(requireAuth);
router.get('/', ApiKeyController.list);
router.post('/', validate(createApiKeySchema), ApiKeyController.create);
router.post('/:id/revoke', ApiKeyController.revoke);
export default router;
//# sourceMappingURL=api-key.routes.js.map