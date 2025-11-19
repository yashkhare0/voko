import { loadConfig, saveConfig, Config } from './config';
import fs from 'fs-extra';
import path from 'path';

jest.mock('fs-extra');

describe('Config Utility', () => {
  const mockConfig: Config = {
    baseLanguage: 'en',
    baseFile: 'src/locales/en.json',
    languages: ['es', 'fr'],
    engine: 'google',
    apiKeyEnvVar: 'GOOGLE_KEY',
  };

  const configPath = path.resolve(process.cwd(), 'voko.config.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save config to file', async () => {
    await saveConfig(mockConfig);
    expect(fs.writeJson).toHaveBeenCalledWith(configPath, mockConfig, { spaces: 2 });
  });

  it('should load config from file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.readJson as jest.Mock).mockResolvedValue(mockConfig);

    const config = await loadConfig();
    expect(config).toEqual(mockConfig);
    expect(fs.readJson).toHaveBeenCalledWith(configPath);
  });

  it('should return null if config file does not exist', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);

    const config = await loadConfig();
    expect(config).toBeNull();
  });
});
