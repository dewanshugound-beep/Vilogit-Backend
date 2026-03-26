import { ApiKeyService } from '../services/api-key.service.js';
export class ApiKeyController {
    static async list(req, res, next) {
        try {
            const userId = req.userId;
            const data = await ApiKeyService.listApiKeys(userId);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const userId = req.userId;
            const input = req.body;
            const data = await ApiKeyService.createApiKey(userId, input);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async revoke(req, res, next) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            await ApiKeyService.revokeApiKey(userId, id);
            res.status(200).json({ status: 'success', message: 'API Key revoked' });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=api-key.controller.js.map