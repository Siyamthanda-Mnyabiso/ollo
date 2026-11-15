/** The Ollo logo exactly as drawn in the Figma file ("Ollo logo", 122 x 56). Colour follows the text colour. */
export function OlloLogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 122 56"
      fill="none"
      role="img"
      aria-label="Ollo"
      className={`aspect-[122/56] w-auto ${className}`}
    >
      <circle cx="21.6292" cy="34.3708" r="15.1798" stroke="currentColor" strokeWidth="12.8989" />
      <rect x="45.146" width="14.1573" height="56" rx="7.07865" fill="currentColor" />
      <rect x="62.4495" width="14.1573" height="56" rx="7.07865" fill="currentColor" />
      <circle cx="100.281" cy="34.3708" r="15.1798" stroke="currentColor" strokeWidth="12.8989" />
    </svg>
  );
}
