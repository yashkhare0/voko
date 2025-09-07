import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/*.d.ts",
      "eslint.config.mjs",
      "**/vitest.config.ts",
      "**/tsup.config.ts",
      "commitlint.config.cjs"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {},
    rules: {
      "no-console": "off"
    }
  },
  eslintConfigPrettier
);


