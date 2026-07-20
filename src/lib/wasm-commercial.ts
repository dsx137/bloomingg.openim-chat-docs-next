import ownership from '@/data/structure/wasm-api-ownership.json';

type OwnershipEntry = {
  name: string;
  page: string | null;
  status: string;
  commercial?: boolean;
};

export type PageCommercialKind = 'full' | 'partial' | 'none';

export type PageCommercialInfo = {
  kind: PageCommercialKind;
  methods: string[];
  openSourceMethods: string[];
  events: string[];
};

const methods = ownership.methods as OwnershipEntry[];
const events = ownership.events as OwnershipEntry[];

export function getPageCommercialInfo(pagePath: string): PageCommercialInfo {
  const documentedMethods = methods.filter(
    (entry) => entry.page === pagePath && entry.status === 'documented',
  );
  const commercialMethods = documentedMethods
    .filter((entry) => entry.commercial)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const openSourceMethods = documentedMethods
    .filter((entry) => !entry.commercial)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const commercialEvents = events
    .filter((entry) => entry.page === pagePath && entry.commercial)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (commercialMethods.length === 0 && commercialEvents.length === 0) {
    return { kind: 'none', methods: [], openSourceMethods: [], events: [] };
  }

  const kind: PageCommercialKind =
    documentedMethods.length > 0 && commercialMethods.length === documentedMethods.length
      ? 'full'
      : 'partial';

  return {
    kind,
    methods: commercialMethods,
    openSourceMethods,
    events: commercialEvents,
  };
}

export function getPageCommercialNames(pagePath: string): Set<string> {
  const info = getPageCommercialInfo(pagePath);
  return new Set([...info.methods, ...info.events]);
}

/** Match inline code like `foo()`, `openimsdk.foo`, `OpenIM.foo`, or `CbEvents.OnBar` to a commercial symbol. */
export function matchCommercialSymbol(
  codeText: string,
  commercialNames: ReadonlySet<string>,
): string | null {
  if (commercialNames.size === 0) return null;

  const trimmed = codeText.trim();
  const withoutCall = trimmed.replace(/\(\s*\)$/, '');
  const candidates = [
    withoutCall,
    withoutCall.replace(/^openimsdk\./, ''),
    withoutCall.replace(/^OpenIM\./, ''),
    withoutCall.replace(/^CbEvents\./, ''),
    withoutCall.includes('.') ? (withoutCall.split('.').at(-1) ?? withoutCall) : withoutCall,
  ];

  for (const candidate of candidates) {
    if (commercialNames.has(candidate)) return candidate;
  }
  return null;
}
