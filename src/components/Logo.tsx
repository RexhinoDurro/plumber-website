import Image from "next/image";
import logo from "../../public/brand/logo.png";

/**
 * The New York City Emergency Plumbing logo: the round taxi-yellow badge. Size it by height or width in className
 * (e.g. "h-12" or "w-[180px] h-auto"); the other side follows. `full` is kept for older call sites and shows the same badge.
 */
export function Logo({ className = "", priority = false, alt = "" }: { full?: boolean; className?: string; priority?: boolean; alt?: string }) {
  return (
    <Image
      src={logo}
      alt={alt}
      priority={priority}
      sizes="(max-width: 768px) 50vw, 200px"
      className={`w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
