export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function fileToObjectURL(file: File): string {
  return URL.createObjectURL(file);
}
