# @voko/adapter-react-next

React/Next.js adapter for Voko. Detects Next projects, lists files, derives namespaces, classifies client/server components, extracts translatable text (blocks, attrs, rich), and plans rewrites for client components using next-intl.

## What it does

- Detects Next.js projects (files/folders/deps)
- Lists target files per config globs (honors ignore)
- Namespaces from routes (App & Pages Router)
- Component kind detection via `"use client"`
- Extraction:
  - Blocks: h1..h6, p, li, etc.
  - Attributes: alt, title, aria-label, placeholder, option value
  - Rich text: inline placeholders for strong/em/code/a/span
- Rewrite plan (client only):
  - Adds `import { useTranslations } from 'next-intl'`
  - Declares `const t = useTranslations('<ns>')`

## Usage

Used by `@voko/cli` during `scan`/`inject`.

```ts
import adapter from '@voko/adapter-react-next';
const ok = await adapter.detect(process.cwd());
if (ok) {
  const files = await adapter.files(globs, ignore);
  const candidates = await adapter.extract(files, config);
  const patches = await adapter.planRewrite(candidates, { dryRun: true });
}
```

See the root README for CLI usage and configuration.
