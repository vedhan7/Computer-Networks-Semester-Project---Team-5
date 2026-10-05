// ──────────────────────────────────────────────────────────────────────
// Zod schemas — strict contracts for every inbound payload.
// ──────────────────────────────────────────────────────────────────────

import { z } from 'zod';

/* ───── Module 1: CNHS ───── */

export const cnhsSchema = z.object({
  observedBandwidth: z
    .number({ required_error: 'observedBandwidth is required.' })
    .nonnegative('observedBandwidth must be ≥ 0.'),
  predictedBandwidth: z
    .number({ required_error: 'predictedBandwidth is required.' })
    .nonnegative('predictedBandwidth must be ≥ 0.'),
  academicPriority: z
    .number({ required_error: 'academicPriority is required.' })
    .int()
    .min(1)
    .max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
});

/* ───── Module 2: Bandwidth ───── */

export const bandwidthSchema = z.object({
  bottleneckCapacityMbps: z
    .number({ required_error: 'bottleneckCapacityMbps is required.' })
    .positive('Capacity must be > 0.'),
  classes: z
    .array(
      z.object({
        classId: z.string().min(1, 'classId must be non-empty.'),
        priorityRank: z.number().int().min(1),
        studentCount: z.number().int().nonnegative(),
      }),
    )
    .min(1, 'At least one competing class is required.'),
});

/* ───── Module 3: Jaccard ───── */

export const jaccardSchema = z.object({
  connectedMacAddresses: z
    .array(z.string().min(1))
    .min(0, 'connectedMacAddresses must be an array.'),
  officialRosterIds: z
    .array(z.string().min(1))
    .min(1, 'officialRosterIds must contain at least one entry.'),
});

/* ───── Module 4: TIPS ───── */

export const tipsSchema = z.object({
  classes: z
    .array(
      z.object({
        classId: z.string().min(1),
        className: z.string().min(1),
        eventTime: z.string().datetime({ message: 'eventTime must be ISO-8601.' }),
        durationMinutes: z.number().int().positive(),
      }),
    )
    .min(1, 'At least one class is required.'),
});
