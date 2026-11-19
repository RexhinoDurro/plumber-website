"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** "18:00" → "6 PM", "07:30" → "7:30 AM" (US style). */
const clock = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
};

/** Current day/minute in the business's time zone (not the visitor's). */
function nowInZone() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: site.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: DAYS.indexOf(get("weekday")), min: Number(get("hour")) * 60 + Number(get("minute")) };
}

function statusText(): { open: boolean; text: string } {
  const { day, min } = nowInZone();
  const today = site.openingHours.find((h) => h.day === day);
  if (today && min >= toMin(today.open) && min < toMin(today.close)) {
    return { open: true, text: `Open now · until ${clock(today.close)}` };
  }
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7;
    const h = site.openingHours.find((x) => x.day === d);
    if (!h) continue;
    if (i === 0 && min >= toMin(h.open)) continue;
    const when = i === 0 ? `today ${clock(h.open)}` : i === 1 ? `tomorrow ${clock(h.open)}` : `${DAYS[d]} ${clock(h.open)}`;
    return { open: false, text: `Office opens ${when}` };
  }
  return { open: false, text: "Office closed" };
}

/** Live office status. Server render shows a neutral line; the real status fills in on the client. */
export function OpenStatus() {
  const [s, setS] = useState<{ open: boolean; text: string } | null>(null);

  useEffect(() => {
    const tick = () => setS(statusText());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <span className="relative inline-flex size-2" aria-hidden="true">
        {s?.open && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-60 motion-reduce:hidden" />}
        <span className={`relative inline-flex size-2 rounded-full ${s ? (s.open ? "bg-[#4ade80]" : "bg-on-dark-muted") : "bg-sky"}`} />
      </span>
      {s ? s.text : "Office hours"}
    </span>
  );
}
