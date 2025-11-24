import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import translate from 'translate';
import { ChatOpenAI } from '@langchain/openai';
import axios from 'axios';
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

    const {
      baseFile,
      languages,
      engine,
      apiKeyEnvVar,
      baseLanguage,
      aiModel,
      aiApiKey,
      aiEndpoint,
      azureEndpoint,
      azureApiKey,
      azureRegion,
    } = config;
    const baseFilePath = path.resolve(process.cwd(), baseFile);

    if (!(await fs.pathExists(baseFilePath))) {
      logger.error(`Base file not found at ${baseFilePath}`);
      return;
    }

    const baseContent = await fs.readJson(baseFilePath);
    const baseDir = path.dirname(baseFilePath);

    // Configure translate
    if (engine !== 'ai' && engine !== 'azure') {
      translate.engine = engine as any;
    }
    if (apiKeyEnvVar && process.env[apiKeyEnvVar]) {
      translate.key = process.env[apiKeyEnvVar];
    } else if (engine !== 'google' && engine !== 'ai' && engine !== 'azure') {
      logger.warn(`Warning: API key environment variable ${apiKeyEnvVar} is missing or empty.`);
    }

    // Helper to get API key value (direct or from env)
    const getApiKey = (keyOrEnv: string | undefined) => {
      if (!keyOrEnv) return undefined;
      if (process.env[keyOrEnv]) return process.env[keyOrEnv];
      return keyOrEnv;
    };

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
                // Map language code to ISO 639-1 (2-letter code) if needed
                // e.g. fr-ca -> fr
                const targetLang = lang.split('-')[0];
                let translated = '';

                if (engine === 'ai') {
                  const apiKey = getApiKey(aiApiKey);
                  const llm = new ChatOpenAI({
                    model: aiModel,
                    apiKey,
                    configuration: {
                      baseURL: aiEndpoint,
                    },
                    temperature: 0,
                  });

                  const response = await llm.invoke(
                    `Translate the following text from ${baseLanguage} to ${targetLang}. Return ONLY the translated text, nothing else:\n\n${String(baseObj[key])}`,
                  );
                  translated = String(response.content).trim();
                } else if (engine === 'azure') {
                  const apiKey = getApiKey(azureApiKey);
                  // Azure expects region? Usually yes, but user didn't specify.
                  // We'll try standard endpoint structure.
                  const response = await axios.post(
                    `${azureEndpoint}/translate`,
                    [{ Text: String(baseObj[key]) }],
                    {
                      params: {
                        'api-version': '3.0',
                        from: baseLanguage,
                        to: targetLang,
                      },
                      headers: {
                        'Ocp-Apim-Subscription-Key': apiKey,
                        'Content-Type': 'application/json',
                        ...(azureRegion ? { 'Ocp-Apim-Subscription-Region': azureRegion } : {}),
                      },
                    },
                  );
                  if (
                    response.data &&
                    response.data[0] &&
                    response.data[0].translations &&
                    response.data[0].translations[0]
                  ) {
                    translated = response.data[0].translations[0].text;
                  } else {
                    throw new Error('Invalid response from Azure');
                  }
                } else {
                  translated = await translate(String(baseObj[key]), {
                    from: baseLanguage,
                    to: targetLang,
                  });
                }

                targetObj[key] = translated;
                addedCount++;
              } catch (error: any) {
                const errorMessage = error?.message || String(error);

                // Check for quota exceeded or rate limit errors
                if (
                  errorMessage.includes('quota') ||
                  errorMessage.includes('429') ||
                  errorMessage.includes('Too Many Requests')
                ) {
                  spinner.fail(`Translation API quota exceeded or rate limited.`);
                  logger.error(`Stopped at key: ${currentKey}`);
                  logger.error('Please check your API usage or try again later.');
                  process.exit(0); // Exit gracefully
                }

                spinner.fail(`Failed to translate key: ${currentKey}`);
                logger.error(`Error: ${errorMessage}`);
                // Continue with other keys instead of crashing, unless it's a critical error handled above
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

    // Generate index file if requested
    if (config.exportType && config.exportType !== 'none') {
      const indexSpinner = ora('Generating index file...').start();
      try {
        const exportType = config.exportType;
        const indexFile = path.join(baseDir, `index.${exportType}`);

        // Get all json files in the directory
        const files = await fs.readdir(baseDir);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        let content = '';
        const exports: string[] = [];

        for (const file of jsonFiles) {
          const langCode = path.basename(file, '.json').replace(/-/g, '_');
          content += `import ${langCode} from './${file}';\n`;
          exports.push(langCode);
        }

        content += `\nexport const locales = {\n  ${exports.join(',\n  ')}\n};\n`;

        if (exportType === 'ts') {
          content += `\nexport type Locale = keyof typeof locales;\n`;
        }

        await fs.writeFile(indexFile, content);
        indexSpinner.succeed(`Generated ${indexFile}`);
      } catch (error) {
        indexSpinner.fail('Failed to generate index file');
        console.error(error);
      }
    }
  });
