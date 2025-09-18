# Adapter Authoring Guide

Adapters implement `FrameworkAdapter` in `packages/adapter-<id>/src/index.ts` to plug a framework into Voko.

## Interface

```ts
export interface FrameworkAdapter {
  id: string; // "react-next", "vue-nuxt"
  detect(projectRoot: string): Promise<boolean>;
  files(globs: string[], ignore: string[]): Promise<string[]>;
  namespace(file: string): string;
  componentKind(file: string): 'client' | 'server' | 'unknown';
  bindings(): {
    lib: string;
    plain: (key: string, ns: string) => string;
    rich: (key: string, ns: string, placeholders: InlineTag[]) => string;
    imports: (kind: 'client' | 'server') => { from: string; code: string }[];
  };
  extract(files: string[], cfg: CoreConfig): Promise<CandidateIR[]>;
  planRewrite(candidates: CandidateIR[], opts: { dryRun: boolean }): Promise<Patch[]>;
}
```

## Responsibilities

- Detect and list files
- Map file path to namespace
- Classify client/server
- Extract `CandidateIR[]` (blocks, attributes, and rich text)
- Provide i18n bindings and imports
- Return rewrite `Patch[]` for client components

## Tips

- Keep component coverage maps declarative for easy extension
- Use core helpers for hashing, normalization, and patch planning where possible
- Add fixtures and tests mirroring the React adapter suite
