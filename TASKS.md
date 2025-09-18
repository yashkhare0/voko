# Voko Work Breakdown & Tracking

This plan is derived from `PRD.md`. Use checkboxes to track progress. Each task has a stable ID so it can be referenced in issues/PRs/changesets.

## Legend

- [ ] = TODO, [x] = Done
- ID format: `VKO-<EPIC>-<NNN>` (EPIC: CORE, REACT, VUE, CLI, MONO, CONF, LOCALE, INJECT, SYNC, CHECK, TEST, CI, REL, DOCS, PERF)

---

## Epic: Monorepo & Tooling (MONO)

- [x] VKO-MONO-001: Initialize pnpm workspace, base TS config, Prettier/ESLint
  - Objective: Base mono setup with shared configs and flat ESLint to lint repo.
  - Files to create/edit:
    - `pnpm-workspace.yaml` (workspaces for `packages/*`, `examples/*`, `fixtures/*`)
    - `tsconfig.base.json` (strict options, noEmit, dts on packages)
    - `.prettierrc.json`, `.prettierignore`
    - `eslint.config.mjs` (flat config, TS without typechecking, ignores for config files)
    - Root `package.json` scripts (`lint`, `format`, `build`, `dev`)
  - Steps:
    1. Ensure ESLint configs include `typescript-eslint` non-type-checked presets.
    2. Ensure ignores include `dist`, `coverage`, `**/*.d.ts`, `**/tsup.config.ts`, `**/vitest.config.ts`.
  - Acceptance:Implement INJECT-001/003 (patch planning glue + conflict-safe apply improvements).
    Implement INJECT-001/003 (patch planning glue + conflict-safe apply improvements).
    Implement INJECT-001/003 (patch planning glue + conflict-safe apply improvements).
    Implement INJECT-001/003 (patch planning glue + conflict-safe apply improvements).
    Implement INJECT-001/003 (patch planning glue + conflict-safe apply improvements).

        - `pnpm lint` and `pnpm build` succeed.
        - Formatting/lint hooks apply on commit.

- [x] VKO-MONO-002: Husky hooks and lint-staged configuration
  - Objective: Enforce formatting, linting and commit convention.
  - Files:
    - `.husky/pre-commit` (runs `pnpm lint-staged`)
    - `.husky/commit-msg` (runs `pnpm commitlint --edit "$1"`)
    - `package.json` `lint-staged` block
    - `commitlint.config.cjs`
  - Acceptance:
    - Bad commit message is rejected; staged files are formatted and linted.

- [ ] VKO-MONO-003: Editor config
  - Objective: Standardize editors across contributors.
  - Files:
    - `.editorconfig` with UTF-8, LF, 2 spaces, insert_final_newline.
  - Acceptance:
    - IDEs respect 2-space indentation and newline at EOF.

- [x] VKO-MONO-004: Repo ignore files
  - Objective: Ignore build and working dirs.
  - Files:
    - Root `.gitignore` including: `node_modules`, `dist`, `coverage`, `.voko/`, `reports/`, `.changeset/*.md` (not ignored), `*.log`.
  - Acceptance:
    - Untracked build artifacts don’t show in `git status`.

## Epic: Configuration & Schema (CONF)

- [x] VKO-CONF-001: Define `voko.config.json` schema with zod
  - Objective: Strongly-typed config with defaults per PRD §8.
  - Files:
    - `packages/core/src/config/schema.ts`
    - `packages/core/src/config/types.ts` (export inferred `Config` type)
  - Steps:
    1. Implement `ConfigSchema` exactly as PRD §8 describes (frameworks, library, defaultLocale, locales, globs, ignore, namespaceStrategy, attributes, rewrite, quarantineDays).
    2. Export `type Config = z.infer<typeof ConfigSchema>`.
  - Tests:
    - Valid minimal config yields defaults.
    - Unknown keys rejected with useful message.
  - Acceptance:
    - Passing/ failing samples cover defaults and validation errors.

- [x] VKO-CONF-002: Config loader with validation and helpful errors
  - Objective: Read `voko.config.json`, validate, and return `Config` with defaults.
  - Files:
    - `packages/core/src/config/load.ts`
    - `packages/core/src/config/errors.ts`
  - Steps:
    1. Resolve `voko.config.json` from cwd; error if missing with suggestion to run `voko init`.
    2. Parse JSON; surface line/col on JSON errors.
    3. Validate via `ConfigSchema`; throw typed errors with `code`.
  - Tests:
    - Missing file → error code.
    - Invalid JSON → error contains position.
    - Invalid schema → error lists path and reason.
  - Acceptance:
    - Loader consumed by CLI commands without guesswork.

