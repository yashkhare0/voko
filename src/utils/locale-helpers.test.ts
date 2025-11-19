import { validateStructure, getAllKeys, mergeKeys, removeExtraKeys } from './locale-helpers';

describe('Locale Helpers', () => {
  describe('validateStructure', () => {
    it('should validate identical structures', () => {
      const base = { hello: 'Hello', world: 'World' };
      const target = { hello: 'Hola', world: 'Mundo' };

      const result = validateStructure(base, target);

      expect(result.isValid).toBe(true);
      expect(result.missingKeys).toEqual([]);
      expect(result.extraKeys).toEqual([]);
    });

    it('should detect missing keys', () => {
      const base = { hello: 'Hello', world: 'World', goodbye: 'Goodbye' };
      const target = { hello: 'Hola' };

      const result = validateStructure(base, target);

      expect(result.isValid).toBe(false);
      expect(result.missingKeys).toContain('world');
      expect(result.missingKeys).toContain('goodbye');
    });

    it('should detect extra keys', () => {
      const base = { hello: 'Hello' };
      const target = { hello: 'Hola', extra: 'Extra', another: 'Another' };

      const result = validateStructure(base, target);

      expect(result.isValid).toBe(false);
      expect(result.extraKeys).toContain('extra');
      expect(result.extraKeys).toContain('another');
    });

    it('should handle nested objects', () => {
      const base = {
        menu: {
          file: 'File',
          edit: 'Edit',
        },
        toolbar: {
          save: 'Save',
        },
      };

      const target = {
        menu: {
          file: 'Archivo',
        },
      };

      const result = validateStructure(base, target);

      expect(result.isValid).toBe(false);
      expect(result.missingKeys).toContain('menu.edit');
      expect(result.missingKeys).toContain('toolbar.save');
    });

    it('should detect nested extra keys', () => {
      const base = {
        menu: {
          file: 'File',
        },
      };

      const target = {
        menu: {
          file: 'Archivo',
          extra: 'Extra',
        },
        other: 'Other',
      };

      const result = validateStructure(base, target);

      expect(result.isValid).toBe(false);
      expect(result.extraKeys).toContain('menu.extra');
      expect(result.extraKeys).toContain('other');
    });

    it('should handle deeply nested structures', () => {
      const base = {
        a: {
          b: {
            c: {
              d: 'value',
            },
          },
        },
      };

      const target = {
        a: {
          b: {
            c: {
              d: 'translated',
            },
          },
        },
      };

      const result = validateStructure(base, target);

      expect(result.isValid).toBe(true);
    });
  });

  describe('getAllKeys', () => {
    it('should get all keys from flat object', () => {
      const obj = { a: '1', b: '2', c: '3' };
      const keys = getAllKeys(obj);

      expect(keys).toEqual(['a', 'b', 'c']);
    });

    it('should get all keys from nested object with dot notation', () => {
      const obj = {
        menu: {
          file: 'File',
          edit: 'Edit',
        },
        toolbar: {
          save: 'Save',
        },
      };

      const keys = getAllKeys(obj);

      expect(keys).toContain('menu.file');
      expect(keys).toContain('menu.edit');
      expect(keys).toContain('toolbar.save');
      expect(keys).toHaveLength(3);
    });

    it('should handle deeply nested objects', () => {
      const obj = {
        a: {
          b: {
            c: {
              d: 'value',
            },
          },
        },
      };

      const keys = getAllKeys(obj);

      expect(keys).toEqual(['a.b.c.d']);
    });
  });

  describe('mergeKeys', () => {
    it('should merge missing keys from base to target', () => {
      const base = { hello: 'Hello', world: 'World' };
      const target = { hello: 'Hola' };

      const result = mergeKeys(base, target, (key, value) => `translated_${value}`);

      expect(result).toEqual({
        hello: 'Hola',
        world: 'translated_World',
      });
    });

    it('should preserve existing values in target', () => {
      const base = { hello: 'Hello', world: 'World' };
      const target = { hello: 'Hola', world: 'Mundo' };

      const result = mergeKeys(base, target, (key, value) => `translated_${value}`);

      expect(result).toEqual({
        hello: 'Hola',
        world: 'Mundo',
      });
    });

    it('should merge nested objects', () => {
      const base = {
        menu: {
          file: 'File',
          edit: 'Edit',
        },
      };

      const target = {
        menu: {
          file: 'Archivo',
        },
      };

      const result = mergeKeys(base, target, (key, value) => `trans_${value}`);

      expect(result).toEqual({
        menu: {
          file: 'Archivo',
          edit: 'trans_Edit',
        },
      });
    });

    it('should create nested objects if missing', () => {
      const base = {
        menu: {
          file: 'File',
        },
      };

      const target = {};

      const result = mergeKeys(base, target, (key, value) => `trans_${value}`);

      expect(result).toEqual({
        menu: {
          file: 'trans_File',
        },
      });
    });
  });

  describe('removeExtraKeys', () => {
    it('should remove extra keys from target', () => {
      const base = { hello: 'Hello' };
      const target = { hello: 'Hola', extra: 'Extra', another: 'Another' };

      const result = removeExtraKeys(base, target);

      expect(result).toEqual({ hello: 'Hola' });
    });

    it('should preserve keys that exist in base', () => {
      const base = { hello: 'Hello', world: 'World' };
      const target = { hello: 'Hola', world: 'Mundo' };

      const result = removeExtraKeys(base, target);

      expect(result).toEqual({ hello: 'Hola', world: 'Mundo' });
    });

    it('should remove nested extra keys', () => {
      const base = {
        menu: {
          file: 'File',
        },
      };

      const target = {
        menu: {
          file: 'Archivo',
          extra: 'Extra',
        },
        other: 'Other',
      };

      const result = removeExtraKeys(base, target);

      expect(result).toEqual({
        menu: {
          file: 'Archivo',
        },
      });
    });

    it('should handle deeply nested structures', () => {
      const base = {
        a: {
          b: {
            c: 'value',
          },
        },
      };

      const target = {
        a: {
          b: {
            c: 'translated',
            d: 'extra',
          },
          e: 'extra',
        },
        f: 'extra',
      };

      const result = removeExtraKeys(base, target);

      expect(result).toEqual({
        a: {
          b: {
            c: 'translated',
          },
        },
      });
    });
  });
});
