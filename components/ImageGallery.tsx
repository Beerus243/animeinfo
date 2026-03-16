// ImageGallery.tsx
import { FC } from "react";

interface ImageInfo {
  src: string;
  alt: string;
  caption: string;
  align: string;
  size: string;
}

interface ImageGalleryProps {
  images: ImageInfo[];
  onReinsert?: (img: ImageInfo) => void;
}

const ImageGallery: FC<ImageGalleryProps> = ({ images, onReinsert }) => {
  if (!images.length) return <div className="mt-4 rounded-2xl border border-dashed border-line px-4 py-5 text-sm text-muted">Aucune image détectée.</div>;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {images.map((img, idx) => (
        <div key={img.src + idx} className="overflow-hidden rounded-2xl border border-line bg-background/60">
          <img alt={img.alt} className="h-32 w-full object-cover" src={img.src} />
          <div className="space-y-2 p-3">
            <p className="truncate text-xs text-muted">{img.src}</p>
            <p className="text-xs">alt: {img.alt || ""}</p>
            <p className="text-xs">légende: {img.caption || ""}</p>
            <p className="text-xs">align: {img.align}, taille: {img.size}</p>
            {onReinsert && (
              <button className="button-secondary w-full" onClick={() => onReinsert(img)} type="button">
                Réinsérer à la position du curseur
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;
