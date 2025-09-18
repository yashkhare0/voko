import { Command } from 'commander';
import { ConfigError } from '@voko/core';
import { getConfig, getLogger, type GlobalFlags } from './commands/_shared';

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
    const flags = program.opts<GlobalFlags>();
    const logger = getLogger(flags);
    try {
      logger.info('scan:start');
      const config = getConfig(flags);
      logger.debug('scan:config:loaded', { frameworks: config.frameworks });
      // Subsequent subcommands implemented in VKO-CLI-003
      logger.info('scan:noop');
      return;
    } catch (err) {
      if (err instanceof ConfigError) {
        logger.error('scan:config:error', { code: err.code, message: err.message });
        process.exitCode = 4;
        return;
      }
      logger.error('scan:error', { message: err instanceof Error ? err.message : String(err) });
      process.exitCode = 3;
      return;
    }
  });

program.parseAsync(process.argv);
