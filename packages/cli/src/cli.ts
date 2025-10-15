import { Command } from 'commander';
import {
  createLogger,
  loadConfig,
  readManifest,
  reconcileManifest,
  writeManifest,
  writeScanReport,
  ConfigError,
  ConfigSchema,
  writeFileStable,
  applyPatches,
  printUnifiedDiffs,
  mergeLocales,
  computeSync,
  moveOrphansToTrash,
  parseAge,
  gcTrash,
  type CandidateIR,
} from '@voko/core';
import { existsSync, mkdirSync } from 'node:fs';

const program = new Command();

program
  .name('voko')
  .description('Automated i18n assistant for your app')
  .option('--config <path>', 'path to voko.config.json')
  .option('--json', 'machine-readable logs', false)
  .option('--verbose', 'verbose logging', false);

program
  .command('init')
  .description('Scaffold voko.config.json, .voko/, and reports/')
  .option('--force', 'overwrite existing config', false)
  .option('--no-install', 'skip installing i18n libraries for configured frameworks')
  .action(async (_args, cmd) => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    try {
      logger.info('init:start');
      const { force, install } = cmd.opts() as { force?: boolean; install?: boolean };

      // 1) Write voko.config.json (skip if exists unless --force)
      const configPath = 'voko.config.json';
      const shouldWriteConfig = Boolean(force) || !existsSync(configPath);
      if (shouldWriteConfig) {
        const defaults = ConfigSchema.parse({});
        const sample = {
          $schema: 'https://voko.dev/schema/v1.json',
          ...defaults,
          // Provide a helpful starter with a second locale present
          locales: ['en', 'de'],
        } as const;
        const content = JSON.stringify(sample, null, 2) + '\n';
        const { wrote } = writeFileStable(configPath, content);
        logger.info('init:config', { path: configPath, wrote });
      } else {
        logger.info('init:config:exists', { path: configPath });
      }

      // 2) Ensure working directories
      mkdirSync('.voko/trash', { recursive: true });
      mkdirSync('reports', { recursive: true });

      // 3) Ensure manifest exists (stable write)
      writeManifest({ version: 1, entries: [] });

      // 4) Optionally install i18n library for configured framework(s)
      if (install) {
        try {
          const fs = await import('node:fs');
          const path = await import('node:path');
          // Read project's package.json
          const pkgPath = path.resolve(process.cwd(), 'package.json');
          const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
          };
          // Load config to get library mapping
          const cfg = loadConfig(opts.config ? { path: opts.config } : {});
          const libs = new Set<string>();
          for (const fw of cfg.frameworks) {
            const lib = cfg.library[fw];
            if (lib) libs.add(lib);
          }
          const missing = Array.from(libs).filter(
            (lib) => !(pkgJson.dependencies?.[lib] || pkgJson.devDependencies?.[lib]),
          );
          if (missing.length > 0) {
            // Detect package manager
            const hasPnpm = fs.existsSync(path.resolve(process.cwd(), 'pnpm-lock.yaml'));
            const hasYarn = fs.existsSync(path.resolve(process.cwd(), 'yarn.lock'));
            const mgr = hasPnpm ? 'pnpm' : hasYarn ? 'yarn' : 'npm';
            const { spawnSync } = await import('node:child_process');
            let args: string[] = [];
            if (mgr === 'pnpm') args = ['add', ...missing];
            else if (mgr === 'yarn') args = ['add', ...missing];
            else args = ['i', ...missing];
            logger.info('init:install', { manager: mgr, packages: missing });
            const res = spawnSync(mgr, args, { stdio: 'inherit' });
            if (res.status !== 0) {
              logger.warn('init:install:failed', { status: res.status });
            }
          } else {
            logger.info('init:install:ok', { packages: [] });
          }
        } catch (err) {
          logger.warn('init:install:error', {
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }

      logger.info('init:done');
      process.exit(0);
    } catch (err) {
      const anyErr = err as { code?: string; message?: string } | undefined;
      const isPerm = anyErr && (anyErr.code === 'EACCES' || anyErr.code === 'EPERM');
      const exit = isPerm ? 2 : 1;
      logger.error('init:error', { code: anyErr?.code, message: anyErr?.message });
      process.exit(exit);
    }
  });

program
  .command('sync')
  .description('Reconcile manifest ↔ code ↔ locales and quarantine orphans')
  .action(async () => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    try {
      logger.info('sync:start');
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
        const files = await a.files(globs, config.ignore ?? []);
        const extracted = await a.extract(files, config);
        candidates.push(...extracted);
      }
      const manifest = readManifest();
      const { result, nextManifest } = reconcileManifest(
        candidates as unknown as CandidateIR[],
        manifest,
      );
      writeManifest(nextManifest);
      const syncRes = computeSync(manifest, result);
      writeManifest(syncRes.nextManifest);
      const touched = moveOrphansToTrash(syncRes.nextManifest.entries);
      logger.info('sync:done', { quarantinedFiles: touched.length });
      process.exit(0);
    } catch (err) {
      logger.error('sync:error', { message: err instanceof Error ? err.message : String(err) });
      process.exit(0);
    }
  });

