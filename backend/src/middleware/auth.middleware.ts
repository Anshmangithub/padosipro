import type { RequestHandler } from 'express';
import { verifyAuthToken } from '../lib/jwt';
import { ApiError } from '../utils/apiError';

/** Requires a valid `Authorization: Bearer <jwt>` header; attaches req.user on success. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header.'));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Session expired or invalid. Please log in again.'));
  }
};
