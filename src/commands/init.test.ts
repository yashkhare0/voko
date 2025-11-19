import { initCommand } from './init';
import fs from 'fs-extra';
import { saveConfig } from '../utils/config';
import { input, select, checkbox } from '@inquirer/prompts';

jest.mock('fs-extra');
jest.mock('../utils/config');
jest.mock('@inquirer/prompts');

describe('Init Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeJson as jest.Mock).mockResolvedValue(undefined);
  });

  describe('CLI Flags', () => {
    it('should create config from CLI flags', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es,fr',
        '--engine',
        'google',
      ]);

      expect(saveConfig).toHaveBeenCalledWith({
        baseLanguage: 'en',
        baseFile: 'locales/en.json',
        languages: ['es', 'fr'],
        engine: 'google',
        apiKeyEnvVar: undefined,
      });
    });

    it('should trim language codes from comma-separated list', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        ' es , fr , de ',
        '--engine',
        'google',
      ]);

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          languages: ['es', 'fr', 'de'],
        }),
      );
    });

    it('should handle API key environment variable', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'deepl',
        '--api-key-env',
        'DEEPL_KEY',
      ]);

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          engine: 'deepl',
          apiKeyEnvVar: 'DEEPL_KEY',
        }),
      );
    });
  });

  describe('File Creation', () => {
    it('should create base file if it does not exist', async () => {
      (fs.pathExists as jest.Mock).mockResolvedValue(false);

      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'google',
      ]);

      expect(fs.writeJson).toHaveBeenCalledWith(expect.stringContaining('en.json'), {});
    });

    it('should not overwrite existing base file', async () => {
      (fs.pathExists as jest.Mock).mockResolvedValue(true);

      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'google',
      ]);

      // Base file exists, so should only create target language files
      expect(fs.writeJson).toHaveBeenCalledTimes(1); // Only es.json
    });

    it('should create target language files', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es,fr,de',
        '--engine',
        'google',
      ]);

      expect(fs.writeJson).toHaveBeenCalledWith(expect.stringContaining('es.json'), {});
      expect(fs.writeJson).toHaveBeenCalledWith(expect.stringContaining('fr.json'), {});
      expect(fs.writeJson).toHaveBeenCalledWith(expect.stringContaining('de.json'), {});
    });

    it('should ensure directory exists before creating files', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/nested/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'google',
      ]);

      expect(fs.ensureDir).toHaveBeenCalled();
    });

    it('should skip creating language files that already exist', async () => {
      (fs.pathExists as jest.Mock).mockImplementation((path: string) => {
        return Promise.resolve(path.includes('es.json'));
      });

      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es,fr',
        '--engine',
        'google',
      ]);

      // Should only create fr.json since es.json exists
      expect(fs.writeJson).toHaveBeenCalledWith(expect.stringContaining('en.json'), {});
      expect(fs.writeJson).toHaveBeenCalledWith(expect.stringContaining('fr.json'), {});
      expect(fs.writeJson).not.toHaveBeenCalledWith(expect.stringContaining('es.json'), {});
    });
  });

  describe('Interactive Mode', () => {
    it('should use prompts when flags are not provided', async () => {
      (input as jest.Mock)
        .mockResolvedValueOnce('locales/en.json')
        .mockResolvedValueOnce('en')
        .mockResolvedValueOnce('GOOGLE_KEY');

      (checkbox as jest.Mock).mockResolvedValue(['es', 'fr']);
      (select as jest.Mock).mockResolvedValue('google');

      await initCommand.parseAsync(['node', 'test', 'init']);

      expect(input).toHaveBeenCalled();
      expect(checkbox).toHaveBeenCalled();
      expect(select).toHaveBeenCalled();
    });

    it('should use flag values when provided, skip prompts', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'google',
      ]);

      expect(input).not.toHaveBeenCalled();
      expect(checkbox).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate JSON file extension in interactive mode', async () => {
      const mockInput = input as jest.Mock;
      let validatorFn: ((value: string) => boolean | string) | undefined;

      mockInput.mockImplementation((options: { validate?: (v: string) => boolean | string }) => {
        validatorFn = options.validate;
        return Promise.resolve('locales/en.json');
      });

      (checkbox as jest.Mock).mockResolvedValue(['es']);
      (select as jest.Mock).mockResolvedValue('google');

      await initCommand.parseAsync(['node', 'test', 'init']);

      expect(validatorFn).toBeDefined();
      if (validatorFn) {
        expect(validatorFn('test.json')).toBe(true);
        expect(validatorFn('test.txt')).toBe('File must be a JSON file.');
      }
    });
  });

  describe('Engine-specific Configuration', () => {
    it('should skip API key prompt for Google engine', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'google',
      ]);

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKeyEnvVar: undefined,
        }),
      );
    });

    it('should accept API key env var for non-Google engines', async () => {
      await initCommand.parseAsync([
        'node',
        'test',
        'init',
        '--base-file',
        'locales/en.json',
        '--base-lang',
        'en',
        '--languages',
        'es',
        '--engine',
        'deepl',
        '--api-key-env',
        'DEEPL_KEY',
      ]);

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKeyEnvVar: 'DEEPL_KEY',
        }),
      );
    });
  });
});
