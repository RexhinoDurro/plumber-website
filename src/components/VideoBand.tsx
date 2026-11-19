import type { BgVideo } from "@/content/media";

/**
 * Full-bleed section with a slow, muted background video under an ink overlay.
 * Poster image shows first and replaces the video when reduced motion is set.
 */
export function VideoBand({
  video,
  children,
  align = "left",
  className = "",
  labelledBy,
}: {
  video: BgVideo;
  children: React.ReactNode;
  align?: "left" | "right" | "full";
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`on-dark grain relative isolate overflow-hidden bg-ink bg-cover bg-center text-on-dark ${className}`}
      style={{ backgroundImage: `url(${video.poster})` }}
    >
      <video className="media-bg opacity-60" autoPlay muted loop playsInline preload="metadata" poster={video.poster} aria-hidden="true">
        <source src={video.src} type="video/mp4" />
      </video>
      <div
        className="media-shade"
        style={{
          background:
            align === "full"
              ? "rgb(10 26 51 / .82)"
              : `linear-gradient(to ${align === "left" ? "right" : "left"}, rgb(10 26 51 / .92) 0%, rgb(10 26 51 / .7) 45%, rgb(10 26 51 / .25) 100%)`,
        }}
      />
      <div className="relative z-[2]">{children}</div>
    </section>
  );
}
