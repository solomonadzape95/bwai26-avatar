import { useEffect, useState } from 'react';
import { composeAvatar, type Shape } from '../lib/composite';
import type { PixelCrop } from '../lib/crop';
import { isCloudinaryConfigured, uploadToCloudinary } from '../lib/upload';

type Props = {
  sourceImage: HTMLImageElement | null;
  cropPixels: PixelCrop | null;
  styleUrl: string;
  shape: Shape;
};

type SocialTarget = 'x' | 'linkedin';

type ReadyShare = {
  target: SocialTarget;
  intent: string;
  hostedUrl: string;
};

const SHARE_TEXT = 'My Build with AI 2026 avatar 🚀';
const SHARE_TITLE = 'Build with AI 2026 Avatar';

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

function detectFileShareSupport(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    const probe = new File([new Blob([new Uint8Array([0])])], 'probe.png', {
      type: 'image/png',
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

function buildIntent(target: SocialTarget, hostedUrl: string): string {
  const wrapper = new URL('/api/share', window.location.origin);
  wrapper.searchParams.set('img', hostedUrl);
  wrapper.searchParams.set('text', SHARE_TEXT);
  const shareUrl = wrapper.toString();
  const text = encodeURIComponent(SHARE_TEXT);
  const encoded = encodeURIComponent(shareUrl);
  return target === 'x'
    ? `https://x.com/intent/post?text=${text}&url=${encoded}`
    : `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
}

export function ActionBar({ sourceImage, cropPixels, styleUrl, shape }: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [canFileShare, setCanFileShare] = useState(false);
  const [preparing, setPreparing] = useState<SocialTarget | null>(null);
  const [ready, setReady] = useState<ReadyShare | null>(null);
  const cloudinaryReady = isCloudinaryConfigured();

  useEffect(() => {
    setCanFileShare(detectFileShareSupport());
  }, []);

  useEffect(() => {
    setReady(null);
  }, [sourceImage, cropPixels, styleUrl, shape]);

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
    setTimeout(() => setToast(null), 2400);
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

  const onNativeShare = async () => {
    if (!sourceImage || !cropPixels) return;
    setBusy(true);
    try {
      const blob = await generate();
      if (!blob) return;
      const file = new File([blob], `bwai26-avatar-${shape}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: SHARE_TITLE, text: SHARE_TEXT });
          showToast('Shared!');
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          triggerDownload(blob, file.name);
          showToast('Share failed — downloaded instead');
        }
      } else {
        triggerDownload(blob, file.name);
        showToast('Downloaded — attach to your post');
      }
    } finally {
      setBusy(false);
    }
  };

  const prepareShare = async (target: SocialTarget) => {
    if (!sourceImage || !cropPixels) return;
    if (!cloudinaryReady) {
      showToast('Set Cloudinary env vars first');
      return;
    }
    setBusy(true);
    setPreparing(target);
    setReady(null);
    try {
      const blob = await generate();
      if (!blob) return;
      const { url: hostedUrl } = await uploadToCloudinary(blob);
      const intent = buildIntent(target, hostedUrl);
      setReady({ target, intent, hostedUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg.length > 80 ? 'Upload failed — try Download' : msg);
    } finally {
      setPreparing(null);
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
          {busy && !preparing ? 'Working…' : 'Download PNG'}
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

      <button
        type="button"
        onClick={onNativeShare}
        disabled={disabled}
        className="flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-bwai-ink transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShareIcon />
        {canFileShare ? 'Share via device' : 'Share (downloads PNG)'}
      </button>

      {cloudinaryReady && (
        <div className="flex flex-col gap-2">
          {ready ? (
            <ReadyShareCard
              ready={ready}
              onDismiss={() => setReady(null)}
              onRedo={(target) => prepareShare(target)}
              preparing={preparing}
            />
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => prepareShare('x')}
                disabled={disabled}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XIcon />
                {preparing === 'x' ? 'Uploading…' : 'Post to X'}
              </button>
              <button
                type="button"
                onClick={() => prepareShare('linkedin')}
                disabled={disabled}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0a66c2] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LinkedInIcon />
                {preparing === 'linkedin' ? 'Uploading…' : 'Post to LinkedIn'}
              </button>
            </div>
          )}
          <p className="text-center text-[11px] text-neutral-400">
            Click Post → upload → then click the link to open the composer. Two clicks avoid
            popup blockers.
          </p>
        </div>
      )}

      {!cloudinaryReady && (
        <p className="text-center text-[11px] text-neutral-400">
          Set <code className="rounded bg-neutral-100 px-1">VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
          <code className="rounded bg-neutral-100 px-1">VITE_CLOUDINARY_UPLOAD_PRESET</code> in
          <code className="rounded bg-neutral-100 px-1"> .env.local</code> to enable direct X /
          LinkedIn posting.
        </p>
      )}

      {toast && (
        <div className="rounded-xl bg-bwai-ink/90 px-3 py-2 text-center text-xs font-medium text-white">
          {toast}
        </div>
      )}
    </div>
  );
}

function ReadyShareCard({
  ready,
  onDismiss,
  onRedo,
  preparing,
}: {
  ready: ReadyShare;
  onDismiss: () => void;
  onRedo: (target: SocialTarget) => void;
  preparing: SocialTarget | null;
}) {
  const isX = ready.target === 'x';
  const label = isX ? 'Open X composer' : 'Open LinkedIn composer';
  const otherTarget: SocialTarget = isX ? 'linkedin' : 'x';
  const otherLabel = otherTarget === 'x' ? 'Post to X instead' : 'Post to LinkedIn instead';
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <CheckIcon /> Avatar uploaded · ready to share
      </div>
      <a
        href={ready.intent}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onDismiss}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition ${
          isX ? 'bg-black hover:bg-neutral-800' : 'bg-[#0a66c2] hover:brightness-110'
        }`}
      >
        {isX ? <XIcon /> : <LinkedInIcon />}
        {label} →
      </a>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={() => onRedo(otherTarget)}
          disabled={preparing !== null}
          className="font-medium text-neutral-600 underline-offset-2 hover:text-bwai-ink hover:underline disabled:opacity-50"
        >
          {preparing === otherTarget ? 'Uploading…' : otherLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="font-medium text-neutral-500 hover:text-bwai-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,8 7,12 13,4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