- [ ] VKO-CONF-003: Default values and schema docs
  - Objective: Document schema and generate example.
  - Files:
    - `packages/core/README.md` (config section)
    - Example `voko.config.json` in README matching PRD sample.
  - Acceptance:
    - Copy-pasteable config works with `scan` dry path.

## Epic: Core Types & Engine (CORE)

- [x] VKO-CORE-001: Define IR types (NodeKind, CandidateIR, SourceLoc)
  - Objective: Shared IR contract adapters emit (PRD §3.1).
  - Files: `packages/core/src/types/ir.ts`
  - Steps:
    1. Implement `NodeKind`, `InlineTag`, `SourceLoc`, `CandidateIR` per PRD.
    2. Export as ESM with strict types.
  - Tests: Type-only compile tests (dts) and sample object validation.
  - Acceptance: Adapters can import and construct IR seamlessly.

- [x] VKO-CORE-002: Define Patch plan types and applier
  - Objective: Describe and apply text edits (PRD §3.2).
  - Files:
    - `packages/core/src/patch/types.ts`
    - `packages/core/src/patch/apply.ts`
  - Steps:
    1. Define `Patch` and `Edit` types with imports metadata.
    2. Implement `applyPatches(patches: Patch[]): ApplyResult` that sorts edits back-to-front per file, detects overlaps, writes once.
  - Tests: Overlapping edits → conflict; back-to-front preserves offsets; imports merge.
  - Acceptance: Dry-run produces correct unified diff; write mode edits correctly.

- [x] VKO-CORE-003: Text normalization utilities
  - Objective: Collapse whitespace, normalize rich placeholders for hashing.
  - Files: `packages/core/src/text/normalize.ts`
  - Steps: Implement `normalizeText(input: string): string` with PRD rules.
  - Tests: Multiple spacing variants map to identical hash input.
  - Acceptance: Stable across runs and adapters.

- [x] VKO-CORE-004: Hashing helpers (xxhash-wasm)
  - Objective: Fast, stable content hashing (PRD §3.3 `contentHash`).
  - Files: `packages/core/src/hash/index.ts`
  - Steps: Lazy-init xxhash; export `hash64(input: string): string`.
  - Tests: Same input → same hash; diff input → diff hash.
  - Acceptance: Used by manifest reconciliation.

- [x] VKO-CORE-005: Manifest model (read/write, reconcile)
  - Objective: Idempotency ledger (PRD §3.3).
  - Files: `packages/core/src/manifest/{types.ts,read.ts,write.ts,reconcile.ts}`
  - Steps:
    1. Types with fields from PRD (status enum, fingerprint etc.).
    2. Read/write JSON with stable ordering; initialize if missing.
    3. `reconcile(ir, manifest)` → `{ created, updated, unchanged, orphaned }` with comparisons by key/contentHash/fingerprint.
  - Tests: Two-run idempotency; deletes produce `orphaned`.
  - Acceptance: Downstream commands consume reconciliation output.

- [x] VKO-CORE-006: Report writer (scan summaries)
  - Objective: Emit `reports/voko-scan-YYYYMMDD-HHmm.json` (PRD §4.3).
  - Files: `packages/core/src/report/write.ts`
  - Steps: Write summary and notes; ensure stable formatting.
  - Tests: File path includes timestamp; contents match schema.
  - Acceptance: `scan` produces readable reports.

- [x] VKO-CORE-007: Logging and error types
  - Objective: Centralize INFO/WARN/ERROR with typed errors.
  - Files: `packages/core/src/log/index.ts`, `packages/core/src/errors.ts`
  - Steps: Implement minimal logger with levels; error classes with `code`.
  - Acceptance: CLI consumes logger; tests assert messages.

## Epic: Filesystem & Discovery (CORE)

- [x] VKO-CORE-101: Glob discovery with fast-glob honoring ignore list
  - Objective: Controlled discovery per adapter config.
  - Files: `packages/core/src/fs/glob.ts`
  - Steps: `discover(globs: string[], ignore: string[]): Promise<string[]>` with `dot: true`, `followSymbolicLinks: false`.
  - Tests: Ignore patterns honored; deterministic ordering.

- [x] VKO-CORE-102: Stable write helpers (write only on change)
  - Objective: Avoid churn; write only when content changed.
  - Files: `packages/core/src/fs/write.ts`
  - Steps: `writeFileStable(path, content)` compares existing file string before write.
  - Tests: No write if identical; writes once otherwise.

