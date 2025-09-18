import type { CandidateIR, FrameworkAdapter, Config } from '@voko/core';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import { detectReactNextProject } from './detect';
import { listFiles } from './files';
import { deriveNamespace } from './namespace';
import { detectComponentKind } from './componentKind';
import { getBindings } from './bindings';
import { extractBlocks } from './extract/blocks';
import { extractAttrs } from './extract/attrs';
import { extractRich } from './extract/rich';
import { planRewrite as buildRewritePlan } from './rewrite/plan';
import { extname } from 'node:path';

export const reactNextAdapter: FrameworkAdapter = {
  id: 'react-next',
  async detect(projectRoot: string) {
    return detectReactNextProject(projectRoot);
  },
  async files(globs: string[], ignore: string[]) {
    return listFiles(globs, ignore);
  },
  namespace(file: string) {
    return deriveNamespace(file);
  },
  componentKind(file: string) {
    return detectComponentKind(file);
  },
  bindings() {
    return getBindings();
  },
  async extract(files: string[], _cfg: Config) {
    void _cfg;
    const results: CandidateIR[] = [];
    for (const filePath of files) {
      let content: string;
      try {
        content = await readFile(filePath, 'utf8');
      } catch {
        continue;
      }

      const ext = extname(filePath).toLowerCase();
      const kind =
        ext === '.tsx'
          ? ts.ScriptKind.TSX
          : ext === '.ts'
            ? ts.ScriptKind.TS
            : ext === '.jsx'
              ? ts.ScriptKind.JSX
              : ts.ScriptKind.JS;
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ES2020, true, kind);
      if (!sourceFile) continue;
      const ns = deriveNamespace(filePath);
      results.push(
        ...extractBlocks(filePath, sourceFile, ns, 'react-next'),
        ...extractAttrs(filePath, sourceFile, ns, 'react-next'),
        ...extractRich(filePath, sourceFile, ns, 'react-next'),
      );
    }
    return results;
  },
  async planRewrite(candidates: CandidateIR[], _opts: { dryRun: boolean }) {
    void _opts;
    return buildRewritePlan(candidates);
  },
};

export default reactNextAdapter;
