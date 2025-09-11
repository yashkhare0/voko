# Voko — Product Requirement Document

TypeScript, multi-framework i18n bootstrapper with adapters, CLI, CI, versioning, and Husky.

---

## 0. Executive Summary

**What Voko does**

- Scans your repo to find user-facing strings.
- Generates and maintains locale JSON files using deterministic namespaces.
- Optionally rewrites code to use translation calls (`t()`, `t.rich()`).
- Remains idempotent across reruns via a manifest and quarantine flow.
- Ships as a monorepo with a clean, pluggable **adapter** system (Next now, Vue later).
- Provides CI checks, Changesets-based releases, and Husky hooks.

**MVP scope**

- Framework: **React/Next.js** (App + Pages Router) via `@voko/adapter-react-next`.
- Library binding: **next-intl** first-class.
- UI coverage: **shadcn/ui** common components.
- Future: **Vue/Nuxt** via `@voko/adapter-vue-nuxt` (scaffolded).

---

## 1) Monorepo Topology

```
repo/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  .editorconfig
  .eslintrc.cjs
  .prettierrc
  .changeset/                # created by Changesets
  .github/
    workflows/
      ci.yml
      release.yml
  packages/
    core/                    # framework-agnostic engine
    adapter-react-next/      # Next.js adapter (MVP)
    adapter-vue-nuxt/        # Vue/Nuxt adapter (stub)
    cli/                     # thin binary wrapper
  examples/
    next-app/                # example to dogfood Voko
  fixtures/
    react-next-app-router/
    react-next-pages-router/
```

**Package names**

- `@voko/core`
- `@voko/adapter-react-next`
- `@voko/adapter-vue-nuxt` (stub)
- `@voko/cli` → binary `voko`

**Repo-local working files in a **consumer** project**

- `voko.config.json`
- `.voko/manifest.json`
- `.voko/trash/` (quarantine)
- `reports/voko-scan-*.json`
- `locales/<locale>/<namespace>.json` (generated)

---

## 2) Technology Choices (pinned)

- Node 18+
- TypeScript everywhere
- **React adapter AST:** TypeScript compiler API for MVP (ts-morph optional for future print/diff stability)
- **Vue adapter AST (future):** `@vue/compiler-sfc` + Babel for `<script setup>`
- File discovery: `fast-glob`
- CLI: `commander`
- Config validation: `zod`
- Hashing: `xxhash-wasm`
- Diffs: simple unified diff generator
- Tests: `vitest`
- Lint/format: ESLint + Prettier
- Versioning & release: **Changesets**
- Git hooks: **Husky** + **lint-staged** + **commitlint**

---

## 3) Core Concepts

### 3.1 Intermediate Representation (IR)

Adapters emit an IR Voko understands. Core remains framework-agnostic.

```ts
export type NodeKind = 'block' | 'attr' | 'rich';
export type InlineTag = 'strong' | 'b' | 'em' | 'i' | 'u' | 'code' | 'a' | 'span';

export interface SourceLoc {
  file: string;
  start: number;
  end: number;
}

export interface CandidateIR {
  id: string; // hash(file+range+tag)
  namespace: string; // adapter-derived
  kind: NodeKind; // block/attr/rich
  tag?: string; // h1, p, Button, etc.
  attr?: string; // alt, title, aria-label, placeholder
  text: string; // normalized content; rich keeps inline placeholders
  inlineTags?: InlineTag[];
  hints?: Record<string, string>;
  loc: SourceLoc;
  framework: string; // "react-next", "vue-nuxt", ...
}
```

### 3.2 Patch Plan (rewrites)

Adapters propose code edits; core applies them back-to-front.

```ts
export interface Patch {
  file: string;
  edits: Array<{ start: number; end: number; replacement: string }>;
  imports?: Array<{ from: string; code: string }>;
  meta?: Record<string, unknown>;
}
```

### 3.3 Manifest (idempotency)

`.voko/manifest.json` tracks what was extracted/rewritten and how to match on reruns.

