import { useState } from 'react';
import { composeAvatar, type Shape } from '../lib/composite';
import type { PixelCrop } from '../lib/crop';

type Props = {
  sourceImage: HTMLImageElement | null;
  cropPixels: PixelCrop | null;
  styleUrl: string;
  shape: Shape;
};

const SHARE_TEXT = 'My Build with AI 2026 avatar — generated at bwai26-avatar 🚀';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ActionBar({ sourceImage, cropPixels, styleUrl, shape }: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const disabled = !sourceImage || !cropPixels || busy;
  const canCopy =
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof window !== 'undefined' &&
    typeof window.ClipboardItem !== 'undefined';

  const generate = async (): Promise<Blob | null> => {
    if (!sourceImage || !cropPixels) return null;
    return composeAvatar({ sourceImage, cropPixels, styleUrl, shape, size: 1200 });
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const onDownload = async () => {
    setBusy(true);
    try {
      const blob = await generate();
      if (blob) {
        triggerDownload(blob, `bwai26-avatar-${shape}.png`);
        showToast('Saved!');
      }
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    setBusy(true);
    try {
      const blob = await generate();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Copied to clipboard');
    } catch {
      showToast('Copy not allowed — try Download');
    } finally {
      setBusy(false);
    }
  };

  const onShare = async (target: 'x' | 'linkedin') => {
    setBusy(true);
    try {
      const blob = await generate();
      if (blob) triggerDownload(blob, 'bwai26-avatar.png');
      const text = encodeURIComponent(SHARE_TEXT);
      const intent =
        target === 'x'
          ? `https://twitter.com/intent/tweet?text=${text}`
          : `https://www.linkedin.com/feed/?shareActive=true&text=${text}`;
      window.open(intent, '_blank', 'noopener,noreferrer');
      showToast('Downloaded — attach the PNG in the new tab');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={disabled}
          className="flex-1 rounded-full bg-bwai-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {busy ? 'Working…' : 'Download PNG'}
        </button>
        {canCopy && (
          <button
            type="button"
            onClick={onCopy}
            disabled={disabled}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-bwai-ink transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onShare('x')}
          disabled={disabled}
          className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-bwai-ink transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share on X
        </button>
        <button
          type="button"
          onClick={() => onShare('linkedin')}
          disabled={disabled}
          className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-bwai-ink transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share on LinkedIn
        </button>
      </div>
      {toast && (
        <div className="rounded-xl bg-bwai-ink/90 px-3 py-2 text-center text-xs font-medium text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
