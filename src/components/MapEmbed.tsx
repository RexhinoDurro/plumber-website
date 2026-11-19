"use client";

import { useState } from "react";
import { site } from "@/content/site";

/**
 * Google map of the service area. Loads only when asked for: no Google cookies or
 * heavy scripts until the visitor wants the map (GDPR-friendly and faster).
 */
export function MapEmbed({ className = "" }: { className?: string }) {
  const [show, setShow] = useState(false);
  const q = encodeURIComponent(site.mapQuery);
  return (
    <div className={`relative overflow-hidden rounded-md rounded-bl-elbow bg-photo ${className}`}>
      {show ? (
        <iframe
          title={`Map of our service area around ${site.city}`}
          src={`https://www.google.com/maps?q=${q}&z=11&output=embed`}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="blueprint absolute inset-0 grid place-items-center p-6 text-center">
          <svg viewBox="0 0 200 140" className="absolute inset-0 size-full text-brand/25" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M0 40 C40 30 60 70 100 60 S160 20 200 35" />
            <path d="M0 100 C50 90 80 120 120 100 S170 80 200 95" />
            <path d="M60 0 C70 40 50 90 70 140" />
            <path d="M140 0 C130 50 150 90 135 140" />
          </svg>
          <div className="relative grid justify-items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-brand text-white shadow-lift">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.3" />
              </svg>
            </span>
            <button type="button" className="btn btn-secondary bg-surface" onClick={() => setShow(true)}>
              Show the map
            </button>
            <span className="text-[0.8125rem] text-muted">Loads Google Maps</span>
          </div>
        </div>
      )}
    </div>
  );
}
