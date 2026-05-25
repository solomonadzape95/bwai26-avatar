import { useEffect, useRef } from 'react';
import { renderPreview, type Shape } from '../lib/composite';
import type { PixelCrop } from '../lib/crop';

type Props = {
  sourceImage: HTMLImageElement | null;
  cropPixels: PixelCrop | null;
  styleUrl: string;
  shape: Shape;
  size?: number;
};

export function PreviewCanvas({ sourceImage, cropPixels, styleUrl, shape, size = 480 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !sourceImage || !cropPixels) return;
    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      if (cancelled || !canvasRef.current) return;
      try {
        await renderPreview({
          sourceImage,
          cropPixels,
          styleUrl,
          shape,
          target: canvasRef.current,
          size,
        });
      } catch {
        // ignore preview errors
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [sourceImage, cropPixels, styleUrl, shape, size]);

  const empty = !sourceImage || !cropPixels;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200">
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
          Upload a photo to preview
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: empty ? 'none' : 'block' }}
      />
    </div>
  );
}
