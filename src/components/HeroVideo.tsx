"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background video that respects the visitor's phone plan and settings: no video on Data Saver,
 * slow (2G/3G) connections or "reduce motion" — just the poster. Plenty of New Yorkers browse on
 * the subway with patchy signal.
 */
export function HeroVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = c?.saveData || /(^|-)2g|3g/.test(c?.effectiveType ?? "");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Deciding after mount is the point: the server can't know the visitor's connection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllowed(!slow && !still);
  }, []);

  useEffect(() => {
    if (allowed) ref.current?.play().catch(() => {});
  }, [allowed]);

  return (
    <video ref={ref} className={className} muted loop playsInline preload={allowed ? "auto" : "none"} poster={poster} aria-hidden="true">
      {allowed && <source src={src} type="video/mp4" />}
    </video>
  );
}
