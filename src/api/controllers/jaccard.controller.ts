// ──────────────────────────────────────────────────────────────────────
// Controller — Spatial Triangulation (Jaccard)
// ──────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { evaluateJaccard } from '../../core';
import config from '../../config';
import logger from '../../config/logger';
import type { JaccardInput, ApiResponse, JaccardResult } from '../../types';

export function jaccardController(req: Request, res: Response): void {
  const requestId = uuidv4();
  try {
    const input: JaccardInput = req.body;
    const result = evaluateJaccard(input);

    const response: ApiResponse<JaccardResult> = {
      success: true,
      data: result,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    };

    logger.info('Jaccard evaluation complete', {
      requestId,
      matchScore: result.matchScore,
      authorized: result.migrationAuthorized,
    });
    res.status(200).json(response);
  } catch (err) {
    logger.error('Jaccard controller error', { requestId, err });
    res.status(500).json({
      success: false,
      error: 'Internal computation error.',
      meta: { requestId, timestamp: new Date().toISOString(), version: config.apiVersion },
    });
  }
}
