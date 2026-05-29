export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

export async function fetchReadme(url: string, maxChars = 15000): Promise<string> {
  const parsed = parseGithubUrl(url);
  if (!parsed) return '';
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw',
    'User-Agent': 'bwai26-judging',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
      { headers },
    );
    if (!res.ok) return '';
    const text = await res.text();
    return text.length > maxChars ? text.slice(0, maxChars) + '\n…[truncated]' : text;
  } catch {
    return '';
  }
}
