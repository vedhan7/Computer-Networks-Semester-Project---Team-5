// ──────────────────────────────────────────────────────────────────────
// RBAC Middleware — Role-Based Access Control
//
// Lightweight bearer-token scheme (HMAC-based, no JWT dependency).
// In production, swap for a proper OAuth2/JWT verifier.
// ──────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../../config';
import logger from '../../config/logger';
import type { Role, AuthPayload } from '../../types';

// Extend Express Request to carry decoded auth data.
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/**
 * Generate a bearer token for a given subject and role.
 * Token format: base64(JSON payload).base64(HMAC-SHA256 signature)
 */
export function generateToken(sub: string, role: Role): string {
  const payload: AuthPayload = { sub, role, iat: Date.now() };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.apiSecret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode a bearer token.
 */
function verifyToken(token: string): AuthPayload | null {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', config.apiSecret)
    .update(payloadB64)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Express middleware factory — restricts to specified roles.
 *
 * Usage:  router.post('/sensitive', authorize('admin', 'operator'), handler);
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Missing or malformed Authorization header.' });
      return;
    }

    const token = header.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Token verification failed', { ip: req.ip });
      res.status(401).json({ success: false, error: 'Invalid or expired token.' });
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      logger.warn('Insufficient role', { sub: decoded.sub, role: decoded.role, required: allowedRoles });
      res.status(403).json({ success: false, error: `Role '${decoded.role}' is not authorized for this endpoint.` });
      return;
    }

    req.auth = decoded;
    next();
  };
}
