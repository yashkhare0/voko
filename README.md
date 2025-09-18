# Voko

Automated i18n assistant for your app. Voko scans code to find user-facing strings, generates locale JSON files with deterministic namespaces, and can optionally rewrite code to use translation calls. It is idempotent across runs via a manifest and quarantine flow.

Supported today: React/Next.js (with next-intl). Vue/Nuxt is planned.

---

## Requirements

- Node 18+

---

## Quick Start

Install in your application repo (not this repository):

````bash
npm i -D @voko/cli
npx voko init
npx voko scan
npx voko extract
npx voko inject --dry-run   # inspect diffs
npx voko inject --no-dry-run   # apply changes
Recommended PR check:

```bash
npx voko scan && npx voko extract && npx voko check
````

---

## Configuration

Create `voko.config.json` in your repo root:

```json
{
  "$schema": "https://voko.dev/schema/v1.json",
  "frameworks": ["react-next"],
  "library": { "react-next": "next-intl" },
  "defaultLocale": "en",
  "locales": ["en", "de"],
  "globs": {
    "react-next": ["app/**/*.{ts,tsx}", "pages/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"]
  },
  "ignore": ["**/__tests__/**", "**/*.stories.*", "node_modules/**"],
  "namespaceStrategy": { "react-next": "route" },
  "attributes": ["alt", "title", "aria-label", "placeholder"],
  "rewrite": { "enabled": false, "rich": true, "keepFormatting": true },
  "quarantineDays": 14
}
```

Field reference (high level):

- `frameworks`: which adapters to use. For Next.js use `react-next`.
- `library`: adapter → i18n library (Next: `next-intl`).
- `defaultLocale`, `locales`: locales your app supports.
- `globs[adapterId]`: where to scan for files.
- `ignore`: glob patterns to skip.
- `namespaceStrategy`: determines namespace derivation (`route` for Next).
- `attributes`: which attributes to extract (`alt`, `title`, etc.).
- `rewrite`: control auto-injection; `rich` enables rich placeholders.
- `quarantineDays`: retention period for orphaned keys in trash.

---

## Namespacing (Next.js)

Namespaces are derived from routes and are deterministic:

- App Router: `app/(marketing)/about/page.tsx` → `marketing.about`
- Dynamic segments: `[slug]` → `.slug` (e.g., `blog.[slug].details`)
- Pages Router: `pages/about.tsx` → `about`

Keys are structural, never content-derived. Prefer:

```text
hero.title
hero.body.0..N
section1.title
section1.body.i
values.item.i
```

---

## Rich Text Rules

Inline allowlist: `strong,b,em,i,u,code,a,span`.

- If inline tags appear inside a block, Voko collapses them into placeholders and uses a single rich call.

Example:

```tsx
// Before
<p>
  We <strong>care</strong> about users.
</p>;

