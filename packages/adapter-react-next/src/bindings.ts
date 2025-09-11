export function getBindings() {
  return {
    lib: 'next-intl',
    plain: (key: string, ns: string) => `t('${ns}.${key}')`,
    rich: (key: string, ns: string) => `t.rich('${ns}.${key}', {})`,
    imports: (kind: 'client' | 'server') =>
      kind === 'client'
        ? [{ from: 'next-intl', code: "import { useTranslations } from 'next-intl'" }]
        : [{ from: 'next-intl/server', code: "import { getTranslator } from 'next-intl/server'" }],
  };
}
