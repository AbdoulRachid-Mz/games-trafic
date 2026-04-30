import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Games-Trafics",
    short_name: "Games-Trafics",
    description: "Acheter, vendre, échanger et jouer. La marketplace gaming complète.",

    start_url: "/",
    scope: "/",

    display: "standalone",
    orientation: "portrait",

    // background_color: "#0f0a1f",
    background_color: "#ffffff",
    theme_color: "#7C3AED",
    display_override: ["standalone", "window-controls-overlay"],

    categories: ["games", "entertainment", "shopping"],

    lang: "fr",

    icons: [
      {
        src: "/icons/gt-primary.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/gt-primary.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/gt-primary.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/gt-primary.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/gt-primary.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    screenshots: [
      {
        src: "/icons/gt-controller-600.png",
        sizes: "600x600",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/marketplace.png",
        sizes: "1920x2060",
        type: "image/png",
      },
    ],

    shortcuts: [
      {
        name: "Games-Trafics",
        short_name: "Games-Trafics",
        description: "Acheter, vendre, échanger et jouer. La marketplace gaming complète.",
        url: "/",
        icons: [{ src: "/icons/gt-primary.png", sizes: "500x536", type: "image/png" }],
      },
      {
        name: "Tournois",
        short_name: "Tournois",
        description: "Participer aux tournois",
        url: "/tournaments",
        icons: [{ src: "/icons/tournament-500.png", sizes: "500x504", type: "image/png" }],
      },
      {
        name: "Communauté",
        short_name: "Social",
        description: "Reels et posts gaming",
        url: "/community",
        icons: [{ src: "/icons/avatar-500.png", sizes: "500x500", type: "image/png" }],
      },
    ],
  };
}
