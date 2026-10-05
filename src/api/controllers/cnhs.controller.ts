// ──────────────────────────────────────────────────────────────────────
// Controller — CNHS Threat Triage
// Thin HTTP adapter.  ALL math lives in core/cnhs.service.ts.
// ──────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { evaluateCnhs } from '../../core';
import config from '../../config';
import logger from '../../config/logger';
import type { CnhsInput, ApiResponse, CnhsResult } from '../../types';

export async function cnhsController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  try {
    const input: CnhsInput = req.body;
    const result = await evaluateCnhs(input);

    const response: ApiResponse<CnhsResult> = {
      success: true,
      data: result,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    };

    logger.info('CNHS evaluation complete', { requestId, cnhs: result.cnhsScore });
    res.status(200).json(response);
  } catch (err) {
    logger.error('CNHS controller error', { requestId, err });
    res.status(500).json({
      success: false,
      error: 'Internal computation error.',
      meta: { requestId, timestamp: new Date().toISOString(), version: config.apiVersion },
    });
  }
}
