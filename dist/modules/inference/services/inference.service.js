import { prisma } from '../../../config/prisma.js';
import { logger } from '../../../config/logger.js';
import { AppError } from '../../../middleware/error-handler.js';
class InferenceService {
    async execute(modelId, prompt, payload, apiKeyId) {
        const startTime = Date.now();
        logger.info(`Starting inference for model ${modelId} via API Key ${apiKeyId}`);
        const model = await prisma.model.findUnique({ where: { id: modelId } });
        if (!model) {
            throw new AppError('Model not found or disabled', 404);
        }
        const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
        if (!apiKey) {
            throw new AppError('API Key not found', 401);
        }
        try {
            // Stubbed inference logic. In a real application, you would connect to 
            // OpenAI, Anthropic, or an internal model inference server.
            const tokensUsedBase = prompt.split(' ').length;
            const responseData = {
                generated_text: `[STUB] Response from ${model.name} for prompt: "${prompt.substring(0, 50)}..."`,
                model: model.name,
                provider: model.provider,
            };
            const durationMs = Date.now() - startTime;
            // Calculate Stub Cost
            const costLog = Number(model.pricePer1kInput) * (tokensUsedBase / 1000) +
                Number(model.pricePer1kOutput) * (tokensUsedBase * 1.5 / 1000);
            // Save Inference Log
            const inferenceRecord = await prisma.inference.create({
                data: {
                    userId: apiKey.userId,
                    apiKeyId,
                    modelId,
                    input: { prompt, ...payload },
                    output: responseData,
                    inputTokens: tokensUsedBase,
                    outputTokens: Math.ceil(tokensUsedBase * 1.5), // stub compute token usage
                    totalTokens: tokensUsedBase + Math.ceil(tokensUsedBase * 1.5),
                    latencyMs: durationMs,
                    status: 'COMPLETED',
                    costUsd: costLog,
                    completedAt: new Date(),
                },
            });
            // Increment Usage Metric
            await this.createUsageRecord(inferenceRecord.id, apiKey.userId, modelId, tokensUsedBase, Math.ceil(tokensUsedBase * 1.5), costLog);
            return {
                id: inferenceRecord.id,
                ...responseData,
                usage: {
                    prompt_tokens: tokensUsedBase,
                    completion_tokens: Math.ceil(tokensUsedBase * 1.5),
                    total_tokens: tokensUsedBase + Math.ceil(tokensUsedBase * 1.5),
                },
                durationMs,
            };
        }
        catch (error) {
            logger.error('Inference Failed:', error);
            await prisma.inference.create({
                data: {
                    userId: apiKey.userId,
                    apiKeyId,
                    modelId,
                    input: { prompt, ...payload },
                    error: error.message,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    latencyMs: Date.now() - startTime,
                    status: 'FAILED',
                    costUsd: 0,
                    completedAt: new Date(),
                },
            });
            throw new AppError('Model inference failed', 500);
        }
    }
    async createUsageRecord(inferenceId, userId, modelId, inputTokens, outputTokens, cost) {
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
//# sourceMappingURL=inference.service.js.map