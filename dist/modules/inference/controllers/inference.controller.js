import { inferenceService } from '../services/inference.service.js';
import { AppError } from '../../../middleware/error-handler.js';
export class InferenceController {
    static async runInference(req, res, next) {
        try {
            const apiKey = req.apiKey;
            const { modelId, prompt, payload } = req.body;
            if (!modelId || !prompt) {
                throw new AppError('modelId and prompt are required', 400);
            }
            // Check user tier limits and balance
            // TODO: Implementation
            // Run Inference
            const response = await inferenceService.execute(modelId, prompt, payload, apiKey.id);
            res.status(200).json({
                status: 'success',
                data: response,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=inference.controller.js.map