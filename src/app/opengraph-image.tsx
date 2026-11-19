import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}: licensed plumbers across ${site.city}, 24/7`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when someone shares a link to the site (WhatsApp, iMessage, Facebook…). */
export default async function OgImage() {
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/logo-full.png"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 56,
          background: "#0a1a33", color: "#f3f7fc", padding: "56px 72px", fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={520} height={336} alt="" style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 60, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
            <span>Licensed plumbers.</span>
            <span style={{ color: "#f5c04e" }}>All five boroughs.</span>
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>24/7 · {site.phone}</div>
        </div>
      </div>
    ),
    size,
  );
}