**Entry fields**

- `file`, `namespace`, `key|null`, `tag?`
- `status`: `extracted | rewritten | ignored | orphaned`
- `contentHash` (xxh64 of normalized text)
- `fingerprint` (resilient locator: tag+sibling index+ancestor id/class+text sample)
- `start`, `end` (byte offsets from last run; aids diffs)
- `lastSeen` (ISO); `lastCommit?`

**Match order on rerun**

1. Key present in code
2. `contentHash` equal
3. Fingerprint similarity

### 3.4 Namespace Rules

Deterministic, derived from route.

- Next App Router: `app/(marketing)/about/page.tsx` → `marketing.about`
- Dynamic segments `[slug]` → `.slug`
- Pages Router: `pages/about.tsx` → `about`
- Keys are **structural**, never derived from content:
  `hero.title`, `hero.body.0..N`, `section1.title`, `section1.body.i`, `values.item.i`

### 3.5 Rich Text Rules

Inline allowlist: `strong,b,em,i,u,code,a,span`.
If present inside a block, emit a single `t.rich('key', { strong: c => <strong>{c}</strong>, ... })` or adapter-equivalent. Preserve order.

---

## 4) CLI Commands — Behavior, Inputs, Outputs, Exit Codes

All commands run in a **consumer project** (not inside Voko repo), from repo root containing `voko.config.json`. Binary is `voko`.

### 4.1 `voko init`

**Purpose:** Scaffold config, working dirs, and optional CI template.

**What it does**

- Creates `voko.config.json` if missing with sane defaults.
- Creates `.voko/manifest.json` if missing (`{ "version": 1, "entries": [] }`).
- Creates `.voko/trash/` and `reports/` dirs (git-ignored).
- Optionally prints a GitHub Action snippet for consumers.

**Flags**

- `--force` overwrite existing config.

**Exit codes**

- `0` success
- `1` failed to write files
- `2` invalid path permissions

**Generated config (example)**

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

---

### 4.2 `voko scan`

**Purpose:** Parse project with chosen adapter(s), build IR, reconcile with manifest, emit report.

**Inputs**

- `voko.config.json`
- Project files matched by `globs[adapterId]` minus `ignore` globs.

**Process**

1. Load adapters from config (or autodetect if empty).

2. Adapter lists files, parses them, emits `CandidateIR[]`.

3. Core reconciles IR vs manifest:
   - `created`: new candidates
   - `updated`: hash changed for existing keys
   - `unchanged`
   - `orphaned`: manifest entries no longer present

4. Report written to `reports/voko-scan-YYYYMMDD-HHmm.json`.

**Outputs**

- Updated `.voko/manifest.json` `lastSeen` values
- Report with counts by namespace: `{ created, updated, orphaned, skipped }`

**Exit codes**

- `0` success
- `3` parse error in one or more files (printed to stderr)
- `4` invalid config

---

### 4.3 `voko extract`

**Purpose:** Write or merge locale JSON files to reflect `created` and `updated` items.

**Inputs**

- Reconcile result from last `scan` (in memory if run in same process; otherwise recomputed)
- `locales/<locale>/<namespace>.json` files if present

**Process**

- Ensure `locales/<defaultLocale>/<ns>.json` exists.
- Insert new keys with **English source text** as default values.
- Update changed keys while keeping key order stable.
- For other locales in config, create missing paths with `""`.
- Update manifest entries to `extracted`.

**Outputs**

- Touched locale files with stable key ordering and trailing newline.

**Exit codes**

- `0` success
- `5` filesystem write error

**Notes**

- No code changes happen here.
- Running `voko scan && voko extract` twice on unchanged code must produce zero diff.

---

### 4.4 `voko inject [--dry-run] [--file <pattern>]`

**Purpose:** Apply safe codemods to source files to replace literals with translation calls.

**Default behavior**

