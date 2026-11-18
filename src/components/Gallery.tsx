"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, type Category, type Photo } from "@/content/media";

type Filter = "All" | Category;

// Varied tile shapes so the masonry reads like a real photo wall.
const shapes = ["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]", "aspect-[16/10]"];

export function Gallery({ photos }: { photos: Photo[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(
    () => (filter === "All" ? photos : photos.filter((p) => p.category === filter)),
    [filter, photos],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: photos.length };
    for (const p of photos) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [photos]);

  const open = (i: number, el: HTMLButtonElement) => {
    openerRef.current = el;
    setIndex(i);
    dialogRef.current?.showModal();
  };

  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => {
      setIndex(null);
      openerRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    dlg.addEventListener("close", onClose);
    dlg.addEventListener("keydown", onKey);
    return () => {
      dlg.removeEventListener("close", onClose);
      dlg.removeEventListener("keydown", onKey);
    };
  }, [step]);

  const current = index === null ? null : visible[index];
  const filters: Filter[] = ["All", ...categories];

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter photos by type of job">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="min-h-11 cursor-pointer rounded-full border-[1.5px] border-line bg-surface px-4 py-3 text-[0.95rem] font-semibold leading-none text-ink
              transition-[background-color,transform] duration-200 ease-out-soft active:scale-[.97]
              aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-on-dark"
          >
            {f}
            <span className="ml-1.5 font-medium opacity-60">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} photos{filter === "All" ? "" : ` of ${filter.toLowerCase()} work`}.
      </p>

      <ul className="columns-[300px] gap-4">
        {visible.map((p, i) => (
          <li key={p.id} className="mb-6 break-inside-avoid">
            <button
              type="button"
              onClick={(e) => open(i, e.currentTarget)}
              className="group block w-full cursor-zoom-in text-left"
            >
              <span
                className={`relative block overflow-hidden rounded-md bg-photo ${shapes[i % shapes.length]}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px"
                  className="zoom-img object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
                />
              </span>
              <span className="flex justify-between gap-3 px-1 pt-3 text-[0.95rem]">
                <b className="font-semibold">{p.title}</b>
                <span className="text-sm text-muted">{p.category}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox m-auto w-full max-w-[min(1200px,94vw)] bg-transparent p-0 text-on-dark backdrop:bg-ink/90"
        aria-label={current ? current.title : "Photo viewer"}
        onClick={(e) => e.target === dialogRef.current && close()}
      >
        <div className="on-dark">
          <div className="mb-3 flex justify-end gap-2">
            <LbButton label="Previous photo" glyph="←" onClick={() => step(-1)} />
            <LbButton label="Next photo" glyph="→" onClick={() => step(1)} />
            <LbButton label="Close" glyph="✕" onClick={() => close()} />
          </div>
          {current && (
            <figure className="m-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-ink-soft">
                <Image src={current.src} alt={current.alt} fill sizes="94vw" className="object-contain" />
              </div>
              <figcaption className="flex flex-wrap justify-between gap-4 px-1 py-4">
                <span>
                  <b className="font-semibold">{current.title}</b> · {current.category}
                </span>
                <a href={current.creditUrl} className="text-sm text-on-dark-muted">
                  Photo: {current.credit === "Pexels" ? "Pexels" : `${current.credit} / Pexels`}
                </a>
              </figcaption>
            </figure>
          )}
        </div>
      </dialog>
    </>
  );
}

function LbButton({ label, glyph, onClick }: { label: string; glyph: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="size-12 cursor-pointer rounded-full border-[1.5px] border-on-dark/40 text-xl text-on-dark hover:bg-on-dark/10"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
