"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";

import { PWAClient } from "@/components/portal/PWAClient";
import { api } from "@/lib/api";

type Tab = "photos" | "daily" | "deliveries" | "weather" | "inspection" | "notifications";

type PhotoEntry = {
  id: string;
  at: string;
  projectId: string;
  note: string;
  dataUrl: string; // local preview (MVP) or empty when loaded from backend
  url?: string; // backend URL
  category?: string;
  gps?: { lat: number; lng: number; accuracy?: number } | null;
  _fromServer?: boolean; // tracks whether this record exists on the backend
};

type DailyLogEntry = {
  id: string;
  at: string;
  projectId: string;
  weatherNote: string;
  laborCount: number | null;
  notes: string;
  hoursWorked?: number | null;
  issues?: string;
  subsOnSite?: string;
  _fromServer?: boolean; // tracks whether this record exists on the backend
};

type DeliveryEntry = {
  id: string;
  etaDate: string; // YYYY-MM-DD
  projectId: string;
  vendor: string;
  material: string;
  status: "Scheduled" | "Arrived" | "Delayed";
  note: string;
};

type ChecklistItem = { id: string; text: string; done: boolean };

const STORAGE = {
  photos: "kealee:site-tools:photos:v1",
  daily: "kealee:site-tools:daily:v1",
  deliveries: "kealee:site-tools:deliveries:v1",
  checklist: "kealee:site-tools:inspection:v1",
  notifPrefs: "kealee:site-tools:notifs:v1",
} as const;

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-black text-zinc-700">
      {children}
    </span>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readFileAsDataUrl(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return `data:${file.type || "image/jpeg"};base64,${base64}`;
}

async function getGPS(): Promise<{ lat: number; lng: number; accuracy?: number } | null> {
  if (!("geolocation" in navigator)) return null;
  return await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SiteToolsPage() {
  const projects = useMemo(
    () => [
      { id: "p1", name: "123 Main St Remodel" },
      { id: "p2", name: "Oak Ridge Custom Build" },
      { id: "p3", name: "Downtown Tenant Improvement" },
    ],
    []
  );

  const [tab, setTab] = useState<Tab>("photos");
  const [projectId, setProjectId] = useState(projects[0]?.id || "p1");

  // Offline indicator
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Photos
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoNote, setPhotoNote] = useState("");
  const [gpsOptIn, setGpsOptIn] = useState(true);

  // Daily log
  const [daily, setDaily] = useState<DailyLogEntry[]>([]);
  const [dailyWeather, setDailyWeather] = useState("");
  const [dailyLabor, setDailyLabor] = useState<number | null>(null);
  const [dailyNotes, setDailyNotes] = useState("");

  // Deliveries
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([]);
  const [delEta, setDelEta] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [delVendor, setDelVendor] = useState("");
  const [delMaterial, setDelMaterial] = useState("");
  const [delStatus, setDelStatus] = useState<DeliveryEntry["status"]>("Scheduled");
  const [delNote, setDelNote] = useState("");

  // Inspection checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheck, setNewCheck] = useState("");

  // Notifications prefs (MVP)
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTypes, setNotifTypes] = useState({
    inspectionScheduled: true,
    permitApproved: true,
    subArrived: true,
    weatherDelay: true,
  });

  // Weather
  const [weather, setWeather] = useState<{ summary: string; tempF?: number; windMph?: number } | null>(null);
  const [weatherLoc, setWeatherLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Backend sync state
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [logSummary, setLogSummary] = useState<{ totalLogs?: number; totalHours?: number; avgCrew?: number } | null>(null);

  // Fetch daily logs from backend when project changes
  const fetchDailyLogs = useCallback(async (pid: string) => {
    setLoadingLogs(true);
    try {
      const result = await api.listDailyLogs({ projectId: pid, limit: 50 });
      if (result.dailyLogs && result.dailyLogs.length > 0) {
        const mapped: DailyLogEntry[] = result.dailyLogs.map((log: any) => ({
          id: log.id,
          at: log.createdAt || log.date || new Date().toISOString(),
          projectId: log.projectId || pid,
          weatherNote: log.weather || "",
          laborCount: log.crewCount ?? null,
          notes: log.workPerformed || log.progressNotes || "",
          hoursWorked: log.hoursWorked ?? null,
          issues: log.issues || "",
          subsOnSite: log.subsOnSite || "",
          _fromServer: true,
        }));
        setDaily(mapped);
      }
    } catch {
      // Fallback: keep localStorage data if API fails (offline mode)
    } finally {
      setLoadingLogs(false);
    }
    // Also fetch summary
    try {
      const summaryResult = await api.getDailyLogProjectSummary(pid);
      if (summaryResult.summary) setLogSummary(summaryResult.summary);
    } catch {
      // ignore
    }
  }, []);

  // Fetch photos from backend when project changes
  const fetchPhotos = useCallback(async (pid: string) => {
    setLoadingPhotos(true);
    try {
      const result = await api.listPhotos({ projectId: pid });
      if (result.photos && result.photos.length > 0) {
        const mapped: PhotoEntry[] = result.photos.map((photo: any) => ({
          id: photo.id,
          at: photo.createdAt || new Date().toISOString(),
          projectId: photo.projectId || pid,
          note: photo.caption || "",
          dataUrl: "", // server photos don't have local dataUrl
          url: photo.url || "",
          category: photo.category || "",
          gps: null,
          _fromServer: true,
        }));
        setPhotos(mapped);
      }
    } catch {
      // Fallback: keep localStorage data if API fails (offline mode)
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  // Fetch backend data when project changes
  useEffect(() => {
    if (online && projectId) {
      fetchDailyLogs(projectId);
      fetchPhotos(projectId);
    }
  }, [projectId, online, fetchDailyLogs, fetchPhotos]);

  // Load persisted data (offline fallback — loads first, backend overwrites if online)
  useEffect(() => {
    try {
      const p = localStorage.getItem(STORAGE.photos);
      const d = localStorage.getItem(STORAGE.daily);
      const del = localStorage.getItem(STORAGE.deliveries);
      const c = localStorage.getItem(STORAGE.checklist);
      const n = localStorage.getItem(STORAGE.notifPrefs);
      if (p) setPhotos(JSON.parse(p));
      if (d) setDaily(JSON.parse(d));
      if (del) setDeliveries(JSON.parse(del));
      if (c) setChecklist(JSON.parse(c));
      if (n) {
        const parsed = JSON.parse(n) as any;
        setNotifEnabled(!!parsed.enabled);
        if (parsed.types) setNotifTypes(parsed.types);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.photos, JSON.stringify(photos));
      localStorage.setItem(STORAGE.daily, JSON.stringify(daily));
      localStorage.setItem(STORAGE.deliveries, JSON.stringify(deliveries));
      localStorage.setItem(STORAGE.checklist, JSON.stringify(checklist));
      localStorage.setItem(STORAGE.notifPrefs, JSON.stringify({ enabled: notifEnabled, types: notifTypes }));
    } catch {
      // ignore
    }
  }, [photos, daily, deliveries, checklist, notifEnabled, notifTypes]);

  // Weather fetch (Open-Meteo, no key) using GPS
  async function refreshWeather() {
    const pos = await getGPS();
    if (!pos) {
      setWeather({ summary: "GPS unavailable (enable location to show site weather)" });
      return;
    }
    setWeatherLoc({ lat: pos.lat, lng: pos.lng });
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lng}` +
        `&current=temperature_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;
      const res = await fetch(url);
      const data = (await res.json()) as any;
      const tempF = data?.current?.temperature_2m;
      const windMph = data?.current?.wind_speed_10m;
      const code = data?.current?.weather_code;
      const summary = typeof code === "number" ? `Weather code ${code}` : "Weather";
      setWeather({ summary, tempF, windMph });
    } catch {
      setWeather({ summary: "Unable to fetch weather (offline?)" });
    }
  }

  async function addPhoto(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    const gps = gpsOptIn ? await getGPS() : null;
    const caption = photoNote.trim();

    // Optimistic local entry (shown immediately)
    const localEntry: PhotoEntry = {
      id: `ph_${Date.now()}`,
      at: new Date().toISOString(),
      projectId,
      note: caption,
      dataUrl,
      gps,
      _fromServer: false,
    };
    setPhotos((prev) => [localEntry, ...prev]);
    setPhotoNote("");

    // Try saving to backend
    if (online) {
      setSavingPhoto(true);
      try {
        // In a production app you'd upload the file to cloud storage first
        // and get a URL back. For now we pass the dataUrl as the URL.
        const result = await api.createPhoto({
          projectId,
          url: dataUrl,
          caption,
          category: "site-photo",
        });
        // Replace local entry with server-confirmed entry
        if (result.photo) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === localEntry.id
                ? {
                    ...p,
                    id: result.photo.id || p.id,
                    url: result.photo.url || p.dataUrl,
                    _fromServer: true,
                  }
                : p
            )
          );
        }
      } catch {
        // Keep local entry — will be synced later
      } finally {
        setSavingPhoto(false);
      }
    } else {
      // Queue for background sync when offline
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        const reg = await navigator.serviceWorker.getRegistration();
        await reg?.sync.register("kealee-sync").catch(() => undefined);
      }
    }
  }

  async function addDailyLog() {
    const workPerformed = dailyNotes.trim();
    if (!workPerformed) return;

    // Optimistic local entry
    const localEntry: DailyLogEntry = {
      id: `dl_${Date.now()}`,
      at: new Date().toISOString(),
      projectId,
      weatherNote: dailyWeather.trim(),
      laborCount: dailyLabor,
      notes: workPerformed,
      _fromServer: false,
    };
    setDaily((prev) => [localEntry, ...prev]);
    setDailyWeather("");
    setDailyLabor(null);
    setDailyNotes("");

    // Try saving to backend
    if (online) {
      setSavingLog(true);
      try {
        const result = await api.createDailyLog({
          projectId,
          workPerformed,
          crewCount: dailyLabor ?? undefined,
          weather: localEntry.weatherNote || undefined,
        });
        // Replace local entry with server-confirmed entry
        if (result.dailyLog) {
          setDaily((prev) =>
            prev.map((d) =>
              d.id === localEntry.id
                ? {
                    ...d,
                    id: result.dailyLog.id || d.id,
                    _fromServer: true,
                  }
                : d
            )
          );
          // Refresh summary
          api.getDailyLogProjectSummary(projectId)
            .then((s) => { if (s.summary) setLogSummary(s.summary); })
            .catch(() => {});
        }
      } catch {
        // Keep local entry — will be synced later
      } finally {
        setSavingLog(false);
      }
    }
  }

  function addDelivery() {
    const entry: DeliveryEntry = {
      id: `dv_${Date.now()}`,
      etaDate: delEta,
      projectId,
      vendor: delVendor.trim(),
      material: delMaterial.trim(),
      status: delStatus,
      note: delNote.trim(),
    };
    setDeliveries((prev) => [entry, ...prev]);
    setDelVendor("");
    setDelMaterial("");
    setDelStatus("Scheduled");
    setDelNote("");
  }

  function toggleChecklist(id: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  }

  function addChecklistItem() {
    const t = newCheck.trim();
    if (t.length < 2) return;
    setChecklist((prev) => [{ id: `ci_${Date.now()}`, text: t, done: false }, ...prev]);
    setNewCheck("");
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }
    const res = await Notification.requestPermission();
    if (res !== "granted") {
      alert("Notification permission not granted.");
      return;
    }
    setNotifEnabled(true);

    // Basic “works offline” test notification (no server push required)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.showNotification("Kealee notifications enabled", {
        body: "You’ll see site updates here. (True push requires server setup.)",
        icon: "/icons/kealee-gc.svg",
      });
    } else {
      new Notification("Kealee notifications enabled", {
        body: "You’ll see site updates here. (True push requires server setup.)",
      });
    }
  }

  async function subscribeToPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push is not supported in this browser.");
      return;
    }
    if (Notification.permission !== "granted") {
      alert("Enable notifications first.");
      return;
    }
    const vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
    if (!vapidPublicKey) {
      alert(
        "Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY. Add it to enable real push subscriptions."
      );
      return;
    }

    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      alert("Service worker not registered yet.");
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // MVP: store locally and show JSON for wiring to backend storage.
    try {
      localStorage.setItem("kealee:push-subscription:v1", JSON.stringify(sub));
    } catch {
      // ignore
    }
    alert("Push subscription created (stored locally). Next step: POST it to your API.");
  }

  function testSiteNotification(kind: keyof typeof notifTypes) {
    const map: Record<string, { title: string; body: string }> = {
      inspectionScheduled: { title: "Inspection scheduled for tomorrow", body: "Tap to review schedule and checklist." },
      permitApproved: { title: "Permit approved", body: "Permit status updated—ready to proceed." },
      subArrived: { title: "Subcontractor arrived on site", body: "Arrival logged for today." },
      weatherDelay: { title: "Weather delay warning", body: "Conditions may impact schedule today." },
    };
    const msg = map[kind];
    if (!msg) return;
    if (!notifEnabled || Notification.permission !== "granted") {
      alert("Enable notifications first.");
      return;
    }
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.showNotification(msg.title, {
        body: msg.body,
        icon: "/icons/kealee-gc.svg",
        data: { url: "/portal/site-tools" },
      });
    });
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "photos", label: "Photos" },
    { key: "daily", label: "Daily log" },
    { key: "deliveries", label: "Deliveries" },
    { key: "weather", label: "Weather" },
    { key: "inspection", label: "Inspection" },
    { key: "notifications", label: "Alerts" },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Site tools</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-700">
            Built for job sites: big tap targets, camera-first capture, and offline-first notes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>{online ? "Online" : "Offline (saving locally)"}</Pill>
            <Pill>Glove-friendly</Pill>
            <Pill>Camera + GPS</Pill>
          </div>
        </div>
        <Link
          href="/portal"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Back to dashboard
        </Link>
      </header>

      <PWAClient />

      <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-2">
          <label className="text-xs font-black text-zinc-700">
            Project
            <select
              className="ml-2 h-11 rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  "h-11 rounded-full px-4 text-sm font-black",
                  tab === t.key
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "bg-zinc-50 text-zinc-800 border border-black/10 hover:bg-zinc-100",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "photos" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Photo upload (camera-first)</div>
            <p className="mt-1 text-sm text-zinc-700">
              Works best on mobile. Photos sync to the server when online.
            </p>
            {savingPhoto && (
              <div className="mt-2 text-xs font-black text-sky-600">Saving photo...</div>
            )}

            <label className="mt-4 block text-xs font-black text-zinc-700">
              Note (optional)
              <input
                className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="e.g. electrical rough-in complete"
              />
            </label>

            <label className="mt-3 flex items-center gap-2 text-sm font-black text-zinc-800">
              <input type="checkbox" checked={gpsOptIn} onChange={(e) => setGpsOptIn(e.target.checked)} />
              GPS tagging (recommended)
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Capture / upload</span>
                <input
                  className="h-12 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    await addPhoto(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  const gps = await getGPS();
                  alert(gps ? `GPS ok: ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "GPS unavailable");
                }}
                className="h-12 rounded-xl border border-black/10 bg-white px-4 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Test GPS
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black tracking-tight">Recent photos</div>
                <div className="mt-1 text-sm text-zinc-700">
                  {loadingPhotos ? "Loading..." : `${photos.filter((p) => p.projectId === projectId).length} for this project`}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchPhotos(projectId)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((p) => p.projectId !== projectId))}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-800 hover:bg-red-100"
                >
                  Clear local
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {loadingPhotos ? (
                <div className="text-sm text-zinc-500">Loading photos from server...</div>
              ) : null}
              {photos
                .filter((p) => p.projectId === projectId)
                .slice(0, 10)
                .map((p) => (
                  <div key={p.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
                      <span className="font-black text-zinc-800">{formatDateTime(p.at)}</span>
                      <div className="flex items-center gap-2">
                        {p._fromServer ? (
                          <span className="text-emerald-600">Synced</span>
                        ) : (
                          <span className="text-amber-600">Local only</span>
                        )}
                        {p.gps ? (
                          <span>
                            GPS: {p.gps.lat.toFixed(4)}, {p.gps.lng.toFixed(4)}
                          </span>
                        ) : (
                          <span>GPS: —</span>
                        )}
                      </div>
                    </div>
                    {(p.note || p.category) ? (
                      <div className="mt-1 flex items-center gap-2">
                        {p.note ? <span className="text-sm font-black text-zinc-900">{p.note}</span> : null}
                        {p.category ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700">{p.category}</span> : null}
                      </div>
                    ) : null}
                    {(p.url || p.dataUrl) ? (
                      <img
                        src={p.url || p.dataUrl}
                        alt="Site photo"
                        className="mt-2 w-full rounded-xl border border-black/10"
                      />
                    ) : (
                      <div className="mt-2 flex h-32 items-center justify-center rounded-xl border border-dashed border-black/10 bg-zinc-100 text-sm text-zinc-500">
                        Photo (server URL)
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (p._fromServer && online) {
                          try { await api.deletePhoto(p.id); } catch { /* ignore */ }
                        }
                        setPhotos((prev) => prev.filter((x) => x.id !== p.id));
                      }}
                      className="mt-2 h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-800 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              {!loadingPhotos && !photos.filter((p) => p.projectId === projectId).length ? (
                <div className="text-sm text-zinc-700">No photos yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "daily" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Daily log</div>
            <p className="mt-1 text-sm text-zinc-700">
              Quick field entry. Syncs to the server when online, saved locally when offline.
            </p>
            {savingLog && (
              <div className="mt-2 text-xs font-black text-sky-600">Saving to server...</div>
            )}

            {/* Project summary stats */}
            {logSummary && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-black/10 bg-zinc-50 p-2.5 text-center">
                  <div className="text-xs text-zinc-500">Total logs</div>
                  <div className="text-sm font-black text-zinc-900">{logSummary.totalLogs ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-zinc-50 p-2.5 text-center">
                  <div className="text-xs text-zinc-500">Total hours</div>
                  <div className="text-sm font-black text-zinc-900">{logSummary.totalHours ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-zinc-50 p-2.5 text-center">
                  <div className="text-xs text-zinc-500">Avg crew</div>
                  <div className="text-sm font-black text-zinc-900">{logSummary.avgCrew ?? "—"}</div>
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Weather note (optional)</span>
                <input
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={dailyWeather}
                  onChange={(e) => setDailyWeather(e.target.value)}
                  placeholder="e.g. light rain after 2pm"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Crew count (optional)</span>
                <input
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  type="number"
                  min={0}
                  value={dailyLabor ?? ""}
                  onChange={(e) => setDailyLabor(e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="e.g. 8"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Work performed / notes</span>
                <textarea
                  className="min-h-[130px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  placeholder="What happened today? blockers? inspections? photos taken?"
                />
              </label>
              <button
                type="button"
                onClick={addDailyLog}
                disabled={savingLog}
                className="h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
              >
                {savingLog ? "Saving..." : "Save daily log"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="text-lg font-black tracking-tight">Recent logs</div>
              <button
                type="button"
                onClick={() => fetchDailyLogs(projectId)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Refresh
              </button>
            </div>
            {loadingLogs && (
              <div className="mt-2 text-xs text-zinc-500">Loading logs from server...</div>
            )}
            <div className="mt-4 space-y-3">
              {daily
                .filter((d) => d.projectId === projectId)
                .slice(0, 12)
                .map((d) => (
                  <div key={d.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-zinc-600">{formatDateTime(d.at)}</div>
                      <div className="flex items-center gap-2">
                        {d._fromServer ? (
                          <span className="text-[10px] font-black text-emerald-600">Synced</span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-600">Local</span>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (d._fromServer && online) {
                              try { await api.deleteDailyLog(d.id); } catch { /* ignore */ }
                            }
                            setDaily((prev) => prev.filter((x) => x.id !== d.id));
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-black text-red-800 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-zinc-800">
                      <div>
                        <span className="font-black">Crew:</span> {d.laborCount ?? "—"}
                      </div>
                      <div>
                        <span className="font-black">Weather:</span> {d.weatherNote || "—"}
                      </div>
                      {d.issues ? (
                        <div>
                          <span className="font-black">Issues:</span> {d.issues}
                        </div>
                      ) : null}
                      {d.subsOnSite ? (
                        <div>
                          <span className="font-black">Subs on site:</span> {d.subsOnSite}
                        </div>
                      ) : null}
                      <div className="whitespace-pre-wrap">
                        <span className="font-black">Notes:</span>{" "}
                        {d.notes || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              {!loadingLogs && !daily.filter((d) => d.projectId === projectId).length ? (
                <div className="text-sm text-zinc-700">No daily logs yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "deliveries" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Material delivery tracking</div>
            <p className="mt-1 text-sm text-zinc-700">Track ETAs and arrivals.</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">ETA date</span>
                <input
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm"
                  type="date"
                  value={delEta}
                  onChange={(e) => setDelEta(e.target.value)}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Vendor</span>
                <input
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm"
                  value={delVendor}
                  onChange={(e) => setDelVendor(e.target.value)}
                  placeholder="ABC Supply"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Material</span>
                <input
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm"
                  value={delMaterial}
                  onChange={(e) => setDelMaterial(e.target.value)}
                  placeholder="Drywall (200 sheets)"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Status</span>
                <select
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900"
                  value={delStatus}
                  onChange={(e) => setDelStatus(e.target.value as any)}
                >
                  <option>Scheduled</option>
                  <option>Arrived</option>
                  <option>Delayed</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-zinc-700">Note (optional)</span>
                <input
                  className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm"
                  value={delNote}
                  onChange={(e) => setDelNote(e.target.value)}
                  placeholder="Gate code 1234"
                />
              </label>
              <button
                type="button"
                onClick={addDelivery}
                className="h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
              >
                Add delivery
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Upcoming & recent</div>
            <div className="mt-4 space-y-3">
              {deliveries
                .filter((d) => d.projectId === projectId)
                .slice(0, 20)
                .map((d) => (
                  <div key={d.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="text-sm font-black text-zinc-950">{d.material || "Delivery"}</div>
                      <Pill>{d.status}</Pill>
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      ETA: <span className="font-black text-zinc-900">{d.etaDate}</span> • {d.vendor || "—"}
                    </div>
                    {d.note ? <div className="mt-2 text-sm text-zinc-800">{d.note}</div> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveries((prev) =>
                            prev.map((x) => (x.id === d.id ? { ...x, status: "Arrived" } : x))
                          )
                        }
                        className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                      >
                        Mark arrived
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveries((prev) =>
                            prev.map((x) => (x.id === d.id ? { ...x, status: "Delayed" } : x))
                          )
                        }
                        className="h-11 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-black text-amber-900 hover:bg-amber-100"
                      >
                        Mark delayed
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveries((prev) => prev.filter((x) => x.id !== d.id))}
                        className="h-11 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-black text-red-800 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              {!deliveries.filter((d) => d.projectId === projectId).length ? (
                <div className="text-sm text-zinc-700">No deliveries tracked yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "weather" ? (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-black tracking-tight">Weather (site)</div>
              <div className="mt-1 text-sm text-zinc-700">
                Uses GPS + Open-Meteo. Great for heads-up delays.
              </div>
            </div>
            <button
              type="button"
              onClick={refreshWeather}
              className="h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
            >
              Refresh weather
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-xs font-semibold text-zinc-600">Location</div>
              <div className="mt-1 text-sm font-black text-zinc-950">
                {weatherLoc ? `${weatherLoc.lat.toFixed(3)}, ${weatherLoc.lng.toFixed(3)}` : "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-xs font-semibold text-zinc-600">Temperature</div>
              <div className="mt-1 text-sm font-black text-zinc-950">
                {typeof weather?.tempF === "number" ? `${weather.tempF.toFixed(0)}°F` : "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-xs font-semibold text-zinc-600">Wind</div>
              <div className="mt-1 text-sm font-black text-zinc-950">
                {typeof weather?.windMph === "number" ? `${weather.windMph.toFixed(0)} mph` : "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div className="font-black text-zinc-900">Summary</div>
            <div className="mt-1">{weather?.summary || "Tap refresh to fetch current conditions."}</div>
          </div>
        </div>
      ) : null}

      {tab === "inspection" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Quick inspection checklist</div>
            <p className="mt-1 text-sm text-zinc-700">
              Tap checklist items with gloves. Saved offline.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                className="h-12 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                placeholder="Add checklist item…"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
              >
                Add
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {checklist.map((c) => (
                <label key={c.id} className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-3">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={() => toggleChecklist(c.id)}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="min-w-0">
                    <div className={["text-sm font-black", c.done ? "text-zinc-500 line-through" : "text-zinc-950"].join(" ")}>
                      {c.text}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">Tap to toggle</div>
                  </div>
                </label>
              ))}
              {!checklist.length ? <div className="text-sm text-zinc-700">No checklist items yet.</div> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Inspection-ready actions</div>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    const completedItems = checklist.filter(c => c.done).map(c => c.label);
                    const totalPhotos = photos.length;
                    const res = await fetch(`${API_URL}/ops-services/service-requests`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        type: 'INSPECTION',
                        description: `Inspection request with ${completedItems.length} checklist items completed and ${totalPhotos} site photos attached.`,
                        metadata: { checklistItems: completedItems, photoCount: totalPhotos },
                      }),
                    });
                    if (res.ok) {
                      alert('Inspection service request created successfully.');
                    } else {
                      alert('Failed to create service request. Please try again.');
                    }
                  } catch {
                    alert('Network error. Please check your connection.');
                  }
                }}
                className="h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
              >
                Create inspection service request
              </button>
              <button
                type="button"
                onClick={() => setChecklist((prev) => prev.map((c) => ({ ...c, done: false })))}
                className="h-12 rounded-xl border border-black/10 bg-white px-4 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Reset checklist
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
              Tip: pair this with photos + GPS to help inspectors and reduce rework.
            </div>
          </div>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Push notifications (PWA)</div>
            <p className="mt-1 text-sm text-zinc-700">
              This page enables local notifications now. True “server push” requires VAPID + a backend sender.
            </p>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={requestNotifications}
                className="h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
              >
                Enable notifications
              </button>
              <button
                type="button"
                onClick={subscribeToPush}
                className="h-12 rounded-xl border border-black/10 bg-white px-4 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Create push subscription (VAPID)
              </button>
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                Permission: <span className="font-black text-zinc-900">{typeof Notification !== "undefined" ? Notification.permission : "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-lg font-black tracking-tight">Alert types</div>
            <div className="mt-3 grid gap-2">
              {(
                [
                  ["inspectionScheduled", "Inspection scheduled for tomorrow"],
                  ["permitApproved", "Permit approved"],
                  ["subArrived", "Subcontractor arrived on site"],
                  ["weatherDelay", "Weather delay warning"],
                ] as const
              ).map(([k, label]) => (
                <div key={k} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <label className="flex items-center gap-2 text-sm font-black text-zinc-900">
                    <input
                      type="checkbox"
                      checked={(notifTypes as any)[k]}
                      onChange={(e) => setNotifTypes((prev) => ({ ...prev, [k]: e.target.checked }))}
                    />
                    {label}
                  </label>
                  <button
                    type="button"
                    onClick={() => testSiteNotification(k as any)}
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                  >
                    Test
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
              Next step: store push subscriptions server-side and send events from permit/inspection/delivery workflows.
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

