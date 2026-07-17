export function buildWasmLegacyRedirects(entries) {
  return entries.flatMap(({ source, destination }) => [
    { source, destination, permanent: true },
    {
      source: `/zh${source}`,
      destination: `/zh${destination}`,
      permanent: true,
    },
  ]);
}
