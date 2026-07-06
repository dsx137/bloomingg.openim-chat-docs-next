import 'server-only';

const repoOwner = 'openimsdk';
const repoName = 'open-im-server';
const repoUrl = `https://github.com/${repoOwner}/${repoName}`;
const tagsUrl = `${repoUrl}/tags`;

export type OpenIMServerVersionLink = {
  href: string;
  label: string;
  tag?: string;
};

type GitHubRelease = {
  html_url?: string;
  tag_name?: string;
};

type GitHubTag = {
  name?: string;
};

export async function getOpenIMServerVersionLink(): Promise<OpenIMServerVersionLink> {
  const release = await fetchLatestRelease();
  if (release?.tag_name) {
    return {
      href: `${repoUrl}/tree/${encodeURIComponent(release.tag_name)}`,
      label: release.tag_name,
      tag: release.tag_name,
    };
  }

  const tag = await fetchLatestTag();
  if (tag) {
    return {
      href: `${repoUrl}/tree/${encodeURIComponent(tag)}`,
      label: tag,
      tag,
    };
  }

  return {
    href: tagsUrl,
    label: 'Tags',
  };
}

async function fetchLatestRelease(): Promise<GitHubRelease | undefined> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'openim-docs',
        },
        next: { revalidate: 3600 },
      },
    );
    if (!response.ok) return undefined;
    return (await response.json()) as GitHubRelease;
  } catch {
    return undefined;
  }
}

async function fetchLatestTag(): Promise<string | undefined> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/tags`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'openim-docs',
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return undefined;
    const tags = (await response.json()) as GitHubTag[];
    return tags.find((tag) => tag.name)?.name;
  } catch {
    return undefined;
  }
}
