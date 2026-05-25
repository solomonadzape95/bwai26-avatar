export const config = { runtime: 'edge' };

const APP_TITLE = 'Build with AI 2026 Avatar';
const DEFAULT_DESCRIPTION = 'Made with the Build with AI 2026 Avatar Generator.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAllowedImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    return (
      u.hostname.endsWith('.cloudinary.com') ||
      u.hostname === 'res.cloudinary.com' ||
      u.hostname.endsWith('.res.cloudinary.com')
    );
  } catch {
    return false;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const img = url.searchParams.get('img') ?? '';
  const text = (url.searchParams.get('text') ?? DEFAULT_DESCRIPTION).slice(0, 240);

  if (!img || !isAllowedImageUrl(img)) {
    return new Response('Invalid or missing img parameter.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const safeImg = escapeHtml(img);
  const safeText = escapeHtml(text);
  const safeTitle = escapeHtml(APP_TITLE);
  const pageUrl = `${url.origin}${url.pathname}${url.search}`;
  const safePageUrl = escapeHtml(pageUrl);
  const safeAppUrl = escapeHtml(url.origin);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <link rel="icon" type="image/png" href="/logo.png" />

  <meta name="description" content="${safeText}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Build with AI 2026" />
  <meta property="og:url" content="${safePageUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeText}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1200" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeText}" />
  <meta name="twitter:image" content="${safeImg}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />

  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: 'Google Sans', system-ui, -apple-system, sans-serif;
      background: #fafafa;
      color: #1f1f1f;
    }
    .card { max-width: 520px; width: 100%; text-align: center; }
    .label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #4285F4;
      margin-bottom: 12px;
    }
    .img-wrap {
      background: #fff;
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,.06);
    }
    img { display: block; width: 100%; height: auto; border-radius: 16px; }
    .text { margin: 20px 0 24px; font-size: 15px; line-height: 1.5; color: #4b5563; }
    a.cta {
      display: inline-block;
      padding: 11px 22px;
      border-radius: 9999px;
      background: #4285F4;
      color: #fff;
      font-weight: 600;
      text-decoration: none;
      font-size: 14px;
    }
    a.cta:hover { filter: brightness(1.08); }
  </style>
</head>
<body>
  <main class="card">
    <div class="label">Build with AI · 2026</div>
    <div class="img-wrap">
      <img src="${safeImg}" alt="${safeTitle}" width="1200" height="1200" />
    </div>
    <p class="text">${safeText}</p>
    <a class="cta" href="${safeAppUrl}">Make your own</a>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
