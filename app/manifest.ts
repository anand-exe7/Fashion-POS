import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest by Next's file-based metadata convention.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daddy's Home POS",
    short_name: "DH POS",
    description: "Billing terminal and order dashboard for Daddy's Home.",
    // Open straight into the billing terminal rather than the public store page.
    start_url: "/pos/admin/secure/control-panel/daddys-home",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F5EFE6",
    theme_color: "#C1272D",
    categories: ["business", "productivity", "shopping"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
