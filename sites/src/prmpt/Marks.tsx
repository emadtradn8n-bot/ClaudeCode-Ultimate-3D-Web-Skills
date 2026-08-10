/** Wordmark, cursor glyph and hamburger, all drawn white for exclusion blending. */

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 355 110" className={className} aria-label="prmpt">
      <text
        x="0"
        y="86"
        fill="#fff"
        fontFamily="'Inter Tight', system-ui, sans-serif"
        fontWeight="500"
        fontSize="104"
        letterSpacing="-6"
      >
        prmpt
      </text>
      <circle cx="325" cy="30" r="18" fill="none" stroke="#fff" strokeWidth="4" />
      <text
        x="325"
        y="38"
        fill="#fff"
        textAnchor="middle"
        fontFamily="'Inter Tight', system-ui, sans-serif"
        fontWeight="500"
        fontSize="20"
      >
        R
      </text>
    </svg>
  );
}

export function CursorGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="22.75" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path
        d="M16 17h16M24 17v14M18.5 24.5h11M19 31l5-5 5 5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Hamburger({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M0 14H40" stroke="#fff" strokeWidth="2.5" />
      <path d="M0 26H40" stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
}
