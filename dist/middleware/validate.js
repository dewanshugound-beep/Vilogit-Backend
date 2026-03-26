import { AppError } from '../middleware/error-handler.js';
export const validate = (schema) => {
    return async (req, _res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (error) {
            return next(new AppError('Validation failed', 400, error.errors));
        }
    };
};
//# sourceMappingURL=validate.js.map