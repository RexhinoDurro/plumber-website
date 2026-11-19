import Image from "next/image";
import { canOptimize } from "@/lib/images";
import { byId } from "@/content/media";

type Elbow = "tl" | "tr" | "bl" | "br" | "none";

const elbowClass: Record<Elbow, string> = {
  tl: "rounded-tl-elbow",
  tr: "rounded-tr-elbow",
  bl: "rounded-bl-elbow",
  br: "rounded-br-elbow",
  none: "",
};

/** A photo frame with one big rounded "pipe-elbow" corner. Pass a built-in photo `id`, or `src` + `alt`. */
export function Photo({
  id,
  src,
  alt,
  elbow = "none",
  sizes = "(max-width: 860px) 100vw, 50vw",
  className = "",
  priority = false,
  focus,
}: {
  id?: string;
  src?: string;
  alt?: string;
  elbow?: Elbow;
  sizes?: string;
  className?: string;
  priority?: boolean;
  focus?: string;
}) {
  const p: { src: string; alt: string; focus?: string } = id ? byId(id) : { src: src ?? "", alt: alt ?? "", focus };
  return (
    <div className={`photo ${elbowClass[elbow]} ${className}`}>
      <Image src={p.src} alt={p.alt} fill sizes={sizes} priority={priority} unoptimized={!canOptimize(p.src)} style={{ objectPosition: p.focus ?? focus }} />
    </div>
  );
}
