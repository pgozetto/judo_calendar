import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Judo Calendar",
    short_name: "Judo Calendar",
    description: "Seu diário inteligente de judô.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#b91c1c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
