export type NodeKind = 'block' | 'attr' | 'rich';

export type InlineTag = 'strong' | 'b' | 'em' | 'i' | 'u' | 'code' | 'a' | 'span';

export interface SourceLoc {
  file: string;
  start: number;
  end: number;
}

interface BaseIR {
  readonly id: string; // hash(file+range+tag[+kind+attr?])
  readonly namespace: string; // adapter-derived
  readonly text: string; // normalized content; rich keeps inline placeholders
  readonly hints?: Readonly<Record<string, string>>;
  readonly loc: Readonly<SourceLoc>;
  readonly framework: string; // "react-next", "vue-nuxt", ...
}

export interface BlockIR extends BaseIR {
  readonly kind: 'block';
  readonly tag: string; // h1, p, Button, etc.
}

export interface AttrIR extends BaseIR {
  readonly kind: 'attr';
  readonly tag: string; // element owning the attribute
  readonly attr: string; // alt, title, aria-label, placeholder
}

export interface RichIR extends BaseIR {
  readonly kind: 'rich';
  readonly tag?: string;
  readonly inlineTags: readonly InlineTag[];
}

export type CandidateIR = BlockIR | AttrIR | RichIR;
