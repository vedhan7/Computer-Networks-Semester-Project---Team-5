// ──────────────────────────────────────────────────────────────────────
// Zod-based input validation middleware.
// Parses req.body through a schema; rejects with structured errors.
// ──────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory — validates req.body against a Zod schema.
 *
 * Usage:
 *   router.post('/triage', validate(cnhsSchema), cnhsController);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formatted = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(422).json({
          success: false,
          error: 'Validation failed.',
          details: formatted,
        });
        return;
      }
      next(err);
    }
  };
}
