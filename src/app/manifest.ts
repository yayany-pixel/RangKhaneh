import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rangkhaneh / رنگ‌خانه",
    short_name: "Rangkhaneh",
    description: "A private archive and argument workshop for Colors of Iran.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#f4efe6",
    lang: "en",
    dir: "auto",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
