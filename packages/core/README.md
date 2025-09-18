# @voko/core

Core engine for Voko. Provides configuration schema/loader, IR + manifest model, reconciliation, locale IO, injection utilities, reporting, logging, and filesystem helpers used by adapters and the CLI.

## Features

- Configuration: Zod schema and `loadConfig()` loader
- IR types: `CandidateIR`, `NodeKind`, `InlineTag`
- Manifest: types, read/write, and `reconcile()`
- Locale IO: `readLocaleJson()`, `writeLocaleJson()`, `mergeLocales()`
- Injection: `buildInjectionPlan()`, `applyPatches()` and unified diff helpers
- Reporting: `writeScanReport()`
- Logging: `createLogger()`
- FS helpers: `discover()`, `writeFileStable()`
- Hashing & text: `hash64()`, `normalizeText()`

## Install

This package is primarily consumed by `@voko/cli` and adapter packages. If needed directly:

```bash
npm i @voko/core
```

## Examples

Load config and reconcile IR with manifest:

```ts
import {
  loadConfig,
  readManifest,
  reconcile as reconcileManifest,
  writeManifest,
  type CandidateIR,
} from '@voko/core';

const config = loadConfig();
const manifest = readManifest();
const { result, nextManifest } = reconcileManifest([] as CandidateIR[], manifest);
writeManifest(nextManifest);
```

Merge locales from reconcile result:

```ts
import { mergeLocales } from '@voko/core';
const summary = mergeLocales([] as CandidateIR[], config, result);
console.log(summary);
```

Build injection plan and preview diffs:

```ts
import { buildInjectionPlan, applyPatches, printUnifiedDiffs } from '@voko/core';
const plan = buildInjectionPlan(adapterPatches);
const res = applyPatches(plan, { write: false });
console.log(printUnifiedDiffs(res.files));
```

## Adapter interface

See `ADAPTER_GUIDE.md` at the repo root for details on implementing a `FrameworkAdapter`.
