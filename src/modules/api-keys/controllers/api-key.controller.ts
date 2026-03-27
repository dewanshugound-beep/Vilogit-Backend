import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service.js';
import { CreateApiKeyInput } from '../schemas/api-key.schema.js';
import { AuthenticatedRequest } from '@/middleware/require-auth.js';

export class ApiKeyController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const data = await ApiKeyService.listApiKeys(userId);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const input: CreateApiKeyInput = req.body;
      const data = await ApiKeyService.createApiKey(userId, input);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { id } = req.params;
      await ApiKeyService.revokeApiKey(userId, id as string);
      res.status(200).json({ status: 'success', message: 'API Key revoked' });
    } catch (error) {
      next(error);
    }
  }
}