- Client components only (`"use client"` present).
- For Next + next-intl:
  - Inject `import { useTranslations } from 'next-intl'` once per file.
  - Inject `const t = useTranslations('<namespace>')` in component scope once per file (coalesced even if multiple keys).
  - Replace block text: `<h1>Hello</h1>` → `<h1>{t("hero.title")}</h1>`
  - Replace rich: `<p>We <strong>care</strong>.</p>` → `{t.rich("hero.body.0", { strong: c => <strong>{c}</strong> })}`

**Server components**

- Extract-only by default. Adds a **suggestion** to report:
  - `import { getTranslator } from 'next-intl/server'`
  - `const t = await getTranslator(locale, '<namespace>')`

- Auto-injection for server files can be added later behind an explicit flag when function can become `async` and `locale` param exists.

**Flags**

- `--dry-run` (default true) prints unified diffs and does not write files
- `--no-dry-run` actually writes files
- `--file` glob to limit injected files

**Safety**

- Never inject `useTranslations` into files without `"use client"`.
- Build all edits first, then apply back-to-front.
- Respect `/* voko:ignore */` on nodes.
- If a node already calls `t()`/`t.rich()`, it is skipped.

**Outputs**

- Diffs on stdout (dry-run) or modified source files
- Manifest entries updated to `rewritten` with `key` recorded

**Exit codes**

- `0` success
- `6` write blocked due to conflicts or mismatched offsets
- `7` refused to inject into server component (prints warnings)

---

### 4.5 `voko sync`

**Purpose:** Reconcile manifest ↔ code ↔ locales after human edits or branch merges.

**What it does**

- Recomputes `created/updated/orphaned`.
- Moves orphaned keys to `.voko/trash/<namespace>.json` **or** marks `"__deprecated": true` in place (configurable; default: move to trash).
- Refreshes `lastSeen` timestamps.
- Does **not** inject code or write new keys; use `extract` and `inject` for those.

**Exit codes**

- `0` success

---

### 4.6 `voko gc [--age <window>]`

**Purpose:** Garbage-collect quarantined keys older than a threshold.

**Default**

- `--age 14d` (days). Accepts `Nd`, `Nw`.

**What it does**

- Deletes `.voko/trash/*.json` whose `lastSeen` is older than the threshold.

**Exit codes**

- `0` success
- `8` invalid age format

---

### 4.7 `voko check`

**Purpose:** CI enforcement. Fails when raw strings are introduced or base translations are missing.

**Checks**

- Any `created` candidates still present (i.e., `scan` found new raw strings) → fail.
- Any base locale keys missing after `extract` → fail.

**Typical CI step**

```
voko scan && voko extract && voko check
```

**Exit codes**

- `0` ok
- `9` violations found

**Notes**

- Teams can allowlist certain paths via `ignore` globs in config.

---

## 5) Adapter Interface (Stable)

```ts
export interface FrameworkAdapter {
  id: string; // "react-next", "vue-nuxt"

  detect(projectRoot: string): Promise<boolean>;
  files(globs: string[], ignore: string[]): Promise<string[]>;

  namespace(file: string): string; // path → namespace
  componentKind(file: string): 'client' | 'server' | 'unknown';

  bindings(): {
    lib: string; // "next-intl", "vue-i18n"
    plain: (key: string, ns: string) => string; // e.g. t('ns.key') or $t('ns.key')
    rich: (key: string, ns: string, placeholders: InlineTag[]) => string;
    imports: (kind: 'client' | 'server') => { from: string; code: string }[];
  };

  extract(files: string[], cfg: CoreConfig): Promise<CandidateIR[]>;
  planRewrite(candidates: CandidateIR[], opts: { dryRun: boolean }): Promise<Patch[]>;
}
```

**Core responsibilities**

- Config load/validation.
- Manifest read/write and reconciliation.
- Locale JSON write/merge with stable ordering.
- Reports, diff printing, patch application.
- CI `check` logic.

**Adapter responsibilities**

- Parse AST, produce `CandidateIR[]`.
- Decide client/server.
- Provide namespace mapping and bindings.
- Build `Patch[]` for injection.

