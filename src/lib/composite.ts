import { loadImage, type PixelCrop } from './crop';

export type Shape = 'circle' | 'square';

const styleCache = new Map<string, HTMLImageElement>();

async function getStyleImage(url: string): Promise<HTMLImageElement> {
  const cached = styleCache.get(url);
  if (cached) return cached;
  const img = await loadImage(url);
  styleCache.set(url, img);
  return img;
}

function applyShapeClip(ctx: CanvasRenderingContext2D, shape: Shape, size: number) {
  if (shape === 'square') return;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
}

export type ComposeArgs = {
  sourceImage: HTMLImageElement;
  cropPixels: PixelCrop;
  styleUrl: string;
  shape: Shape;
  size?: number;
  background?: 'transparent' | 'white';
};

export async function composeAvatar({
  sourceImage,
  cropPixels,
  styleUrl,
  shape,
  size = 1200,
  background = 'transparent',
}: ComposeArgs): Promise<Blob> {
  await getStyleImage(styleUrl);
  const canvas = renderToCanvas({
    sourceImage,
    cropPixels,
    styleUrl,
    shape,
    size,
    background,
  });
  return canvasToBlob(canvas);
}

export function renderToCanvas({
  sourceImage,
  cropPixels,
  styleUrl,
  shape,
  size,
  background = 'transparent',
}: {
  sourceImage: HTMLImageElement;
  cropPixels: PixelCrop;
  styleUrl: string | null;
  shape: Shape;
  size: number;
  background?: 'transparent' | 'white';
}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.save();
  applyShapeClip(ctx, shape, size);

  if (background === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  ctx.drawImage(
    sourceImage,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    size,
    size,
  );

  if (styleUrl) {
    const styleImage = styleCache.get(styleUrl);
    if (styleImage) {
      ctx.drawImage(styleImage, 0, 0, size, size);
    }
  }

  ctx.restore();

  return canvas;
}

export async function renderPreview({
  sourceImage,
  cropPixels,
  styleUrl,
  shape,
  target,
  size,
  background = 'transparent',
}: {
  sourceImage: HTMLImageElement;
  cropPixels: PixelCrop;
  styleUrl: string;
  shape: Shape;
  target: HTMLCanvasElement;
  size: number;
  background?: 'transparent' | 'white';
}): Promise<void> {
  await getStyleImage(styleUrl);
  const canvas = renderToCanvas({
    sourceImage,
    cropPixels,
    styleUrl,
    shape,
    size,
    background,
  });
  target.width = size;
  target.height = size;
  const ctx = target.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(canvas, 0, 0);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode canvas to blob'));
    }, 'image/png');
  });
}
