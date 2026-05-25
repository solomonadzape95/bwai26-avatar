# BwAI26 Avatar Generator

Client-side avatar generator for Build with AI 2026. Upload a photo, frame it in a circle or square, pick a style from the slider, and download / copy / share the finished 1200×1200 PNG.

The compositing is pure HTML5 Canvas — no backend or AI generation. Sharing to X / LinkedIn routes the PNG through Cloudinary (image hosting) + a tiny Vercel edge function (OG / Twitter Card wrapper page) so the post unfurls with a proper image card.

## Develop

```
pnpm install
pnpm dev
```

To exercise the X / LinkedIn buttons locally with the edge function, install the Vercel CLI and run:

```
pnpm dlx vercel dev
```

(Plain `pnpm dev` won't serve `/api/share` — it's a Vercel function.)

## Build & deploy

```
pnpm build
pnpm preview
```

Deployment target is **Vercel**. Push the repo + connect it on Vercel — `vercel.json` already declares `framework: vite`. The `api/share.ts` edge function is detected automatically.

## Cloudinary setup (required for "Post to X / LinkedIn")

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. **Settings → Upload → Upload presets → Add upload preset**:
   - Signing Mode: **Unsigned**
   - Folder (optional): `bwai26-avatars`
   - Allowed formats: `png`
3. Copy `.env.example` → `.env.local` and fill in:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name
   VITE_CLOUDINARY_FOLDER=bwai26-avatars
   ```
4. Restart the dev server. The **Post to X** and **Post to LinkedIn** buttons appear automatically.
5. On Vercel, set the same vars in **Project Settings → Environment Variables**.

## How sharing actually works

| Button | Mechanism | Where it works |
|---|---|---|
| **Download PNG** | `canvas.toBlob` + anchor click | Everywhere |
| **Copy** | `navigator.clipboard.write` with `ClipboardItem` | Chromium-based browsers; Firefox & older Safari hide the button |
| **Share via device** | `navigator.share({ files })` — hands the actual PNG to the OS share sheet (X, LinkedIn, Messages, Mail, …) | iOS/Android, macOS Chrome/Edge, Windows Chrome/Edge |
| **Post to X / Post to LinkedIn** | Upload PNG to Cloudinary → build `${origin}/api/share?img=…&text=…` URL → open `x.com/intent/post?url=…` or `linkedin.com/sharing/share-offsite/?url=…` | Only fully works on a public deployment — the X / LinkedIn crawlers have to fetch `/api/share` to see the OG meta tags. From `localhost` the composer opens but no preview card renders. |

### Why the edge function exists

X and LinkedIn only render image cards when the shared URL returns HTML with the right `<meta>` tags (`twitter:card`, `twitter:image`, `og:image`, etc.). A raw Cloudinary `.png` URL doesn't have those tags, so the share appears as a bare link. `api/share.ts` returns an HTML page that points its meta tags at the Cloudinary image, which both crawlers happily render as an image card.

The function whitelists `*.cloudinary.com` URLs so the endpoint can't be repurposed to inject arbitrary images into posts.

## Assets

The six style overlays live in `public/styles/style-{1..6}.png` — square PNGs (~1200×1200) with transparent middles, designed to overlay a circular or square portrait.
