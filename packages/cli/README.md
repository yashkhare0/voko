# @voko/cli

Binary `voko` – the command-line interface for Voko.

## Install

```bash
npm i -D @voko/cli
```

## Commands

- `voko init` – scaffold `voko.config.json`, `.voko/manifest.json`, `.voko/trash/`, `reports/` (use `--force` to overwrite config)
- `voko scan` – run adapters, reconcile with manifest, write `reports/voko-scan-*.json`
- `voko extract` – write/merge locale JSON files
- `voko inject [--dry-run]` – apply codemods to client files; default prints unified diffs
- `voko sync` – recompute statuses and quarantine orphaned keys
- `voko gc [--age 14d]` – delete quarantined files older than age
- `voko check` – CI gate, exits non-zero on violations

Global flags: `--config <path>`, `--json`, `--verbose`.

See the root README for configuration and full workflow.
