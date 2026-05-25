import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import type { PixelCrop } from '../lib/crop';
import type { Shape } from '../lib/composite';

type Props = {
  imageUrl: string;
  shape: Shape;
  onCropChange: (cropPixels: PixelCrop) => void;
  onReset: () => void;
};

export function CropEditor({ imageUrl, shape, onCropChange, onReset }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_area: Area, areaPixels: Area) => {
      onCropChange({
        x: areaPixels.x,
        y: areaPixels.y,
        width: areaPixels.width,
        height: areaPixels.height,
      });
    },
    [onCropChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-neutral-900">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape={shape === 'circle' ? 'round' : 'rect'}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-500">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-bwai-blue"
        />
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Replace photo
        </button>
      </div>
    </div>
  );
}
