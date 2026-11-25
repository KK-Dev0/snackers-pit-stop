import type { MetadataRoute } from "next";

/** Static PWA manifest. Next.js serves this at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Snackers Pit Stop — meal planner",
    short_name: "Snackers",
    description:
      "Plan affordable meals around your diet, calories and pantry, then shop once.",
    lang: "en-IN",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#faf4e8",
    theme_color: "#faf4e8",
    categories: ["food", "lifestyle", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "This week's plan",
        short_name: "Plan",
        url: "/plan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Shopping list",
        short_name: "List",
        url: "/list",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
