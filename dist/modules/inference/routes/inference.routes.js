import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { requireApiKey } from '../../../middleware/api-key.js';
import { InferenceController } from '../controllers/inference.controller.js';
import { inferenceRequestSchema } from '../schemas/inference.schema.js';
const router = Router();
router.post('/', requireApiKey, validate(inferenceRequestSchema), InferenceController.runInference);
export default router;
//# sourceMappingURL=inference.routes.js.map