## Epic: Locale IO (LOCALE)

- [x] VKO-LOCALE-001: Locale JSON read/write with stable key order
  - Objective: Maintain sorted keys and trailing newline (PRD §9.1).
  - Files: `packages/core/src/locale/{read.ts,write.ts}`
  - Steps: Read JSON; write pretty, lexicographically sorted keys; ensure newline.
  - Tests: Sorting confirmed; newline present.

- [x] VKO-LOCALE-002: Extract result → locale merge logic
  - Objective: Merge `created/updated` into base and other locales (PRD §4.4).
  - Files: `packages/core/src/locale/merge.ts`
  - Steps: Create base locale files if missing; update keys; other locales get empty strings for new keys.
  - Tests: Merge idempotent; order stable.

## Epic: React/Next Adapter (REACT)

- [x] VKO-REACT-001: Detect Next.js project
  - Objective: Determine if consumer repo is Next.js.
  - Files: `packages/adapter-react-next/src/detect.ts`
  - Steps: Look for `next.config.*`, `app/` or `pages/` folders, `package.json` deps.
  - Tests: True for fixtures; false otherwise.

- [x] VKO-REACT-002: File listing based on config globs
  - Objective: Enumerate TS/TSX files per config.
  - Files: `packages/adapter-react-next/src/files.ts`
  - Steps: Use core `discover` with adapter-specific globs and ignore.
  - Tests: Lists only targeted files.

- [x] VKO-REACT-003: Namespace mapping (App/Pages Router)
  - Objective: Stable namespace derivation (PRD §3.4).
  - Files: `packages/adapter-react-next/src/namespace.ts`
  - Steps: Implement mapping examples (`app/(marketing)/about/page.tsx` → `marketing.about`, pages router `pages/about.tsx` → `about`, dynamic `[slug]` → `.slug`).
  - Tests: Mapping table snapshot.

- [x] VKO-REACT-004: Component kind (client/server) detection
  - Objective: Check for top-level "use client".
  - Files: `packages/adapter-react-next/src/componentKind.ts`
  - Tests: Files with and without directive.

- [x] VKO-REACT-005: Bindings for next-intl (client/server)
  - Objective: Provide import strings and usage templates.
  - Files: `packages/adapter-react-next/src/bindings.ts`
  - Steps: Client: `useTranslations('<ns>')`; Server: `getTranslator(locale, '<ns>')` suggestion.

- [x] VKO-REACT-006: Extraction – plain block text nodes
  - Objective: Find translatable blocks per PRD §6.2.
  - Files: `packages/adapter-react-next/src/extract/blocks.ts`
  - Steps: Parse TSX (ts-morph), traverse JSX; skip if already `t()`.
  - Tests: Extracts h1..h6, p, li, etc.

- [x] VKO-REACT-007: Extraction – attributes
  - Objective: Extract `alt`, `title`, `aria-label`, `placeholder`, `<option value>`.
  - Files: `packages/adapter-react-next/src/extract/attrs.ts`
  - Tests: Attributes captured with loc info.

- [x] VKO-REACT-008: Extraction – rich text with inline placeholders
  - Objective: Collapse inline tags into placeholders and mark `kind = "rich"`.
  - Files: `packages/adapter-react-next/src/extract/rich.ts`
  - Tests: Strong/em/code/a/span produce placeholders in order.

- [x] VKO-REACT-009: shadcn/ui coverage map
  - Objective: Treat component children as text for listed components.
  - Files: `packages/adapter-react-next/src/shadcn-map.ts`
  - Tests: Map-driven coverage; easy to extend.

- [x] VKO-REACT-010: planRewrite rules (client components only)
  - Objective: Build `Patch[]` to inject imports and `t()` usages.
  - Files: `packages/adapter-react-next/src/rewrite/plan.ts`
  - Steps: Insert import once; declare `const t = useTranslations('<ns>')` once; replace blocks/rich accordingly.
  - Tests: Snapshot diffs; server files produce suggestions only.

- [x] VKO-REACT-011: Patcher helpers for imports and `t()` insertions
  - Objective: Utilities to avoid duplicate imports/decls.
  - Files: `packages/adapter-react-next/src/rewrite/patchers.ts`
  - Tests: Idempotent patches.

- [x] VKO-REACT-012: Adapter entry implementing FrameworkAdapter
  - Objective: Wire all pieces to match core interface (PRD §5).
  - Files: `packages/adapter-react-next/src/index.ts`
  - Tests: Smoke test calling each method on fixtures.

