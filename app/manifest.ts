import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gram",
    short_name: "Gram",
    description: "친구들과 함께 기록하는 몸무게",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#FF6B9D",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