program
  .command('gc')
  .description('Garbage-collect quarantined files older than a threshold')
  .option('--age <window>', 'Age window like 14d or 2w', '14d')
  .action(async (_args, cmd) => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    try {
      logger.info('gc:start');
      const { age } = cmd.opts() as { age?: string };
      const days = parseAge(age ?? '14d');
      if (!days) {
        logger.error('gc:age:invalid', { age });
        process.exit(8);
        return;
      }
      const removed = gcTrash(days);
      logger.info('gc:done', { removed: removed.length });
      process.exit(0);
    } catch (err) {
      logger.error('gc:error', { message: err instanceof Error ? err.message : String(err) });
      process.exit(0);
    }
  });

program
  .command('check')
  .description('CI gate: fail when created raw strings are present')
  .action(async () => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    try {
      logger.info('check:start');
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
        const files = await a.files(globs, config.ignore ?? []);
        const extracted = await a.extract(files, config);
        candidates.push(...extracted);
      }

      const manifest = readManifest();
      const { result } = reconcileManifest(candidates as unknown as CandidateIR[], manifest);
      const { runCheck } = await import('@voko/core');
      const checkRes = runCheck(result);
      if (checkRes.violations.length > 0) {
        logger.error('check:violations', { violations: checkRes.violations });
        process.exit(9);
      }
      logger.info('check:ok');
      process.exit(0);
    } catch (err) {
      logger.error('check:error', { message: err instanceof Error ? err.message : String(err) });
      process.exit(9);
    }
  });

program
  .command('scan')
  .description('Run adapters, reconcile with manifest, and write scan report')
  .action(async () => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
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

program
  .command('extract')
  .description('Write/merge locale JSON files based on last scan')
  .action(async () => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    try {
      logger.info('extract:start');
      const config = loadConfig(opts.config ? { path: opts.config } : {});
      // Re-run a minimal scan path to compute reconcile results
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
        const files = await a.files(globs, config.ignore ?? []);
        const extracted = await a.extract(files, config);
        candidates.push(...extracted);
      }

      const manifest = readManifest();
      const { result } = reconcileManifest(candidates as unknown as CandidateIR[], manifest);

      // Merge into locale files
      const summary = mergeLocales(candidates as unknown as CandidateIR[], config, result);
      logger.info('extract:done', summary as unknown as Record<string, unknown>);
      process.exit(0);
    } catch (err) {
      logger.error('extract:error', { message: err instanceof Error ? err.message : String(err) });
      process.exit(5);
    }
  });

program
  .command('inject')
  .description('Apply codemods to replace literals with translation calls')
  .option('--dry-run', 'print diffs without writing', true)
  .action(async (_args, cmd) => {
    const opts = program.opts() as { config?: string; json?: boolean; verbose?: boolean };
    const logger = createLogger({
      level: opts.verbose ? 'debug' : 'info',
      json: Boolean(opts.json),
    });
    const { dryRun } = cmd.opts() as { dryRun?: boolean };
    try {
      logger.info('inject:start');
      const config = loadConfig(opts.config ? { path: opts.config } : {});
      interface MinimalAdapter {
        id: string;
        detect(root: string): Promise<boolean>;
        files(globs: string[], ignore: string[]): Promise<string[]>;
        extract(files: string[], cfg: unknown): Promise<CandidateIR[]>;
        planRewrite(
          candidates: CandidateIR[],
          opts: { dryRun: boolean },
        ): Promise<import('@voko/core').Patch[]>;
      }
      const adapters: MinimalAdapter[] = [];
      if (config.frameworks.includes('react-next')) {
        let adapter: { default?: MinimalAdapter } | undefined;
        try {
          adapter = (await import('@voko/adapter-react-next')) as { default?: MinimalAdapter };
        } catch {
          try {
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
        const files = await a.files(globs, config.ignore ?? []);
        const extracted = await a.extract(files, config);
        candidates.push(...extracted);
      }

      // Build patches via adapters
      const patches = (
        await Promise.all(
          adapters.map((a) => a.planRewrite(candidates, { dryRun: Boolean(dryRun) })),
        )
      ).flat();

      // Build final plan (imports merged and inserted)
      const plan = (await import('@voko/core')).buildInjectionPlan(patches);

      const result = applyPatches(plan, { write: !dryRun });
      if (dryRun) {
        const diffs = printUnifiedDiffs(result.files);
        if (diffs) {
          console.log(diffs);
        }
      }

      if (result.conflicts.length > 0) {
        logger.error('inject:conflicts', { conflicts: result.conflicts });
        process.exit(6);
      }

      logger.info('inject:done', {
        files: result.files.length,
        wrote: result.files.filter((f) => f.wrote).length,
      });
      process.exit(0);
    } catch (err) {
      logger.error('inject:error', { message: err instanceof Error ? err.message : String(err) });
      process.exit(7);
    }
  });

program.parseAsync(process.argv);
