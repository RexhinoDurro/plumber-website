import Image from "next/image";
import logo from "../../public/brand/logo.png";
import logoFull from "../../public/brand/logo-full.png";

/**
 * The New York City Emergency Plumbing logo. `full` adds the bottom row (Fast response · 24/7 · Professional ·
 * Reliable), which only reads at footer size. Height is set by className (e.g. "h-12"); width follows.
 */
export function Logo({ full = false, className = "", priority = false, alt = "" }: { full?: boolean; className?: string; priority?: boolean; alt?: string }) {
  const src = full ? logoFull : logo;
  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      sizes={full ? "(max-width: 768px) 70vw, 300px" : "200px"}
      className={`w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
