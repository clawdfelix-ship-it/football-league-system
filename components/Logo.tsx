// Official ZENEX logo: white chamfered-hexagon "Z" mark + ZENEX wordmark on a
// transparent background (public/logo.png, 1036×1051 RGBA).
// It is pure white, so it only reads on dark backgrounds (the gray-900 navbar
// and the navy hero). Earlier this was a hand-drawn blue SVG because logo.png
// was mistaken for a "blank white file" — it is actually white-on-transparent,
// not empty.
export default function Logo({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="ZENEX"
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}
