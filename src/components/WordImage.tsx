import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface WordImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fit?: 'cover' | 'contain';
}

export default function WordImage({ src, alt, className = '', fit = 'cover' }: WordImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ${className}`}
        role="img"
        aria-label={src ? 'Görsel yüklenemedi' : 'Görsel yok'}
      >
        <ImageOff className="h-1/3 w-1/3 min-h-5 min-w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`bg-slate-100 ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  );
}
