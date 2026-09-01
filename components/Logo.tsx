// Inline ZENEX mark: cobalt flat-top hexagon + white geometric Z.
// Used on the navy hero and dark navbar, so the hex carries a white ring
// to read against both backgrounds. Recreated from the banner reference
// (public/ref1.jpg) because the shipped logo.png was a blank white file.
export default function Logo({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="ZENEX" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="25,7 75,7 93,50 75,93 25,93 7,50"
        fill="#3B63E0"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M33 31 H67 L33 69 H67"
        stroke="#ffffff"
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
  );
}