---

## 6) React/Next Adapter (MVP Details)

### 6.1 Component coverage (shadcn/ui)

- Treat text children as translatable for:
  `Button`, `Badge`, `Label`, `DialogTitle`, `DialogDescription`, `AlertDialogTitle`, `AlertDialogDescription`, `TooltipContent`, `DropdownMenuItem`, `TabsTrigger`, `NavigationMenuLink`, `AccordionTrigger`, `Toast` title/description.
- Attributes: `alt`, `title`, `aria-label`, `placeholder`, `value` for `<option>`.

### 6.2 Extraction rules

- **Blocks**: `h1..h6`, `p`, `li`, `figcaption`, `blockquote`, `th`, `td`.
- **Inline allowlist** inside blocks: `strong,b,em,i,u,code,a,span`.
- If inline tags present → `kind = "rich"`; otherwise `"block"`.
- **Skip**:
  - Nodes already wrapped in `t()` or `t.rich()`.
  - `className`, `id`, `data-*`, URLs unless in SEO/meta contexts.
  - Non-literal attribute expressions (report-only).

### 6.3 Client vs Server

- Client if file has literal `"use client"` at the very top.
- Otherwise server by default.

### 6.4 Rewriting

- Client only:
  - Insert `import { useTranslations } from 'next-intl';` if not present.
  - Add `const t = useTranslations('<ns>')` once per file.
  - Replace block text with `{t('key')}`.
  - Replace rich with `{t.rich('key', { strong: c => <strong>{c}</strong>, ... })}` using inline tag set observed.

- Server (extract-only). Report suggests:

```ts
import { getTranslator } from 'next-intl/server';
const t = await getTranslator(locale, '<namespace>');
```

---

## 7) Vue/Nuxt Adapter (Stub Plan)

- Detect `nuxt.config.*` or `pages/**/*.vue`.
- Parse SFC with `@vue/compiler-sfc`:
  - Template AST: text nodes, directives `:title`, `:aria-label`, `placeholder`.
  - `<script setup>`: `useI18n`, `$t` usages.

- Bindings:
  - `<script setup>`: `const { t } = useI18n()`.
  - Options API: `$t('ns.key')`.

- Rewriting:
  - `{{ t('ns.key') }}` for inline text.
  - `:attr="t('ns.key')"` for attributes.
  - Rich via `<i18n-t keypath="ns.key">` with slots.

---

## 8) Configuration (Deep Spec)

`voko.config.json` is validated with `zod`. Unknown keys are rejected.

```ts
export const ConfigSchema = z.object({
  frameworks: z.array(z.string()).default(['react-next']),
  library: z.record(z.string()).default({ 'react-next': 'next-intl' }),
  defaultLocale: z.string().default('en'),
  locales: z.array(z.string()).default(['en']),
  globs: z.record(z.array(z.string())).default({
    'react-next': ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  }),
  ignore: z.array(z.string()).default(['**/__tests__/**', '**/*.stories.*', 'node_modules/**']),
  namespaceStrategy: z.record(z.enum(['route', 'flat'])).default({ 'react-next': 'route' }),
  attributes: z.array(z.string()).default(['alt', 'title', 'aria-label', 'placeholder']),
  rewrite: z
    .object({
      enabled: z.boolean().default(false),
      rich: z.boolean().default(true),
      keepFormatting: z.boolean().default(true),
    })
    .default({}),
  quarantineDays: z.number().default(14),
});
```

**Hints in code**

- `/* voko:key=story.title */` applies to the immediate following translatable node.
- `/* voko:ignore */` skips the next node.
- `<p data-voko="story.body.1">...</p>` overrides key path.

---

## 9) File Formats

### 9.1 Locale files

`locales/<locale>/<namespace>.json`

- Stable key order (lexicographic).
- Trailing newline.
- For non-default locales, new keys are added with `""`.

**Example (`en/marketing.about.json`)**