// After (client component)
{
  t.rich('hero.body.0', { strong: (c) => <strong>{c}</strong> });
}
```

---

## Client vs Server (Next.js)

- Injection only happens in client components (files that start with `"use client"`).
- Server components are extract-only. Voko suggests:

```ts
import { getTranslator } from 'next-intl/server';
const t = await getTranslator(locale, '<namespace>');
```

---

## CLI Reference

- `voko init`
  - Scaffolds `voko.config.json`, `.voko/manifest.json`, `.voko/trash/`, `reports/`.
  - Flags: `--force` overwrite existing config; `--no-install` skip i18n lib install (default installs, e.g., `next-intl`).

- `voko scan`
  - Loads adapters, parses files, emits candidates, reconciles with manifest.
  - Output: updates `.voko/manifest.json` timestamps and writes `reports/voko-scan-*.json`.

- `voko extract`
  - Writes/merges locale JSON files with stable ordering. Non-default locales receive `""` for new keys.

- `voko inject [--dry-run]`
  - Adds `import { useTranslations } from 'next-intl'` and declares `const t = useTranslations('<ns>')` in client files.
  - Replacement of nodes is limited in this release; review diffs with `--dry-run`.
  - Default is `--dry-run` (prints unified diffs). Use `--no-dry-run` to apply.

- `voko sync`
  - Reconciles manifest ↔ code ↔ locales after manual edits/merges; does not inject.

- `voko gc [--age 14d]`
  - Deletes `.voko/trash/*.json` older than the threshold.

- `voko check`
  - CI gate: fails if raw strings were introduced (created candidates present).

Exit codes are documented in the PRD. Typical outcomes: `0` success; non-zero for parse, schema, write, or CI violations.

---

## Working Files & Outputs

- `voko.config.json`: your configuration (commit to your repo).
- `.voko/manifest.json`: idempotency ledger of extracted/rewritten items.
- `.voko/trash/`: quarantined orphaned keys.
- `reports/voko-scan-*.json`: scan summaries by namespace.
- `locales/<locale>/<namespace>.json`: generated/merged locale files.

Locale rules:

- Keys sorted lexicographically, trailing newline enforced.
- New keys in non-default locales are added with empty string values.

---

## Best Practices

- Run `scan → extract` on every PR; block merges with `check` when violations are present.
- Use hints in code to guide Voko:
  - `/* voko:key=story.title */` applies to the next node.
  - `/* voko:ignore */` skips the next node.
  - `<p data-voko="story.body.1">...</p>` overrides key path.
- Limit injection to client components; leave server components as extract-only.
- Keep your route structure stable to maintain deterministic namespaces.

---

## Examples

Locale file (`en/marketing.about.json`):

```json
{
  "hero": {
    "title": "About Us",
    "body": {
      "0": "We build delightful tools for humans."
    }
  },
  "story": {
    "title": "Our Story",
    "body": {
      "0": "Started in 2023.",
      "1": "Backed by caffeine."
    }
  }
}
```

Using next-intl (client component):

```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('marketing.about');
  return (
    <>
      <h1>{t('hero.title')}</h1>
      {t.rich('hero.body.0', { strong: (c) => <strong>{c}</strong> })}
    </>
  );
}
```

More patterns:

- Attribute extraction and usage:

```tsx
<img alt="Profile picture" />
// becomes
<img alt={t('profile.image.alt')} />
```

- Rich text with placeholders:

```tsx
<p>
  We <strong>love</strong> clean diffs.
</p>;
// becomes (client)
{
  t.rich('about.body.0', { strong: (c) => <strong>{c}</strong> });
}
```

- Server suggestion:

```ts
import { getTranslator } from 'next-intl/server';
const t = await getTranslator(locale, 'marketing.about');
```

---

## CI Integration

Add a job to enforce i18n hygiene:

```yaml
name: voko-check
on: [pull_request]
jobs:
  i18n:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci
      - run: npx voko scan && npx voko extract && npx voko check
```

---

## Troubleshooting

- Voko changed too many lines: run with `--dry-run` first; adjust `ignore` globs or add `/* voko:ignore */` hints.
- Namespaces look odd: verify your route structure and `namespaceStrategy`.
- Server files not rewritten: expected; use the server suggestion pattern.
- Mixed frameworks: set `frameworks` and `globs` per adapter and re-run.

- Adapter not detected (React/Next): ensure you run from the app repo root, that `frameworks` includes `"react-next"`, and that your project has `app/` or `pages/` (or `next.config.*`).
- No diffs from `inject --dry-run`: injection only applies to client components; add `"use client"` at the top of the file. Also confirm `scan` finds candidates for that namespace.
- Config validation failed: run `voko init` to scaffold a valid `voko.config.json`. On schema errors, the error message includes the path; compare your file with the example in this README.
- Globs seem ignored: use forward slashes in globs (even on Windows) and ensure patterns are under your repo root. Example: `"app/**/*.{ts,tsx}"`.
- Scan report missing: `scan` writes to `reports/`; check write permissions and that the directory exists (created by `init`).
- CI `check` fails: it means new raw strings were introduced. Run `voko scan && voko extract` locally, commit updated locale files, and re-run.

---

## License

ISC
