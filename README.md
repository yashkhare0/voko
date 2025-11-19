# voko

**voko** is a powerful, interactive CLI tool for managing i18n (internationalization) in your JavaScript and TypeScript projects. It automates the setup, translation, and synchronization of locale files using popular translation engines.

## Features

- **Interactive Setup**: Easy-to-use wizard to configure your languages and preferences.
- **Multi-Engine Support**: Use Google Translate, DeepL, LibreTranslate, or Yandex.
- **Automatic Translation**: Automatically translates missing keys in your locale files.
- **Strict Sync**: Optionally remove keys that are no longer present in your base language file.
- **CI/CD Friendly**: Supports CLI flags for automated environments.
- **Framework Agnostic**: Works with any project structure (React, Vue, Node.js, etc.).

## Installation

You can use `voko` directly with `npx` or install it globally/locally.

```bash
# Run directly
npx voko init

# Install globally
npm install -g voko

# Install as dev dependency
npm install -D voko
pnpm add -D voko
yarn add -D voko
```

## Usage

### 1. Initialize Configuration

Run the `init` command to set up your project. This will create a `voko.config.json` file.

```bash
npx voko init
```

You will be prompted for:

- **Base Language File**: The path to your source of truth (e.g., `src/locales/en.json`).
- **Base Language**: The language code of your base file (e.g., `en`).
- **Target Languages**: Select from a list of regions or choose specific languages.
- **Translation Engine**: Choose your preferred service (Google, DeepL, etc.).
- **API Key**: If required, provide the name of the environment variable storing your API key.

**Non-Interactive Mode (Flags):**

```bash
npx voko init \
  --base-file src/locales/en.json \
  --base-lang en \
  --languages es,fr,de \
  --engine deepl \
  --api-key-env DEEPL_API_KEY
```

### 2. Sync Translations

Run the `sync` command to update your locale files. This will:

1.  Read your base language file.
2.  Find missing keys in your target language files.
3.  Translate the missing values.
4.  Write the updates to the files.

```bash
npx voko sync
```

**Strict Mode:**

To remove keys from target files that are no longer in the base file:

```bash
npx voko sync --strict
```

## Configuration

Your configuration is stored in `voko.config.json`:

```json
{
  "baseLanguage": "en",
  "baseFile": "src/locales/en.json",
  "languages": ["es", "fr"],
  "engine": "deepl",
  "apiKeyEnvVar": "DEEPL_KEY"
}
```

## Environment Variables

If you are using an engine that requires an API key (DeepL, Yandex, etc.), make sure the environment variable you specified in the config is set in your environment or a `.env` file.

```bash
# .env
DEEPL_KEY=your-api-key-here
```

## License

MIT
