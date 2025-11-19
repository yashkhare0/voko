import fs from 'fs-extra';
import path from 'path';

/**
 * Validates that two JSON objects have the same structure (keys)
 * @param base The base object structure
 * @param target The target object to validate
 * @returns Object with validation result and missing/extra keys
 */
export function validateStructure(
  base: Record<string, unknown>,
  target: Record<string, unknown>,
): {
  isValid: boolean;
  missingKeys: string[];
  extraKeys: string[];
} {
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];

  function checkKeys(
    baseObj: Record<string, unknown>,
    targetObj: Record<string, unknown>,
    prefix = '',
  ) {
    // Check for missing keys
    for (const key in baseObj) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      if (!(key in targetObj)) {
        // If key is missing, mark it and all nested keys as missing
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          const nestedKeys = getAllKeys(baseObj[key] as Record<string, unknown>, currentKey);
          missingKeys.push(...nestedKeys);
        } else {
          missingKeys.push(currentKey);
        }
      } else if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
        if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
          checkKeys(
            baseObj[key] as Record<string, unknown>,
            targetObj[key] as Record<string, unknown>,
            currentKey,
          );
        }
      }
    }

    // Check for extra keys
    for (const key in targetObj) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      if (!(key in baseObj)) {
        extraKeys.push(currentKey);
      } else if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          checkKeys(
            baseObj[key] as Record<string, unknown>,
            targetObj[key] as Record<string, unknown>,
            currentKey,
          );
        }
      }
    }
  }

  checkKeys(base, target);

  return {
    isValid: missingKeys.length === 0 && extraKeys.length === 0,
    missingKeys,
    extraKeys,
  };
}

/**
 * Gets all keys from a nested object as dot-notation paths
 */
export function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key] as Record<string, unknown>, currentKey));
    } else {
      keys.push(currentKey);
    }
  }

  return keys;
}

/**
 * Merges missing keys from base into target
 */
export function mergeKeys(
  base: Record<string, unknown>,
  target: Record<string, unknown>,
  getValue: (key: string, value: unknown) => unknown,
): Record<string, unknown> {
  const result = { ...target };

  function merge(
    baseObj: Record<string, unknown>,
    targetObj: Record<string, unknown>,
    prefix = '',
  ) {
    for (const key in baseObj) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
        if (!targetObj[key] || typeof targetObj[key] !== 'object') {
          targetObj[key] = {} as Record<string, unknown>;
        }
        merge(
          baseObj[key] as Record<string, unknown>,
          targetObj[key] as Record<string, unknown>,
          currentKey,
        );
      } else {
        if (!targetObj[key]) {
          targetObj[key] = getValue(currentKey, baseObj[key]);
        }
      }
    }
  }

  merge(base, result);
  return result;
}

/**
 * Removes keys from target that don't exist in base
 */
export function removeExtraKeys(
  base: Record<string, unknown>,
  target: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  function remove(baseObj: Record<string, unknown>, targetObj: Record<string, unknown>) {
    for (const key in targetObj) {
      if (!(key in baseObj)) {
        delete targetObj[key];
      } else if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
        if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
          remove(
            baseObj[key] as Record<string, unknown>,
            targetObj[key] as Record<string, unknown>,
          );
        }
      }
    }
  }

  remove(base, result);
  return result;
}
