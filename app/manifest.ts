import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Games-Trafics",
    short_name: "GTC",
    description:
      "Acheter, vendre, échanger et jouer. La marketplace gaming complète.",

    start_url: "/",
    scope: "/",

    display: "standalone",
    orientation: "portrait",

    background_color: "#0f0a1f",
    theme_color: "#7C3AED",

    categories: ["games", "entertainment", "shopping"],

    lang: "fr",

    icons: [
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/icon-192.png",
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
        src: "/screenshots/home.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/marketplace.png",
        sizes: "1280x720",
        type: "image/png",
      },
    ],

    shortcuts: [
      {
        name: "Marketplace",
        short_name: "Market",
        description: "Acheter et vendre des comptes gaming",
        url: "/marketplace",
        icons: [{ src: "/icons/market.png", sizes: "192x192" }],
      },
      {
        name: "Tournois",
        short_name: "Tournois",
        description: "Participer aux tournois",
        url: "/tournaments",
        icons: [{ src: "/icons/tournament.png", sizes: "192x192" }],
      },
      {
        name: "Communauté",
        short_name: "Social",
        description: "Reels et posts gaming",
        url: "/community",
        icons: [{ src: "/icons/community.png", sizes: "192x192" }],
      },
    ],
  };
}
