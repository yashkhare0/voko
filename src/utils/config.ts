import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';

const CONFIG_FILE_NAME = 'voko.config.json';

export const ConfigSchema = z.object({
  baseLanguage: z.string(),
  baseFile: z.string(),
  languages: z.array(z.string()),
  engine: z.enum(['google', 'deepl', 'libre', 'yandex', 'ai', 'azure']),
  apiKeyEnvVar: z.string().optional(),
  aiModel: z.string().optional(),
  aiApiKey: z.string().optional(),
  aiEndpoint: z.string().optional(),
  azureEndpoint: z.string().optional(),
  azureApiKey: z.string().optional(),
  exportType: z.enum(['ts', 'js', 'none']).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(): Promise<Config | null> {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE_NAME);
  if (!(await fs.pathExists(configPath))) {
    return null;
  }
  const content = await fs.readJson(configPath);
  return ConfigSchema.parse(content);
}

export async function saveConfig(config: Config): Promise<void> {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE_NAME);
  await fs.writeJson(configPath, config, { spaces: 2 });
}
