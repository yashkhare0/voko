import { z } from 'zod';

/**
 * Voko configuration schema (see PRD §8 Configuration)
 * - Unknown keys are rejected (strict)
 * - Sensible defaults provided for all fields
 */
export const ConfigSchema = z
  .object({
    frameworks: z.array(z.string()).nonempty().default(['react-next']),
    library: z.record(z.string(), z.string()).default({ 'react-next': 'next-intl' }),
    defaultLocale: z.string().default('en'),
    locales: z.array(z.string()).nonempty().default(['en']),
    globs: z.record(z.string(), z.array(z.string()).nonempty()).default({
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
  .strict()
  .superRefine((cfg, ctx) => {
    const uniq = (a: readonly string[]) => new Set(a).size === a.length;

    if (!uniq(cfg.frameworks)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frameworks'],
        message: 'frameworks must not contain duplicates',
      });
    }
    if (!uniq(cfg.locales)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['locales'],
        message: 'locales must not contain duplicates',
      });
    }
    if (!cfg.locales.includes(cfg.defaultLocale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultLocale'],
        message: 'defaultLocale must be included in locales',
      });
    }

    const fw = new Set(cfg.frameworks);
    for (const k of Object.keys(cfg.library)) {
      if (!fw.has(k))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['library', k],
          message: 'key not listed in frameworks',
        });
    }
    for (const k of Object.keys(cfg.globs)) {
      if (!fw.has(k))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['globs', k],
          message: 'key not listed in frameworks',
        });
      else if (cfg.globs[k].length === 0)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['globs', k],
          message: 'must provide at least one glob',
        });
    }
    for (const k of Object.keys(cfg.namespaceStrategy)) {
      if (!fw.has(k))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['namespaceStrategy', k],
          message: 'key not listed in frameworks',
        });
    }
  });
