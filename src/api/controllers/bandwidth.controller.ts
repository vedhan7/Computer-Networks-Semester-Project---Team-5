// ──────────────────────────────────────────────────────────────────────
// Controller — Equitable Bandwidth Allocator
// ──────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { computeBandwidthAllocation } from '../../core';
import config from '../../config';
import logger from '../../config/logger';
import type { BandwidthInput, ApiResponse, BandwidthResult } from '../../types';

export function bandwidthController(req: Request, res: Response): void {
  const requestId = uuidv4();
  try {
    const input: BandwidthInput = req.body;
    const result = computeBandwidthAllocation(input);

    const response: ApiResponse<BandwidthResult> = {
      success: true,
      data: result,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    };

    logger.info('Bandwidth allocation computed', {
      requestId,
      allocationCount: result.allocations.length,
    });
    res.status(200).json(response);
  } catch (err) {
    logger.error('Bandwidth controller error', { requestId, err });
    res.status(500).json({
      success: false,
      error: 'Internal computation error.',
      meta: { requestId, timestamp: new Date().toISOString(), version: config.apiVersion },
    });
  }
}
