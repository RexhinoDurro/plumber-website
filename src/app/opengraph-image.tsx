import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}: plumbing and heating, priced before we start`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          background: "#0a1a33", color: "#f3f7fc", padding: 72, fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 800 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#1257d6", display: "flex" }} />
          {site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
          <span>Plumbing fixed properly.</span>
          <span style={{ color: "#8cc0ff" }}>Priced before we start.</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b8c6da" }}>
          Leaks · Drains · Bathrooms · Kitchens · Heating · {site.city}
        </div>
      </div>
    ),
    size,
  );
}
