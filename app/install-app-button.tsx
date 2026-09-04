"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, MoreVertical, X } from "lucide-react";

// Chrome/Edge fire this so a site can defer the install prompt into its own UI.
// It is not part of lib.dom, hence the local type.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  // Assume installed until the check runs, so the button never flashes in on
  // a device that already has it.
  const [isInstalled, setIsInstalled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Already launched from the home screen? Then there is nothing to offer.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS marks installed web apps with this non-standard flag.
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(standalone);
    if (standalone) return;

    // iOS Safari never fires beforeinstallprompt — installing there is always
    // manual via Share > Add to Home Screen, so detect it and explain instead.
    const ua = window.navigator.userAgent;
    setIsIOS(
      /iPad|iPhone|iPod/.test(ua) ||
        // iPadOS 13+ reports itself as a Mac.
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    const onBeforeInstall = (e: Event) => {
      // Suppress the browser's own banner so this button drives it instead.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // The event is single-use; the browser re-fires it if the user dismissed.
      setDeferredPrompt(null);
      if (outcome === "accepted") setIsInstalled(true);
      return;
    }
    // No native prompt available (iOS, or criteria not met yet) — explain how.
    setShowHelp(true);
  };

  const stepNumber = (n: string) => (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C1272D] text-[11px] font-bold text-white">
      {n}
    </span>
  );

  return (
    <>
      <button
        onClick={handleClick}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#C1272D] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#9E1B20]"
        title="Install this POS as an app"
      >
        <Download className="h-3.5 w-3.5" />
        Install App
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <h3 className="text-base font-black tracking-tight text-[#000000]">
                Install Daddy&apos;s Home POS
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-black text-white transition-colors hover:bg-black/80"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {isIOS ? (
                <>
                  <p className="mb-4 text-[13px] font-medium leading-relaxed text-[#4A4038]">
                    On iPhone and iPad, Safari never shows an install button.
                    Add it to your home screen manually:
                  </p>
                  <ol className="space-y-3 text-[13px] font-semibold text-[#000000]">
                    <li className="flex items-center gap-3">
                      {stepNumber("1")}
                      <span className="flex items-center gap-1.5">
                        Tap <Share className="h-4 w-4 text-[#C1272D]" /> Share
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      {stepNumber("2")}
                      <span className="flex flex-wrap items-center gap-1.5">
                        Choose{" "}
                        <SquarePlus className="h-4 w-4 text-[#C1272D]" /> Add to
                        Home Screen
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      {stepNumber("3")}
                      <span>Tap Add</span>
                    </li>
                  </ol>
                  <p className="mt-4 border-t border-black/10 pt-3 text-[11px] font-semibold text-[#6B5F52]">
                    Must be Safari — Chrome on iOS cannot add to the home
                    screen.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-4 text-[13px] font-medium leading-relaxed text-[#4A4038]">
                    Your browser has not offered an install prompt yet. You can
                    still install it from the browser menu:
                  </p>
                  <ol className="space-y-3 text-[13px] font-semibold text-[#000000]">
                    <li className="flex items-center gap-3">
                      {stepNumber("1")}
                      <span className="flex items-center gap-1.5">
                        Open the browser menu
                        <MoreVertical className="h-4 w-4 text-[#C1272D]" />
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      {stepNumber("2")}
                      <span>
                        Choose <b>Install app</b> or <b>Add to Home screen</b>
                      </span>
                    </li>
                  </ol>
                  <p className="mt-4 border-t border-black/10 pt-3 text-[11px] font-semibold text-[#6B5F52]">
                    Installing requires the site to be served over HTTPS.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
