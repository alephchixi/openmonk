import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenMonk — Non-discursive sound companion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#000000",
          color: "#e0e0e0",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 72, letterSpacing: "0.08em", marginBottom: 16 }}>
          OpenMonk
        </div>
        <div style={{ fontSize: 20, opacity: 0.5, letterSpacing: "0.06em" }}>
          Non-discursive sound companion
        </div>
      </div>
    ),
    { ...size }
  );
}
