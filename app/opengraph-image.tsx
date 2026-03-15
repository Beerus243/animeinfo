import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Manga Empire — Actualités manga et anime";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoBuffer = await readFile(path.join(process.cwd(), "assets", "logo", "logo.png"));
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f0a05 0%, #1a120b 50%, #0d1912 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -100,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(222,90,36,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            right: -80,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(53,141,123,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 80px",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Logo + brand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <img
              alt=""
              src={logoDataUrl}
              style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                borderRadius: 16,
              }}
            />
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#eb5e28",
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              Manga Empire
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              marginTop: 40,
              fontSize: 64,
              fontWeight: 800,
              color: "#f5f0e8",
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: -1,
            }}
          >
            Actualités manga & anime
          </h1>

          {/* Subtitle */}
          <p
            style={{
              marginTop: 24,
              fontSize: 26,
              color: "rgba(245,240,232,0.6)",
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            Sorties, tendances, recommandations — votre source éditoriale quotidienne.
          </p>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: "auto",
              paddingTop: 30,
            }}
          >
            <div
              style={{
                width: 40,
                height: 3,
                background: "#eb5e28",
                borderRadius: 2,
                display: "flex",
              }}
            />
            <span style={{ fontSize: 18, color: "rgba(245,240,232,0.4)", letterSpacing: 2 }}>
              mangaempire.vercel.app
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
