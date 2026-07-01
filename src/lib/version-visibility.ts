export function shouldShowVersion(
  currentVersion: string | null | undefined,
  availableVersions: Array<string | null | undefined>,
): boolean {
  if (!currentVersion) return false;

  const versions = uniqueVersions(availableVersions);
  if (versions.length <= 1) return false;

  return currentVersion !== latestVersion(versions);
}

export function latestVersion(versions: string[]): string | undefined {
  return [...versions].sort((a, b) => versionNumber(b) - versionNumber(a))[0];
}

export function uniqueVersions(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function versionNumber(version: string): number {
  const match = version.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}