```json
{
  "hero": {
    "title": "About Us",
    "body": {
      "0": "We build <strong>delightful</strong> tools for humans."
    }
  },
  "story": {
    "title": "Our Story",
    "body": {
      "0": "Started in 2023, still allergic to YAML.",
      "1": "Backed by caffeine and questionable decisions."
    }
  }
}
```

### 9.2 Manifest

`.voko/manifest.json`

- JSON with `version` and `entries[]` (see 3.3).

### 9.3 Scan report

`reports/voko-scan-YYYYMMDD-HHmm.json`

```json
{
  "summary": { "created": 12, "updated": 3, "orphaned": 2, "skipped": 5 },
  "byNamespace": {
    "marketing.about": { "created": 5, "updated": 0, "orphaned": 0, "skipped": 1 }
  },
  "notes": ["server component at app/page.tsx: extraction only"]
}
```

---

## 10) Developer Workflow (Consumer Project)

**Initial**

```
npm i -D @voko/cli
npx voko init
npx voko scan
npx voko extract
npx voko inject --dry-run    # inspect
npx voko inject              # apply
```

**Daily**

```
npx voko scan && npx voko extract
# fix missing translations downstream
```

**On PR**

```
npx voko scan && npx voko extract && npx voko check
```

**Cleanup**

```
npx voko sync
npx voko gc --age 21d
```

---

## 11) Implementation Plan (Voko Repo)

### 11.1 Day-by-Day (2 weeks)

- **D1–D2:** Monorepo scaffold, shared configs, CLI skeleton `voko init/scan` no-op.
- **D3–D4:** React adapter `detect/files/namespace/componentKind`, basic extraction (plain blocks).
- **D5–D6:** Core manifest read/write, reconciliation, report writer; attribute extraction; shadcn map.
- **D7–D8:** Locale writer; idempotency (second run zero diff); rich extraction + placeholders.
- **D9–D10:** Inject (client only), patch planner, unified diff; mark manifest `rewritten`.
- **D11–D12:** Orphan quarantine + `gc`; `check` command; fixtures; tests; docs; CI.
- **D13–D14:** Changesets releases; Husky hooks; example app polish.

### 11.2 Acceptance tests (binary)

- `scan + extract` twice → zero diff.
- Delete a routed page → its namespace is quarantined next run.
- Rich inline tags collapse into one `t.rich` with correct placeholders.
- No `useTranslations` injected into server files.
- Diffs only touch changed lines.
- `check` fails on newly introduced raw strings.

---

## 12) Versioning, Releases, and CI

### 12.1 Changesets flow

- Add changeset: `pnpm changeset` → select packages → bump type (`patch|minor|major`) → summary.
- Bot opens/updates **Version Packages** PR with changelogs.
- Merge → `release.yml` publishes: `pnpm -r publish --access public` with `NPM_TOKEN`.

### 12.2 Conventional Commits

- Enforced via commitlint:
  - `feat(adapter-react-next): add TooltipContent extraction`
  - `fix(core): preserve EOF newline`
  - `chore(cli): improve help text`

### 12.3 CI pipelines

- `ci.yml`: build, lint, typecheck, tests on push/PR.
- `release.yml`: Changesets action on pushes to `main`.
- Consumer template action `voko-check` (in docs) for PR gates.

---

## 13) Husky Hooks (Repo)

**Root `package.json`**

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint .",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run"
  },
  "devDependencies": {
    "husky": "^9",
    "lint-staged": "^15",
    "@commitlint/cli": "^19",
    "@commitlint/config-conventional": "^19"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,md}": ["prettier --write", "eslint --fix"]
  }
}
```

**.husky/pre-commit**

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm lint-staged
```

**.husky/commit-msg**

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm commitlint --edit "$1"
```

**Optional .husky/pre-push**

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm -r test -- --run
```

---

## 14) Testing Strategy

**Unit (core)**

- Namespace mapping from paths (App & Pages Router).
- Text normalization (whitespace collapse).
- Hash stability across identical content.
- Manifest reconciliation (created/updated/orphaned).

