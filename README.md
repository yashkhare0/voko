# voko

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/yashkhare0/voko?utm_source=oss&utm_medium=github&utm_campaign=yashkhare0%2Fvoko&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

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
npx @yashkhare0/voko-cli init

# Install globally
npm install -g voko-cli

# Install as dev dependency
npm install -D voko-cli
pnpm add -D voko-cli
yarn add -D voko-cli
```

## Usage

### 1. Initialize Configuration

Run the `init` command to set up your project. This will create a `voko.config.json` file.

```bash
npx @yashkhare0/voko-cli init
```

You will be prompted for:

- **Base Language File**: The path to your source of truth (e.g., `src/locales/en.json`).
- **Base Language**: The language code of your base file (e.g., `en`).
- **Target Languages**: Select from a list of regions or choose specific languages.
- **Translation Engine**: Choose your preferred service (Google, DeepL, etc.).
- **API Key**: If required, provide the name of the environment variable storing your API key.

**Non-Interactive Mode (Flags):**

```bash
npx @yashkhare0/voko-cli init \
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
npx @yashkhare0/voko-cli sync
```

**Strict Mode:**

To remove keys from target files that are no longer in the base file:

```bash
npx @yashkhare0/voko-cli sync --strict
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

## Development

### Local Testing

To test the package locally before publishing:

```bash
npm link
cd /path/to/test/project
voko-cli init
```

### Running Tests

```bash
npm test
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

## Publishing

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and publishing to npm.

### Initial Setup

1. **Get an NPM Access Token**:
   - Go to [npmjs.com](https://www.npmjs.com/)
   - Navigate to Account Settings → Access Tokens
   - Generate a new "Automation" token

2. **Add Token to GitHub Secrets**:
   - Go to your repository settings
   - Navigate to Secrets and variables → Actions
   - Add a new secret named `NPM_TOKEN` with your token value

### How It Works

Versioning is fully automated based on commit messages:

- `feat:` commits → **minor** version bump (0.1.0 → 0.2.0)
- `fix:` commits → **patch** version bump (0.1.0 → 0.1.1)
- `BREAKING CHANGE:` in commit body → **major** version bump (0.1.0 → 1.0.0)

Example commits:

```bash
git commit -m "feat: add language presets for EU and Asia"
git commit -m "fix: correct translation API handling"
git commit -m "feat!: redesign config format

BREAKING CHANGE: config format has changed"
```

When you push to the `main` branch:

1. Tests and linting run automatically
2. If tests pass, semantic-release determines the new version
3. A GitHub release is created with changelog
4. The package is published to npm

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT
