"use client";

import { useEffect, useState } from "react";

export function PWAClient() {
  const [canInstall, setCanInstall] = useState(false);
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "installed" | "ready" | "error">("idle");

  useEffect(() => {
    // Register service worker
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    function onBeforeInstallPrompt(e: any) {
      e.preventDefault();
      setPromptEvent(e);
      setCanInstall(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => setStatus("installed"));
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    setCanInstall(false);
    if (choice?.outcome === "accepted") setStatus("installed");
  }

  return (
    <div className="space-y-2 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-zinc-950">Install Kealee (PWA)</div>
          <div className="mt-1">
            Add to home screen for faster load and offline support.
          </div>
        </div>
        {canInstall ? (
          <button
            type="button"
            onClick={install}
            className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
          >
            Install
          </button>
        ) : null}
      </div>
      <div className="text-xs text-zinc-600">
        Status:{" "}
        <span className="font-black text-zinc-800">
          {status === "ready"
            ? "Offline cache ready"
            : status === "installed"
              ? "Installed"
              : status === "error"
                ? "Service worker error"
                : "Waiting…"}
        </span>
      </div>
    </div>
  );
}

