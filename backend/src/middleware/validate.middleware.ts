import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';

/** Parses+validates req.body against `schema`, replacing it with the parsed value on success. */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      next(new ApiError(422, 'VALIDATION_ERROR', 'Validation failed.', details));
      return;
    }
    req.body = result.data;
    next();
  };
}
