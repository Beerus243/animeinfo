import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const logoBuffer = await readFile(path.join(process.cwd(), "assets", "logo", "logo.png"));
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 44,
          background: "linear-gradient(135deg, #de5a24 0%, #1d7a62 100%)",
          padding: 16,
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18)",
        }}
      >
        <img
          alt=""
          src={logoDataUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 28,
          }}
        />
      </div>
    ),
    size,
  );
}