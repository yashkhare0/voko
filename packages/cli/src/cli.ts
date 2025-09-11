import { Command } from 'commander';
import {
  createLogger,
  loadConfig,
  readManifest,
  reconcileManifest,
  writeManifest,
  writeScanReport,
  ConfigError,
  type CandidateIR,
} from '@voko/core';

const program = new Command();

program
  .name('voko')
  .description('Automated i18n assistant for your app')
  .option('--config <path>', 'path to voko.config.json')
  .option('--json', 'machine-readable logs', false)
  .option('--verbose', 'verbose logging', false);

program
  .command('scan')
  .description('Run adapters, reconcile with manifest, and write scan report')
  .action(async () => {
    const opts = program.opts<{ config?: string; json?: boolean; verbose?: boolean }>();
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    try {
      logger.info('scan:start');
      const config = loadConfig(opts.config ? { path: opts.config } : {});
      interface MinimalAdapter {
        id: string;
        detect(root: string): Promise<boolean>;
        files(globs: string[], ignore: string[]): Promise<string[]>;
        extract(files: string[], cfg: unknown): Promise<CandidateIR[]>;
      }
      const adapters: MinimalAdapter[] = [];
      if (config.frameworks.includes('react-next')) {
        let adapter: { default?: MinimalAdapter } | undefined;
        try {
          adapter = (await import('@voko/adapter-react-next')) as { default?: MinimalAdapter };
        } catch {
          try {
            // Dev fallback for monorepo smoke run
            const { resolve } = await import('node:path');
            const modPath = resolve(__dirname, '../../adapter-react-next/dist/index.cjs');
            adapter = (await import(modPath)) as { default?: MinimalAdapter };
          } catch {
            adapter = undefined;
          }
        }
        const impl = adapter?.default;
        if (impl) adapters.push(impl);
      }
      const candidates: CandidateIR[] = [];
      for (const a of adapters) {
        const ok = await a.detect(process.cwd());
        if (!ok) continue;
        const globs = config.globs[a.id] ?? [];
        let files: string[] = [];
        try {
          files = await a.files(globs, config.ignore ?? []);
        } catch (err) {
          logger.warn('scan:files:error', {
            adapter: a.id,
            message: err instanceof Error ? err.message : String(err),
          });
          continue;
        }
        const extracted = await a.extract(files, config);
        candidates.push(...extracted);
      }
      const manifest = readManifest();
      const { result, nextManifest } = reconcileManifest(
        candidates as unknown as CandidateIR[],
        manifest,
      );
      writeManifest(nextManifest);
      const summary = {
        created: result.created.length,
        updated: result.updated.length,
        orphaned: result.orphaned.length,
        skipped: 0,
      };
      const byNamespace: Record<
        string,
        { created: number; updated: number; orphaned: number; skipped: number }
      > = {};
      const inc = (ns: string, key: keyof typeof summary) => {
        byNamespace[ns] ??= { created: 0, updated: 0, orphaned: 0, skipped: 0 };
        (byNamespace[ns][key] as number) += 1;
      };
      for (const e of result.created) inc(e.namespace, 'created');
      for (const e of result.updated) inc(e.entry.namespace, 'updated');
      for (const e of result.orphaned) inc(e.namespace, 'orphaned');
      writeScanReport({ summary, byNamespace, notes: [] });
      logger.info('scan:done', summary);
      process.exit(0);
    } catch (err) {
      if (err instanceof ConfigError) {
        logger.error('scan:config', { code: err.code, message: err.message });
        process.exit(4);
      }
      logger.error('scan:error', { message: err instanceof Error ? err.message : String(err) });
      process.exit(3);
    }
  });

program.parseAsync(process.argv);
