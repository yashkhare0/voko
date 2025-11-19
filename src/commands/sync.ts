import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import translate from 'translate';
import { loadConfig } from '../utils/config';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

export const syncCommand = new Command('sync')
  .description('Sync and translate locale files')
  .option('--strict', 'Remove keys that are not present in the base file')
  .action(async (options) => {
    const config = await loadConfig();
    if (!config) {
      logger.error('Config file not found. Run "voko init" first.');
      return;
    }

    const { baseFile, languages, engine, apiKeyEnvVar, baseLanguage } = config;
    const baseFilePath = path.resolve(process.cwd(), baseFile);

    if (!(await fs.pathExists(baseFilePath))) {
      logger.error(`Base file not found at ${baseFilePath}`);
      return;
    }

    const baseContent = await fs.readJson(baseFilePath);
    const baseDir = path.dirname(baseFilePath);

    // Configure translate
    translate.engine = engine;
    if (apiKeyEnvVar && process.env[apiKeyEnvVar]) {
      translate.key = process.env[apiKeyEnvVar];
    } else if (engine !== 'google') {
      logger.warn(`Warning: API key environment variable ${apiKeyEnvVar} is missing or empty.`);
    }

    for (const lang of languages) {
      const spinner = ora(`Syncing ${lang}...`).start();
      const langFilePath = path.join(baseDir, `${lang}.json`);

      let langContent = {};
      if (await fs.pathExists(langFilePath)) {
        langContent = await fs.readJson(langFilePath);
      }

      const newContent = { ...langContent };
      let addedCount = 0;
      let removedCount = 0;

      // Add missing keys
      const syncKeys = async (
        baseObj: Record<string, unknown>,
        targetObj: Record<string, unknown>,
        prefix = '',
      ) => {
        for (const key in baseObj) {
          const currentKey = prefix ? `${prefix}.${key}` : key;
          if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
            if (!targetObj[key] || typeof targetObj[key] !== 'object') {
              targetObj[key] = {} as Record<string, unknown>;
            }
            await syncKeys(
              baseObj[key] as Record<string, unknown>,
              targetObj[key] as Record<string, unknown>,
              currentKey,
            );
          } else {
            if (!targetObj[key]) {
              try {
                const translated = await translate(String(baseObj[key]), {
                  from: baseLanguage,
                  to: lang,
                });
                targetObj[key] = translated;
                addedCount++;
              } catch (error) {
                spinner.fail(`Failed to translate key: ${currentKey}`);
                console.error(error);
              }
            }
          }
        }
      };

      await syncKeys(baseContent, newContent);

      // Strict mode: remove extra keys
      if (options.strict) {
        const removeExtraKeys = (
          baseObj: Record<string, unknown>,
          targetObj: Record<string, unknown>,
        ) => {
          for (const key in targetObj) {
            if (!(key in baseObj)) {
              delete targetObj[key];
              removedCount++;
            } else if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
              if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
                removeExtraKeys(
                  baseObj[key] as Record<string, unknown>,
                  targetObj[key] as Record<string, unknown>,
                );
              }
            }
          }
        };
        removeExtraKeys(baseContent as Record<string, unknown>, newContent);
      }

      await fs.writeJson(langFilePath, newContent, { spaces: 2 });
      spinner.succeed(
        `Synced ${lang}: +${addedCount} keys${options.strict ? `, -${removedCount} keys` : ''}`,
      );
    }
  });
