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
