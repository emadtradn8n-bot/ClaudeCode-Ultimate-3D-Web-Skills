import type { ReactElement } from "react";

export interface Slot {
  /** Arabic label shown on the pending plate and used as default alt text. */
  label: string;
  /** width / height the layout wants, so uploads get cropped correctly. */
  ratio: number;
}

export type SlotMap = Record<string, Slot>;
export type Manifest = Record<string, string>;

export interface PhotoProps {
  slot: string;
  className?: string;
  alt?: string;
  priority?: boolean;
}

interface Theme {
  /** Tailwind classes for the pending plate, so each brand styles its own. */
  plate: string;
  icon: string;
  label: string;
  note: string;
}

/**
 * Builds a Photo component bound to one cafe's slot registry.
 *
 * A slot renders its real photograph as soon as a matching file exists in
 * public/photos/<cafe>/. Until then it draws a framed plate naming the exact
 * shot that belongs there — so an unshot frame always reads as "awaiting
 * photography" and never as finished art.
 */
export function makePhoto(slots: SlotMap, manifest: Manifest, theme: Theme) {
  return function Photo({ slot, className = "", alt, priority = false }: PhotoProps): ReactElement {
    const url = manifest[slot];
    const meta = slots[slot] ?? { label: slot, ratio: 1 };

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
        className={`flex h-full w-full flex-col items-center justify-center gap-2.5 px-4 text-center ${theme.plate} ${className}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className={theme.icon}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.3" />
          <path d="m4 17 4.5-4.5 3 3L15 12l5 5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span className={`text-[0.8rem] font-medium leading-snug ${theme.label}`}>{meta.label}</span>
        <span className={`text-[0.6rem] ${theme.note}`}>بانتظار الصورة</span>
      </div>
    );
  };
}
