import { useEffect, useMemo, useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { CropEditor } from './components/CropEditor';
import { StylePicker } from './components/StylePicker';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ActionBar } from './components/ActionBar';
import { ShapeToggle } from './components/ShapeToggle';
import { STYLE_OPTIONS } from './lib/styles';
import { fileToObjectURL, loadImage, type PixelCrop } from './lib/crop';
import type { Shape } from './lib/composite';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [cropPixels, setCropPixels] = useState<PixelCrop | null>(null);
  const [styleId, setStyleId] = useState<number>(STYLE_OPTIONS[0].id);
  const [shape, setShape] = useState<Shape>('circle');

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      setSourceImage(null);
      setCropPixels(null);
      return;
    }
    const url = fileToObjectURL(file);
    setImageUrl(url);
    let cancelled = false;
    loadImage(url).then((img) => {
      if (!cancelled) setSourceImage(img);
    });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const styleUrl = useMemo(
    () => STYLE_OPTIONS.find((s) => s.id === styleId)?.url ?? STYLE_OPTIONS[0].url,
    [styleId],
  );

  const reset = () => setFile(null);

  return (
    <div className="min-h-full bg-gradient-to-b from-white to-neutral-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Build with AI · 2026
            </div>
            <h1 className="text-xl font-semibold text-bwai-ink">Avatar Generator</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <SectionTitle step="1" title="Upload & frame your photo" />
          {file && imageUrl ? (
            <CropEditor
              imageUrl={imageUrl}
              shape={shape}
              onCropChange={setCropPixels}
              onReset={reset}
            />
          ) : (
            <Dropzone onFile={setFile} />
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between">
              <SectionTitle step="2" title="Preview" />
              <ShapeToggle value={shape} onChange={setShape} />
            </div>
            <div className="mt-3">
              <PreviewCanvas
                sourceImage={sourceImage}
                cropPixels={cropPixels}
                styleUrl={styleUrl}
                shape={shape}
              />
            </div>
          </div>

          <div>
            <SectionTitle step="3" title="Pick a style" />
            <div className="mt-3">
              <StylePicker selectedId={styleId} onSelect={setStyleId} />
            </div>
          </div>

          <div>
            <SectionTitle step="4" title="Save & share" />
            <div className="mt-3">
              <ActionBar
                sourceImage={sourceImage}
                cropPixels={cropPixels}
                styleUrl={styleUrl}
                shape={shape}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-neutral-400">
        Made for the Build with AI 2026 community · client-side only · your photo never leaves
        your browser
      </footer>
    </div>
  );
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bwai-blue text-xs font-bold text-white">
        {step}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">{title}</h2>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
      <svg viewBox="0 0 32 32" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" strokeWidth="5" strokeLinecap="round">
          <line x1="13" y1="7" x2="6" y2="14.5" stroke="#EA4335" />
          <line x1="13" y1="25" x2="6" y2="17.5" stroke="#4285F4" />
          <line x1="19" y1="7" x2="26" y2="14.5" stroke="#34A853" />
          <line x1="19" y1="25" x2="26" y2="17.5" stroke="#FBBC04" />
        </g>
      </svg>
    </div>
  );
}
