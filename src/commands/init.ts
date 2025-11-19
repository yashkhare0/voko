import { Command } from 'commander';
import { input, select, checkbox } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { saveConfig, Config } from '../utils/config';
import { logger } from '../utils/logger';

export const initCommand = new Command('init')
  .description('Initialize voko configuration')
  .option('--base-file <path>', 'Path to base language file')
  .option('--base-lang <code>', 'Base language code')
  .option('--languages <list>', 'Comma-separated list of target languages')
  .option('--engine <engine>', 'Translation engine (google, deepl, libre, yandex)')
  .option('--api-key-env <name>', 'Environment variable name for API key')
  .action(async (options) => {
    logger.info("Welcome to voko! Let's set up your i18n configuration.");

    let baseFile = options.baseFile;
    if (!baseFile) {
      baseFile = await input({
        message: 'Path to your base language file (e.g., src/locales/en.json):',
        default: 'src/locales/en.json',
        validate: (value: string) => {
          if (!value.endsWith('.json')) return 'File must be a JSON file.';
          return true;
        },
      });
    }

    // Ensure directory exists
    const baseDir = path.dirname(path.resolve(process.cwd(), baseFile));
    await fs.ensureDir(baseDir);

    // Check if file exists, if not create it with empty object
    if (!(await fs.pathExists(path.resolve(process.cwd(), baseFile)))) {
      await fs.writeJson(path.resolve(process.cwd(), baseFile), {});
      logger.info(`Created base file at ${baseFile}`);
    }

    let baseLanguage = options.baseLang;
    if (!baseLanguage) {
      baseLanguage = await input({
        message: 'What is your base language code?',
        default: 'en',
      });
    }

    let selectedLanguages: string[] = [];
    if (options.languages) {
      selectedLanguages = options.languages.split(',').map((l: string) => l.trim());
    } else {
      const regions = {
        Europe: ['es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'pl'],
        Asia: ['zh', 'ja', 'ko', 'hi', 'ar', 'tr', 'vi', 'th'],
        Americas: ['es-MX', 'pt-BR', 'fr-CA'],
      };

      // Flatten common languages for individual selection if needed, or just offer a curated list
      // For simplicity/robustness, let's offer a multi-select of common languages + custom input
      const commonLanguages = [...regions.Europe, ...regions.Asia, ...regions.Americas].sort();

      selectedLanguages = await checkbox({
        message: 'Select target languages:',
        choices: commonLanguages.map((lang) => ({ name: lang, value: lang })),
      });
    }

    let engine = options.engine;
    if (!engine) {
      engine = await select({
        message: 'Select translation engine:',
        choices: [
          { name: 'Google Translate', value: 'google' },
          { name: 'DeepL', value: 'deepl' },
          { name: 'LibreTranslate', value: 'libre' },
          { name: 'Yandex', value: 'yandex' },
        ],
      });
    }

    let apiKeyEnvVar = options.apiKeyEnv;
    if (!apiKeyEnvVar && engine !== 'google') {
      // Google might not need key if using free tier via some libs, but usually does.
      // Actually the 'translate' package uses free google by default without key, but others need key.
      // Let's ask for key env var for all except google if user wants to rely on free google.
      // Wait, the user requirement said "Flexible package that allows you to use Google (default)..."
      // and "translate.key = process.env.DEEPL_KEY".
      // So we should ask for the ENV VAR NAME.
      apiKeyEnvVar = await input({
        message: `Enter the environment variable name for your ${engine} API key (e.g. ${engine.toUpperCase()}_KEY):`,
        default: `${engine.toUpperCase()}_KEY`,
      });
    }

    const config: Config = {
      baseLanguage,
      baseFile,
      languages: selectedLanguages,
      engine: engine as Config['engine'],
      apiKeyEnvVar,
    };

    await saveConfig(config);
    logger.success('Configuration saved to voko.config.json');

    // Create empty locale files for selected languages if they don't exist
    for (const lang of selectedLanguages) {
      const langFile = path.join(baseDir, `${lang}.json`);
      if (!(await fs.pathExists(langFile))) {
        await fs.writeJson(langFile, {});
        logger.info(`Created ${lang}.json`);
      }
    }
  });
