import type { CandidateIR, InlineTag } from '../types/ir';
import type { Patch } from '../patch/types';
import type { Config as CoreConfig } from '../config/types';

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
