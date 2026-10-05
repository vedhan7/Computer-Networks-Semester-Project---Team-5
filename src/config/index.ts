// ──────────────────────────────────────────────────────────────────────
// Centralised configuration — reads .env once, validates, freezes.
// ──────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly apiSecret: string;
  readonly quarantineWebhookUrl: string;
  readonly tipsCron: string;
  readonly tipsLookaheadMinutes: number;
  readonly logLevel: string;
  readonly cnhsThreshold: number;
  readonly jaccardThreshold: number;
  readonly apiVersion: string;
}

function requiredEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

const config: AppConfig = Object.freeze({
  port: parseInt(requiredEnv('PORT', '3000'), 10),
  nodeEnv: requiredEnv('NODE_ENV', 'development'),
  apiSecret: requiredEnv('API_SECRET', 'dev-secret-do-not-use-in-prod'),
  quarantineWebhookUrl: requiredEnv(
    'QUARANTINE_WEBHOOK_URL',
    'http://localhost:3000/api/v1/quarantine/ingest',
  ),
  tipsCron: requiredEnv('TIPS_CRON_EXPRESSION', '*/1 * * * *'),
  tipsLookaheadMinutes: parseInt(
    requiredEnv('TIPS_LOOKAHEAD_MINUTES', '60'),
    10,
  ),
  logLevel: requiredEnv('LOG_LEVEL', 'debug'),
  cnhsThreshold: 80,
  jaccardThreshold: 0.6,
  apiVersion: '1.0.0',
});

export default config;
