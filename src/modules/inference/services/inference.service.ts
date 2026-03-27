import { prisma } from '../../../config/prisma.js';
import { logger } from '../../../config/logger.js';
import { AppError } from '../../../middleware/error-handler.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';

class InferenceService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async executeStream(modelId: string, prompt: string, payload: any, apiKeyId: string, res: Response) {
    const startTime = Date.now();
    logger.info(`Starting streaming inference for model ${modelId} via API Key ${apiKeyId}`);

    const modelRecord = await prisma.model.findUnique({ where: { id: modelId } });
    if (!modelRecord) {
      throw new AppError('Model not found or disabled', 404);
    }

    const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!apiKey) {
      throw new AppError('API Key not found', 401);
    }

    try {
      // Initialize Gemini Model
      const geminiModelId = modelRecord.providerModelId || 'gemini-1.5-flash';
      const model = this.genAI.getGenerativeModel({ model: geminiModelId });

      const result = await model.generateContentStream(prompt);

      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullText = '';
      let tokensUsedBase = prompt.split(' ').length;

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }

      const durationMs = Date.now() - startTime;
      const outputTokens = fullText.split(' ').length; // Rough estimate
      
      const costLog = Number(modelRecord.pricePer1kInput) * (tokensUsedBase / 1000) + 
                      Number(modelRecord.pricePer1kOutput) * (outputTokens / 1000);

      // Save Inference Log asynchronously
      prisma.inference.create({
        data: {
          userId: apiKey.userId,
          apiKeyId,
          modelId,
          input: { prompt, ...payload },
          output: { generated_text: fullText },
          inputTokens: tokensUsedBase,
          outputTokens,
          totalTokens: tokensUsedBase + outputTokens,
          latencyMs: durationMs,
          status: 'COMPLETED',
          costUsd: costLog,
          completedAt: new Date(),
        },
      }).then(async (record: any) => {
        await this.createUsageRecord(record.id, apiKey.userId, modelId, tokensUsedBase, outputTokens, costLog);
      }).catch((err: any) => logger.error('Failed to log inference:', err));

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error: any) {
      logger.error('Streaming Inference Failed:', error);
      res.write(`data: ${JSON.stringify({ error: 'Model inference failed' })}\n\n`);
      res.end();
    }
  }

  async execute(modelId: string, prompt: string, payload: any, apiKeyId: string) {
    const startTime = Date.now();
    const modelRecord = await prisma.model.findUnique({ where: { id: modelId } });
    if (!modelRecord) throw new AppError('Model not found', 404);

    const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!apiKey) throw new AppError('API Key not found', 401);

    try {
      const geminiModelId = modelRecord.providerModelId || 'gemini-1.5-flash';
      const model = this.genAI.getGenerativeModel({ model: geminiModelId });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const fullText = response.text();

      const durationMs = Date.now() - startTime;
      const tokensUsedBase = prompt.split(' ').length;
      const outputTokens = fullText.split(' ').length;
      
      const costLog = Number(modelRecord.pricePer1kInput) * (tokensUsedBase / 1000) + 
                      Number(modelRecord.pricePer1kOutput) * (outputTokens / 1000);

      const inferenceRecord = await prisma.inference.create({
        data: {
          userId: apiKey.userId,
          apiKeyId,
          modelId,
          input: { prompt, ...payload },
          output: { generated_text: fullText },
          inputTokens: tokensUsedBase,
          outputTokens,
          totalTokens: tokensUsedBase + outputTokens,
          latencyMs: durationMs,
          status: 'COMPLETED',
          costUsd: costLog,
          completedAt: new Date(),
        },
      });

      await this.createUsageRecord(inferenceRecord.id, apiKey.userId, modelId, tokensUsedBase, outputTokens, costLog);

      return {
        id: inferenceRecord.id,
        generated_text: fullText,
        usage: {
          prompt_tokens: tokensUsedBase,
          completion_tokens: outputTokens,
          total_tokens: tokensUsedBase + outputTokens,
        },
        durationMs,
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Inference failed', 500);
    }
  }

  private async createUsageRecord(inferenceId: string, userId: string, modelId: string, inputTokens: number, outputTokens: number, cost: number) {
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    await prisma.usageRecord.create({
      data: {
        userId,
        inferenceId,
        modelId,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd: cost,
        billingMonth,
      },
    });
  }
}

export const inferenceService = new InferenceService();
