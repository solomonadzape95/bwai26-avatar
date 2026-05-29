const EVENT_PREFIX = 'bwai26';

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function submissionSlug(projectName: string, submitterName: string, id: string): string {
  const parts = [
    EVENT_PREFIX,
    slugify(projectName) || 'project',
    slugify(submitterName) || 'team',
    id.replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase() || 'xxxx',
  ];
  return parts.join('-');
}
