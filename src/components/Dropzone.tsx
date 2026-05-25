import { useCallback, useRef, useState, type DragEvent } from 'react';

type Props = {
  onFile: (file: File) => void;
};

export function Dropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      onFile(file);
    },
    [onFile],
  );

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white p-8 text-center transition ${
        dragging
          ? 'border-bwai-blue bg-bwai-blue/5'
          : 'border-neutral-300 hover:border-bwai-blue/60 hover:bg-bwai-blue/5'
      }`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bwai-blue/10 text-bwai-blue">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <p className="text-base font-medium text-bwai-ink">Drop your photo here</p>
      <p className="mt-1 text-sm text-neutral-500">or click to upload · PNG, JPG, WebP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
