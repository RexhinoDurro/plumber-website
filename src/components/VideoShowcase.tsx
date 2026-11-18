"use client";

import { useState } from "react";
import { showcase } from "@/content/media";

/** Click-to-play video: a poster with a big play button, then the real player with controls. */
export function VideoShowcase() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="section bg-surface" aria-labelledby="watch-title">
      <div className="wrap grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="grid gap-5">
          <p className="label">Watch a job</p>
          <h2 id="watch-title" className="max-w-[14ch]">See how we work before you call.</h2>
          <p className="lede">
            No staged smiles: a real under-basin repair, from finding the leak to testing the fix. Twenty seconds, no sound
            needed.
          </p>
          <p className="placeholder-note max-w-[52ch]">
            Placeholder clip from Pexels. A 30-second phone video of one of your own jobs will build more trust than any
            stock footage.
          </p>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-md rounded-tr-elbow bg-ink shadow-lift">
          {playing ? (
            <video
              className="size-full object-cover"
              src={showcase.src}
              poster={showcase.poster}
              controls
              autoPlay
              playsInline
              aria-label={showcase.title}
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 grid cursor-pointer place-items-center bg-cover bg-center"
              style={{ backgroundImage: `url(${showcase.poster})` }}
              aria-label={`Play video: ${showcase.title}`}
            >
              <span className="absolute inset-0 bg-ink/35 transition-colors duration-200 group-hover:bg-ink/20" />
              <span className="relative grid size-20 place-items-center rounded-full bg-white text-brand shadow-lift transition-transform duration-200 ease-out-soft group-hover:scale-105 group-active:scale-[.97] md:size-24">
                <svg viewBox="0 0 24 24" className="ml-1 size-8 md:size-10" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                </svg>
              </span>
              <span className="absolute bottom-4 left-4 rounded-full bg-ink/80 px-3 py-1 text-sm font-semibold text-on-dark">
                {showcase.title} · 0:20
              </span>
            </button>
          )}
        </div>
      </div>
      <p className="wrap mt-3 text-right text-xs text-muted">
        Video: <a href={showcase.creditUrl}>{showcase.credit} / Pexels</a>
      </p>
    </section>
  );
}
