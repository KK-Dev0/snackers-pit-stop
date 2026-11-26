"use client";

import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#faf4e8",
          color: "#1b2a22",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 32, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 20px", lineHeight: 1.5 }}>
            The app could not start. Your saved data is still on this device.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              background: "#1f4d3a",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