**Unit (adapter-react-next)**

- Extract plain, rich, attributes, shadcn children.
- Skip detection on existing `t()` usage.
- Client/server classification.

**Integration**

- Apply `inject --dry-run`: snapshot unified diffs.
- Apply `inject` then re-scan: zero additional created items.

**E2E (fixtures)**

- Run `scan → extract → inject` on synthetic repos; assert locale output and minimal formatting churn.
- Delete a route, re-run, assert quarantine.

---

## 15) Error Handling & Exit Codes

- `1` init write failure
- `2` permissions error
- `3` parse error (scan)
- `4` invalid config schema
- `5` locale write error
- `6` patch application conflict
- `7` attempted server injection without override
- `8` invalid age format (gc)
- `9` CI violations (`check`)

**Logging**

- INFO: operation start/stop, summary counts
- WARN: skipped nodes with reasons (server component, complex expression)
- ERROR: parse failures, patch conflicts (show file and byte offsets)

---

## 16) Performance Considerations

- Use `fast-glob` with `dot: true`, `followSymbolicLinks: false`.
- Cache `ts-morph` projects per adapter run; don’t recreate per file.
- Only read/parse files matched by globs; honor `ignore`.
- Write locale files only if content changed (compare stringified JSON).
- Apply patches in memory then write once per file.

---

## 17) Security & Privacy

- No external network calls.
- Local file system only.
- CI publishing uses `NPM_TOKEN` scoped to org.
- Reports/manifests stay in repo; no PII required or stored.

---

## 18) Adapter Authoring Guide (Summary)

1. Implement `FrameworkAdapter` in `packages/adapter-<id>/src/index.ts`.
2. Provide:
   - `detect(root)`, `files(globs, ignore)`
   - `namespace(file)`, `componentKind(file)`
   - `bindings()` for your i18n library
   - `extract()` emitting `CandidateIR[]`
   - `planRewrite()` emitting `Patch[]`

3. Keep component coverage maps declarative so adding UI widgets doesn’t require AST surgery.
4. Add fixtures and tests mirroring React adapter suite.

---

## 19) FAQ (Operational)

**Q: Can I change keys after initial extraction?**
A: Yes. Use hints (`/* voko:key=... */` or `data-voko="..."`) and rerun. Voko moves values and marks old keys deprecated for one cycle.

**Q: What about pluralization and ICU?**
A: v1 surfaces dynamic patterns in reports. Don’t auto-invent ICU strings; add them manually to the base locale.

**Q: Does Voko translate my app?**
A: No. It extracts, organizes, and rewrites usage. Translation input is a separate step or vendor.

**Q: Can I run inject on specific files only?**
A: Yes: `voko inject --file "app/marketing/**"`

**Q: How to exclude a component subtree?**
A: Add `/* voko:ignore */` immediately before the element.

---

## 20) Glossary

- **Adapter**: framework binding that knows how to parse and print code.
- **IR**: intermediate representation of found translatable units.
- **Manifest**: ledger of previous extractions/rewrites for idempotency.
- **Quarantine**: safe holding area for orphaned keys.
- **Rich**: text containing inline formatting nodes.

---

## 21) Quick Copy-Paste Snippets

**Consumer CI**

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

**Server component suggestion**

```ts
import { getTranslator } from "next-intl/server";
export default async function Page({ params: { locale } }) {
  const t = await getTranslator(locale, "marketing.about");
  return <h1>{t("hero.title")}</h1>;
}
```

---

## 22) Done-Definition (Release-Ready)

- Monorepo builds green.
- `@voko/core`, `@voko/adapter-react-next`, `@voko/cli` published.
- Example app demonstrates `scan → extract → inject`.
- Fixtures cover rich text, attributes, shadcn, server/client, deletes.
- CI (build/lint/type/test) and release pipelines operational.
- Husky and commitlint enforced.
- Documentation complete: root README, package READMEs, adapter guide.

---
