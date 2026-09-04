"use client";

import { useEffect } from "react";

// Registers the network-only worker in public/sw.js so the POS is installable.
// Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // A worker served from a dev build would cache-bust on every reload and is
    // of no use locally, so only register it for real deployments.
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("Service worker registration failed:", err));
    };

    // Registering after load keeps the worker off the critical path.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