- [x] VKO-REACT-013: Fixtures (app router, pages router) and unit tests
  - Objective: High-confidence coverage for extraction and rewrite.
  - Files: `packages/adapter-react-next/__tests__/*`, `packages/adapter-react-next/fixtures/*`
  - Tests: Rich/attrs/blocks; client/server; shadcn components.

## Epic: Vue/Nuxt Adapter (VUE)

- [ ] VKO-VUE-001: Detect Nuxt/SFC presence
  - Objective: Identify Nuxt projects quickly.
  - Files: `packages/adapter-vue-nuxt/src/detect.ts`
  - Steps: Look for `nuxt.config.*`, `pages/**/*.vue`.

- [ ] VKO-VUE-002: Parse SFC and template AST
  - Objective: Build extractable representation from `.vue` files.
  - Files: `packages/adapter-vue-nuxt/src/parse.ts`
  - Steps: Use `@vue/compiler-sfc` to parse; walk template AST.

- [ ] VKO-VUE-003: Minimal extraction (blocks, attrs)
  - Objective: Extract block text and common attributes; skip rich for now.
  - Files: `packages/adapter-vue-nuxt/src/extract/*`

- [ ] VKO-VUE-004: Bindings for vue-i18n
  - Objective: Provide `$t('ns.key')` and `<i18n-t>` mapping for rich (future).
  - Files: `packages/adapter-vue-nuxt/src/bindings.ts`

## Epic: CLI (CLI)

- [x] VKO-CLI-001: Commander setup and shared options
  - Objective: Provide CLI shell with global flags.
  - Files:
    - `packages/cli/src/commands/_shared.ts` (logger, config path override)
    - `packages/cli/src/index.ts` (command registration)
  - Flags: `--config <path>`, `--json`, `--verbose`.

- [x] VKO-CLI-002: `init` command (write config, dirs)
  - Objective: Scaffold `voko.config.json`, `.voko/`, `reports/` (PRD §4.1).
  - Files: `packages/cli/src/commands/init.ts`
  - Steps: Respect `--force`; write sample config; create dirs.
  - Exit codes: `0`, `1`, `2` per PRD.

- [x] VKO-CLI-003: `scan` command (run adapters, emit report)
  - Objective: Produce IR and reconcile with manifest (PRD §4.2-§4.3).
  - Files: `packages/cli/src/commands/scan.ts`
  - Steps: Load config; for each adapter: detect → files → extract; core reconcile → report write.
  - Exit codes: `0`, `3`, `4`.

- [x] VKO-CLI-004: `extract` command (write/merge locales)
  - Objective: Write base locale files and merge updates (PRD §4.4).
  - Files: `packages/cli/src/commands/extract.ts`
  - Exit codes: `0`, `5`.

- [x] VKO-CLI-005: `inject` command (apply codemods; dry-run by default)
  - Objective: Apply adapter patch plan to client files (PRD §4.5).
  - Files: `packages/cli/src/commands/inject.ts`
  - Flags: `--dry-run` (default true), `--no-dry-run`, `--file <glob>`.
  - Exit codes: `0`, `6`, `7`.

- [x] VKO-CLI-006: `sync` command (quarantine or deprecate)
  - Objective: Reconcile manifest ↔ locales; move/deprecate orphans (PRD §4.5 / §4.7 intent).
  - Files: `packages/cli/src/commands/sync.ts`
  - Exit codes: `0`.

- [x] VKO-CLI-007: `gc` command (age-based cleanup)
  - Objective: Delete trash older than N days (PRD §4.6).
  - Files: `packages/cli/src/commands/gc.ts`
  - Flags: `--age 14d|21d|...`; Exit: `0`, `8`.

- [x] VKO-CLI-008: `check` command (CI gate)
  - Objective: Fail when violations exist (PRD §4.7).
  - Files: `packages/cli/src/commands/check.ts`
  - Exit codes: `0`, `9`.

## Epic: Injection Engine (INJECT)

- [x] VKO-INJECT-001: Build Patch[] from adapter plan
  - Objective: Convert adapter edit intents to `Patch[]` per file.
  - Files: `packages/core/src/inject/plan.ts`
  - Steps: Group edits by file; include imports; ensure deterministic order.

- [x] VKO-INJECT-002: Unified diff printer (dry-run)
  - Objective: Human-friendly diff for `--dry-run`.
  - Files: `packages/core/src/inject/diff.ts`
  - Steps: Implement minimal unified diff generator; colorize via CLI.

