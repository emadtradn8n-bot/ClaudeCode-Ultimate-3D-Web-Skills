import { photoUrl, slotOf } from "./shared/assets";

interface PhotoProps {
  slot: string;
  className?: string;
  /** Overrides the slot's default Arabic label as alt text. */
  alt?: string;
  priority?: boolean;
}

/**
 * Renders the real photograph for a slot once one exists in public/photos.
 * Until then it draws a framed plate naming the exact shot that belongs here —
 * deliberately reading as "awaiting photography", never as finished art.
 */
export function Photo({ slot, className = "", alt, priority = false }: PhotoProps) {
  const url = photoUrl(slot);
  const meta = slotOf(slot);

  if (url) {
    return (
      <img
        src={url}
        alt={alt ?? meta.label}
        loading={priority ? "eager" : "lazy"}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`بانتظار صورة: ${meta.label}`}
      className={`flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed border-sage/25 bg-raised px-4 text-center ${className}`}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden className="text-sage/45">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.3" />
        <path d="m4 17 4.5-4.5 3 3L15 12l5 5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      <span className="text-[0.82rem] font-medium leading-snug text-cream/70">{meta.label}</span>
      <span className="font-mono text-[0.6rem] tracking-[0.16em] text-sage/50">
        بانتظار الصورة
      </span>
    </div>
  );
}
