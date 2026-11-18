"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { api, errorText, upload, type MediaItem } from "@/components/admin/client";

const CATEGORIES = ["Repairs", "Bathrooms", "Kitchens", "Heating", "Pipework"];
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime";

type Draft = { key: string; file: File; preview: string; title: string; alt: string; category: string; progress: number | null; error?: string };

export default function GalleryManager() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [over, setOver] = useState(false);
  const [view, setView] = useState<"all" | "live" | "hidden">("all");
  const [dragId, setDragId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api<MediaItem[]>("/api/admin/gallery/")
      .then(setItems)
      .catch(() => setItems((l) => l ?? []));
  }, []);
  useEffect(load, [load]);

  const addFiles = (files: FileList | File[]) => {
    const next: Draft[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPT.split(",").includes(file.type)) {
        toast({ title: `${file.name} can't be used`, body: "Upload JPG, PNG, WebP or AVIF photos, or MP4, WebM or MOV videos.", tone: "error" });
        continue;
      }
      next.push({
        key: `${file.name}-${file.size}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 80),
        alt: "",
        category: "Repairs",
        progress: null,
      });
    }
    setDrafts((d) => [...d, ...next]);
  };

  const patchDraft = (key: string, p: Partial<Draft>) => setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const uploadOne = async (d: Draft) => {
    if (d.alt.trim().length < 5) {
      patchDraft(d.key, { error: "Describe what it shows (at least a few words). It helps Google and people using screen readers." });
      return false;
    }
    const form = new FormData();
    form.append("file", d.file);
    form.append("title", d.title.trim() || "Recent job");
    form.append("alt", d.alt.trim());
    form.append("category", d.category);
    patchDraft(d.key, { progress: 0, error: undefined });
    try {
      const item = await upload<MediaItem>("/api/admin/gallery/", form, (p) => patchDraft(d.key, { progress: p }));
      setItems((l) => [item, ...(l ?? [])]);
      setDrafts((all) => all.filter((x) => x.key !== d.key));
      URL.revokeObjectURL(d.preview);
      return true;
    } catch (e) {
      patchDraft(d.key, { progress: null, error: errorText(e) });
      return false;
    }
  };

  const uploadAll = async () => {
    let ok = 0;
    for (const d of drafts) if (await uploadOne(d)) ok++;
    if (ok) toast({ title: `${ok} ${ok === 1 ? "item is" : "items are"} live on the website`, tone: "ok", href: "/gallery" });
  };

  const save = async (id: number, patch: Partial<MediaItem>, msg?: string) => {
    setItems((l) => l?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? l);
    try {
      await api(`/api/admin/gallery/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
      if (msg) toast({ title: msg, tone: "ok" });
    } catch (e) {
      toast({ title: "Couldn't save", body: errorText(e), tone: "error" });
      load();
    }
  };

  const remove = async (id: number) => {
    try {
      await api(`/api/admin/gallery/${id}/`, { method: "DELETE" });
      setItems((l) => l?.filter((x) => x.id !== id) ?? l);
      toast({ title: "Deleted from the gallery", tone: "ok" });
    } catch (e) {
      toast({ title: "Couldn't delete", body: errorText(e), tone: "error" });
    }
  };

  const drop = async (targetId: number) => {
    if (!items || dragId === null || dragId === targetId) return;
    const list = [...items];
    const from = list.findIndex((x) => x.id === dragId);
    const to = list.findIndex((x) => x.id === targetId);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setItems(list);
    setDragId(null);
    await api("/api/admin/gallery/reorder/", { method: "POST", body: JSON.stringify({ ids: list.map((x) => x.id) }) }).catch(() => load());
  };

  const move = (id: number, dir: -1 | 1) => {
    if (!items) return;
    const i = items.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const list = [...items];
    [list[i], list[j]] = [list[j], list[i]];
    setItems(list);
    api("/api/admin/gallery/reorder/", { method: "POST", body: JSON.stringify({ ids: list.map((x) => x.id) }) }).catch(() => load());
  };

  const shown = (items ?? []).filter((x) => (view === "all" ? true : view === "live" ? x.published : !x.published));
  const stockCount = (items ?? []).filter((x) => x.published && x.external_url.includes("pexels.com")).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageTitle title="Gallery" sub="Photos and videos of your jobs. Changes show on the website straight away.">
        <a href="/gallery" target="_blank" className="btn btn-secondary">
          View on website
        </a>
      </PageTitle>

      {/* ---- drop zone ---- */}
      <section
        aria-label="Upload photos and videos"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`grid justify-items-center gap-3 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 ${
          over ? "border-brand bg-brand/5" : "border-line bg-surface"
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-10 text-brand" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-[1.0625rem] font-semibold">Drop photos or videos here</p>
        <p className="text-[0.875rem] text-muted">JPG, PNG, WebP up to 15 MB · MP4, WebM, MOV up to 200 MB</p>
        <button type="button" className="btn mt-1" onClick={() => inputRef.current?.click()}>
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      {drafts.length > 0 && (
        <section className="admin-card grid gap-4 p-5" aria-label="Ready to upload">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold [font-stretch:110%]">Ready to upload ({drafts.length})</h2>
            <button type="button" className="btn" onClick={uploadAll}>
              Upload {drafts.length > 1 ? "all" : ""}
            </button>
          </div>
          <ul className="grid gap-3">
            {drafts.map((d) => (
              <li key={d.key} className="grid gap-4 rounded-sm border border-line p-3 sm:grid-cols-[120px_1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-photo">
                  {d.file.type.startsWith("video") ? (
                    <video src={d.preview} muted className="size-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.preview} alt="" className="size-full object-cover" />
                  )}
                  {d.progress !== null && (
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-ink/30">
                      <div className="h-full bg-brand transition-[width]" style={{ width: `${d.progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
                  <label className="grid gap-1 text-[0.8125rem] font-semibold">
                    Title
                    <input className="admin-input" value={d.title} maxLength={80} onChange={(e) => patchDraft(d.key, { title: e.target.value })} />
                  </label>
                  <label className="grid gap-1 text-[0.8125rem] font-semibold">
                    Type of job
                    <select className="admin-input" value={d.category} onChange={(e) => patchDraft(d.key, { category: e.target.value })}>
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[0.8125rem] font-semibold sm:col-span-2">
                    What does it show? <span className="font-normal text-muted">Required, for Google and screen readers</span>
                    <input
                      className="admin-input"
                      value={d.alt}
                      maxLength={200}
                      placeholder="e.g. New walk-in shower with grey tiles and a brass rain head"
                      aria-invalid={d.error ? true : undefined}
                      onChange={(e) => patchDraft(d.key, { alt: e.target.value, error: undefined })}
                    />
                  </label>
                  {d.error && (
                    <p role="alert" className="text-[0.8125rem] font-medium text-danger sm:col-span-2">
                      {d.error}
                    </p>
                  )}
                  <div className="flex gap-3 sm:col-span-2">
                    <button type="button" className="text-[0.875rem] font-semibold text-water" onClick={() => uploadOne(d)} disabled={d.progress !== null}>
                      {d.progress !== null ? `Uploading ${d.progress}%` : "Upload this one"}
                    </button>
                    <button
                      type="button"
                      className="text-[0.875rem] text-muted underline"
                      onClick={() => {
                        URL.revokeObjectURL(d.preview);
                        setDrafts((all) => all.filter((x) => x.key !== d.key));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stockCount > 0 && (
        <p className="rounded-sm bg-[#fff7ea] px-4 py-3 text-[0.9375rem] text-[#5c3a00]">
          {stockCount} live items are free stock photos (Pexels) used as placeholders. Upload your own jobs, then hide these with the “On website” switch.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1" role="tablist" aria-label="Show">
          {(["all", "live", "hidden"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className="min-h-9 cursor-pointer rounded-full px-3 text-[0.875rem] font-semibold text-muted aria-selected:bg-ink aria-selected:text-white"
            >
              {{ all: "All", live: "On website", hidden: "Hidden" }[v]}
            </button>
          ))}
        </div>
        <p className="hidden text-[0.8125rem] text-muted sm:block">Drag to change the order on the website.</p>
      </div>

      {items !== null && items.length === 0 ? (
        <EmptyState title="Nothing in the gallery yet" text="Upload a few photos of recent jobs. Real work builds far more trust than stock photos." />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {items === null && Array.from({ length: 8 }, (_, i) => <li key={i} className="aspect-[4/5] animate-pulse rounded-md bg-surface" />)}
          {shown.map((m) => (
            <li
              key={m.id}
              draggable
              onDragStart={() => setDragId(m.id)}
              onDragOver={(e) => dragId !== null && e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                drop(m.id);
              }}
              onDragEnd={() => setDragId(null)}
              className={`admin-card overflow-hidden transition-opacity ${dragId === m.id ? "opacity-40" : ""} ${m.published ? "" : "opacity-70"}`}
            >
              <div className="relative aspect-[4/3] cursor-grab bg-photo active:cursor-grabbing">
                {m.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.poster_url} alt={m.alt} className="size-full object-cover" loading="lazy" />
                ) : (
                  <video src={`${m.media_url}#t=0.5`} muted preload="metadata" className="size-full object-cover" aria-label={m.alt} />
                )}
                <span className="absolute left-2 top-2 flex gap-1">
                  {m.kind === "video" && <span className="chip bg-ink/85 text-white">Video</span>}
                  {!m.published && <span className="chip bg-surface text-muted">Hidden</span>}
                  {m.featured && <span className="chip bg-brand text-white">Home page</span>}
                </span>
              </div>
              <div className="grid gap-2 p-3">
                <input
                  aria-label="Title"
                  defaultValue={m.title}
                  maxLength={80}
                  onBlur={(e) => e.target.value !== m.title && save(m.id, { title: e.target.value }, "Title saved")}
                  className="rounded-sm border border-transparent px-1 py-0.5 font-semibold hover:border-line focus:border-brand focus:outline-none"
                />
                <select
                  aria-label="Type of job"
                  value={m.category}
                  onChange={(e) => save(m.id, { category: e.target.value })}
                  className="rounded-sm border border-transparent bg-transparent px-1 text-[0.8125rem] text-muted hover:border-line"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="grid gap-1.5 border-t border-line pt-2 text-[0.8125rem]">
                  <label className="flex items-center justify-between">
                    On website
                    <input type="checkbox" role="switch" className="switch switch-light" checked={m.published} onChange={(e) => save(m.id, { published: e.target.checked }, e.target.checked ? "Now on the website" : "Hidden from the website")} />
                  </label>
                  <label className="flex items-center justify-between">
                    Show on home page
                    <input type="checkbox" role="switch" className="switch switch-light" checked={m.featured} onChange={(e) => save(m.id, { featured: e.target.checked })} />
                  </label>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="flex gap-1">
                    <button type="button" aria-label={`Move ${m.title} earlier`} onClick={() => move(m.id, -1)} className="grid size-8 cursor-pointer place-items-center rounded-full text-muted hover:bg-bg">
                      ←
                    </button>
                    <button type="button" aria-label={`Move ${m.title} later`} onClick={() => move(m.id, 1)} className="grid size-8 cursor-pointer place-items-center rounded-full text-muted hover:bg-bg">
                      →
                    </button>
                  </span>
                  <DeleteButton onConfirm={() => remove(m.id)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="flex items-center gap-2 text-[0.8125rem]">
      <button type="button" className="cursor-pointer font-semibold text-danger" onClick={onConfirm}>
        Delete
      </button>
      <button type="button" className="cursor-pointer text-muted" onClick={() => setAsk(false)}>
        Keep
      </button>
    </span>
  ) : (
    <button type="button" className="cursor-pointer text-[0.8125rem] text-muted underline underline-offset-2 hover:text-danger" onClick={() => setAsk(true)}>
      Delete
    </button>
  );
}