- [x] VKO-INJECT-003: Safe back-to-front apply with conflict detection
  - Objective: Apply patches safely; surface conflicts with offsets.
  - Files: `packages/core/src/inject/apply.ts`
  - Steps: Detect overlapping ranges; rollback on error; return summary.

## Epic: Sync & Quarantine (SYNC)

- [x] VKO-SYNC-001: Compute created/updated/orphaned on rerun
  - Objective: Refresh manifest statuses after scan.
  - Files: `packages/core/src/sync/compute.ts`
  - Steps: Use reconcile output to set statuses; update timestamps.

- [x] VKO-SYNC-002: Move orphaned keys to `.voko/trash/*.json` or mark deprecated
  - Objective: Keep repo clean per PRD §4.5/§4.6 intent.
  - Files: `packages/core/src/sync/quarantine.ts`
  - Steps: Either move to trash files or mark `"__deprecated": true` based on config.

## Epic: CI Check (CHECK)

- [x] VKO-CHECK-001: Fail on created candidates present after extract
  - Objective: CI enforcement per PRD §4.7.
  - Files: `packages/core/src/check/index.ts`
  - Steps: Load last scan state; compute violations; non-zero exit on any.

## Epic: Testing (TEST)

- [ ] VKO-TEST-001: Core unit tests (namespace, normalization, hashing)
  - Files: `packages/core/__tests__/*`
  - Cases: Namespace mapping; normalize invariants; hash stability.

- [x] VKO-TEST-002: Manifest reconcile tests (created/updated/orphaned)
  - Files: `packages/core/__tests__/manifest.spec.ts`
  - Cases: Created/updated/unchanged/orphaned matrix.

- [ ] VKO-TEST-3: Adapter unit tests (React extract, attrs, rich, shadcn)
  - Files: `packages/adapter-react-next/__tests__/*`
  - Cases: Blocks/attrs/rich; client/server; coverage map.

- [ ] VKO-TEST-004: Integration test for `inject --dry-run` (snapshot diffs)
  - Files: `packages/cli/__tests__/inject.spec.ts`
  - Cases: Snapshot diff stability.

- [ ] VKO-TEST-005: E2E fixtures (scan → extract → inject; delete route → quarantine)
  - Files: `fixtures/*`, `packages/cli/__tests__/e2e.spec.ts`
  - Cases: End-to-end parity with PRD acceptance list.

## Epic: CI & Release (CI / REL)

- [x] VKO-CI-001: GitHub Actions `ci.yml` (build/lint/type/test)
  - Objective: CI per PRD §12.3.
  - Files: `.github/workflows/ci.yml`
  - Steps: Node 18; cache pnpm; run build, lint, test; artifact coverage.

- [x] VKO-REL-001: Changesets `release.yml` for publish
  - Objective: Automated releases on main.
  - Files: `.github/workflows/release.yml`
  - Steps: Use Changesets action; `pnpm -r publish --access public` with `NPM_TOKEN`.

- [ ] VKO-REL-002: NPM publish configuration and docs
  - Objective: Packages publishable and documented.
  - Files: package `publishConfig`, `README.md` per package.

## Epic: Documentation (DOCS)

- [x] VKO-DOCS-001: Root README with quickstart and architecture
  - Content: What Voko does, packages, quickstart, CLI table, architecture diagram.

- [x] VKO-DOCS-002: Package READMEs (`core`, `adapter-react-next`, `cli`)
  - Content: Purpose, public API, usage examples, config notes.

- [x] VKO-DOCS-003: Adapter authoring guide
  - Content: `FrameworkAdapter` contract and example implementation.

- [ ] VKO-DOCS-004: Consumer docs (config reference, CI snippet)
  - Content: `voko.config.json` reference, CI copy-paste, troubleshooting.

## Epic: Performance (PERF)

- [ ] VKO-PERF-001: Cache ts-morph projects within adapter run
  - Objective: Reuse project to avoid re-parsing; measurable speedup.
  - Files: `packages/adapter-react-next/src/tsmorph/projectCache.ts`

- [ ] VKO-PERF-002: Benchmark discovery and extraction on fixtures
  - Objective: Baseline runs and track regressions.
  - Files: `packages/adapter-react-next/scripts/bench.ts`

## Acceptance & Done Criteria

- Each task is complete when:
  - Code merged with tests and docs (if applicable)
  - Lint/type/test pipeline passes
  - For CLI commands: exit codes match PRD and are documented
  - For adapters: fixtures demonstrate behavior
