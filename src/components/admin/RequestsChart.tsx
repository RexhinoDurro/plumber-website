"use client";

import { useState } from "react";

type Day = { date: string; leads: number; chats: number };

/** Bars per day (forms + chats). Hover or focus a bar for the breakdown; a table is there for screen readers. */
export function RequestsChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = days.map((d) => d.leads + d.chats);
  const max = Math.max(4, ...totals);
  const ticks = [0, Math.round(max / 2), max];
  const W = 640;
  const H = 220;
  const pad = { l: 28, r: 4, t: 8, b: 26 };
  const bw = (W - pad.l - pad.r) / days.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const label = (iso: string, short = false) =>
    new Date(iso + "T12:00:00").toLocaleDateString([], short ? { day: "numeric" } : { weekday: "short", day: "numeric", month: "short" });

  return (
    <figure className="relative m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="group" aria-label={`Requests per day, last 14 days. Total ${totals.reduce((a, b) => a + b, 0)}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t ? "3 4" : undefined} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const v = totals[i];
          const x = pad.l + i * bw + bw * 0.18;
          const w = bw * 0.64;
          const top = y(v);
          const today = i === days.length - 1;
          return (
            <g
              key={d.date}
              tabIndex={0}
              role="button"
              aria-label={`${label(d.date)}: ${v} requests (${d.leads} forms, ${d.chats} chats)`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="cursor-default outline-none"
            >
              {/* hit target bigger than the bar */}
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill={hover === i ? "var(--color-bg)" : "transparent"} />
              {v > 0 && (
                <path
                  d={`M${x},${y(0)} V${top + 4} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${y(0)} Z`}
                  fill={today ? "var(--color-brand)" : "color-mix(in oklch, var(--color-brand) 72%, white)"}
                />
              )}
              {(i % 2 === days.length % 2 || today) && (
                <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" className={`text-[11px] tabular-nums ${today ? "fill-ink font-semibold" : "fill-muted"}`}>
                  {today ? "Today" : label(d.date, true)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-sm bg-ink px-3 py-2 text-[0.8125rem] text-on-dark shadow-lift"
          style={{ left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%` }}
        >
          <b className="block">{label(days[hover].date)}</b>
          {totals[hover]} requests · {days[hover].leads} forms, {days[hover].chats} chats
        </div>
      )}
      <div className="sr-only">
        <table>
        <caption>Requests per day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Forms</th>
            <th>Chats</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{label(d.date)}</td>
              <td>{d.leads}</td>
              <td>{d.chats}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
