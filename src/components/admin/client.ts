"use client";

import { API_URL } from "@/lib/api";

const KEY = "northline-admin";

export type AdminUser = { id: number; username: string; name: string };

export const auth = {
  get(): { token: string; user: AdminUser } | null {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {
      return null;
    }
  },
  set(v: { token: string; user: AdminUser }) {
    localStorage.setItem(KEY, JSON.stringify(v));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(typeof data === "object" && data && "detail" in data ? String((data as { detail: unknown }).detail) : `Error ${status}`);
  }
}

/** Fetch an admin endpoint with the staff token. A 401 signs the user out. */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const a = auth.get();
  const headers = new Headers(init.headers);
  if (a) headers.set("Authorization", `Token ${a.token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const r = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (r.status === 401) {
    auth.clear();
    window.location.assign("/admin/login");
    throw new ApiError(401, null);
  }
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, data);
  return data as T;
}

/** Turn a DRF error body into one readable line. */
export function errorText(e: unknown): string {
  if (e instanceof ApiError && e.data && typeof e.data === "object") {
    const first = Object.values(e.data as Record<string, unknown>)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

/** Upload with progress (fetch has no upload progress). */
export function upload<T>(path: string, form: FormData, onProgress: (pct: number) => void, method = "POST"): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_URL}${path}`);
    const a = auth.get();
    if (a) xhr.setRequestHeader("Authorization", `Token ${a.token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: unknown = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(xhr.status, data));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(form);
  });
}

// ---- shared types ----
export type Message = { id: number; sender: "visitor" | "admin"; body: string; created_at: string };
export type Conversation = {
  id: string;
  visitor_name: string;
  visitor_contact: string;
  page_url: string;
  status: "open" | "closed";
  unread_for_admin: number;
  first_admin_reply_at: string | null;
  last_message_at: string;
  created_at: string;
  last_message: Message | null;
  lead: string | null;
  demo: boolean;
};
export type LeadStatus = "new" | "contacted" | "quoted" | "booked" | "lost";
export type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  postcode: string;
  job: string;
  message: string;
  urgent: boolean;
  source: "hero" | "contact" | "chat";
  source_label: string;
  status: LeadStatus;
  notes: string;
  first_contacted_at: string | null;
  created_at: string;
  updated_at: string;
  demo: boolean;
};
export type MediaItem = {
  id: number;
  title: string;
  alt: string;
  category: string;
  kind: "image" | "video";
  external_url: string;
  credit: string;
  published: boolean;
  featured: boolean;
  order: number;
  created_at: string;
  media_url: string;
  poster_url: string;
};
export type Review = {
  id: number;
  name: string;
  place: string;
  job: string;
  quote: string;
  rating: number;
  source: string;
  source_url: string;
  consent: boolean;
  published: boolean;
  order: number;
  created_at: string;
  demo: boolean;
};

export const STATUSES: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "quoted", label: "Quoted" },
  { key: "booked", label: "Booked" },
  { key: "lost", label: "Lost" },
];

/** "4 min", "2 h", "3 d" since a time. */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}
