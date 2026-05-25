# BwAI26 Avatar Generator

Client-side avatar generator for Build with AI 2026. Upload a photo, frame it in a circle, pick one of six brand style overlays, and download the finished 1200×1200 PNG.

No backend, no AI generation — pure HTML5 Canvas compositing. Your photo never leaves the browser.

## Develop

```
pnpm install
pnpm dev
```

## Build

```
pnpm build
pnpm preview
```

## Assets

The six style overlays live in `public/styles/style-{1..6}.png`. They are square PNGs (~1200×1200) with transparent middles, designed to be laid over a circular portrait.
