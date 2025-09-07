import { z } from 'zod';

/**
 * Voko configuration schema (see PRD §8 Configuration)
 * - Unknown keys are rejected (strict)
 * - Sensible defaults provided for all fields
 */
export const ConfigSchema = z
  .object({
    frameworks: z.array(z.string()).default(['react-next']),
    library: z.record(z.string(), z.string()).default({ 'react-next': 'next-intl' }),
    defaultLocale: z.string().default('en'),
    locales: z.array(z.string()).default(['en']),
    globs: z.record(z.string(), z.array(z.string())).default({
      'react-next': ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    }),
    ignore: z.array(z.string()).default(['**/__tests__/**', '**/*.stories.*', 'node_modules/**']),
    namespaceStrategy: z
      .record(z.string(), z.enum(['route', 'flat']))
      .default({ 'react-next': 'route' }),
    attributes: z.array(z.string()).default(['alt', 'title', 'aria-label', 'placeholder']),
    rewrite: z
      .object({
        enabled: z.boolean().default(false),
        rich: z.boolean().default(true),
        keepFormatting: z.boolean().default(true),
      })
      .default({ enabled: false, rich: true, keepFormatting: true }),
    quarantineDays: z.number().int().positive().default(14),
  })
  .strict();
