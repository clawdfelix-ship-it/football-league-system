import type { ReactNode } from 'react';

/**
 * Shared page hero for the tenant site. One brand gradient, one vertical
 * rhythm, one title scale across Home / Fixtures / Teams / Players / Contacts
 * / Head-to-head / Overview. Content overlaps it via the parent's -mt-16.
 *
 * Light-only product. Optional eyebrow/subtitle; `center` (default) keeps the
 * historic marketing pages consistent.
 */
export default function PageHero({
  title,
  subtitle,
  center = true,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
  /** Extra content rendered above the title (e.g. logo). */
  children?: ReactNode;
  /** Extra content rendered below the subtitle (e.g. partner line). */
  footer?: ReactNode;
}) {
  return (
    <header
      className={`bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] pt-14 pb-20 text-white sm:pt-16 sm:pb-24 px-4 sm:px-6 ${
        center ? 'text-center flex flex-col items-center' : 'text-left'
      }`}
    >
      {children}
      <h1 className="mb-2 font-black italic leading-[1.05] tracking-[-0.02em] text-balance text-[clamp(1.9rem,7vw,3.75rem)]">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-2xl text-balance font-light tracking-widest uppercase text-blue-200 text-[clamp(0.7rem,2.6vw,1.125rem)]">
          {subtitle}
        </p>
      ) : null}
      {footer}
    </header>
  );
}
