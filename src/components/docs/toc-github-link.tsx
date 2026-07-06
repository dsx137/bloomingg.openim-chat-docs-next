import { GithubIcon } from '@/src/components/ui/icons';
import type { OpenIMServerVersionLink } from '@/src/lib/openim-server-version';

export function TocGithubLink({ version }: { version: OpenIMServerVersionLink }) {
  return (
    <a
      aria-label={`OpenIM Server ${version.label} on GitHub`}
      className="toc-github-link"
      href={version.href}
      rel="noreferrer"
      target="_blank"
      title={`OpenIM Server ${version.label}`}
    >
      <GithubIcon />
      <span>{version.label}</span>
    </a>
  );
}
