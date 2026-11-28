"use client";

import { useCallback, useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { MapPin, Radar, Store } from "lucide-react";
import { useUser } from "@/app/context/UserContext";

/*
 * مسافة ظهور المحلات لكل منطقة (web_backend /storeRadius، super_admin).
 * المحل يظهر للزبون إن كانت المسافة إليه ≤ مسافة منطقة المحل. الافتراضي 9.5 كم.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Region {
  country: string;
  ville: string;
  storeRadiusKm: number;
  isDefault: boolean;
  stores: number;
}

const ERRORS: Record<string, string> = {
  INVALID_KM: "Distance invalide (entre 1 et 50 km)",
  INVALID_REGION: "Région invalide",
  REGION_NOT_FOUND: "Région introuvable",
  FORBIDDEN: "Réservé au super administrateur",
};

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (!API_URL) return null;
  const { value: token } = await Preferences.get({ key: "token" });
  try {
    const res = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
type Res<T> = { status: boolean; code?: string; result?: T };

function RegionCard({ region, min, max, onSaved }: { region: Region; min: number; max: number; onSaved: (r: Region) => void }) {
  const [km, setKm] = useState(region.storeRadiusKm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setKm(region.storeRadiusKm), [region.storeRadiusKm]);
  const dirty = km !== region.storeRadiusKm;

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await post<Res<{ storeRadiusKm: number }>>("/dash/saveStoreRadius", {
      country: region.country,
      ville: region.ville,
      km,
    });
    setSaving(false);
    if (r?.status && r.result) {
      onSaved({ ...region, storeRadiusKm: r.result.storeRadiusKm, isDefault: false });
      setMsg({ ok: true, text: "Enregistré ✓" });
    } else setMsg({ ok: false, text: (r?.code && ERRORS[r.code]) || "Erreur de connexion" });
  }

  // cercle de visualisation (échelle relative au max)
  const pct = Math.max(12, (km / max) * 100);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-gray-900">
            <MapPin size={16} className="text-[#e91818]" /> {region.ville}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Store size={12} /> {region.stores} magasin(s) actif(s)
          </div>
        </div>
        {region.isDefault && !dirty && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">par défaut</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-red-50/60">
          <div
            className="absolute rounded-full border-2 border-[#e91818]/50 bg-[#e91818]/10 transition-all duration-300"
            style={{ width: `${pct}%`, height: `${pct}%` }}
          />
          <div className="relative h-2.5 w-2.5 rounded-full bg-[#e91818]" />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-black text-gray-900">
            {km.toLocaleString("fr-FR")} <span className="text-base font-semibold text-gray-500">km</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={0.5}
            value={km}
            onChange={(e) => setKm(Number(e.target.value))}
            className="mt-2 w-full accent-[#e91818]"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{min} km</span>
            <span>{max} km</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min={min}
          max={max}
          step={0.5}
          value={km}
          onChange={(e) => setKm(Number(e.target.value))}
          className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        />
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-xl bg-[#e91818] px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

export default function StoreRadiusPage() {
  const { user } = useUser();
  const [regions, setRegions] = useState<Region[]>([]);
  const [limits, setLimits] = useState({ min: 1, max: 50, defaultKm: 9.5 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await post<Res<{ regions: Region[]; min: number; max: number; defaultKm: number }>>("/dash/storeRadius", {});
    setLoading(false);
    if (r?.status && r.result) {
      setRegions(r.result.regions);
      setLimits({ min: r.result.min, max: r.result.max, defaultKm: r.result.defaultKm });
    } else setErr((r?.code && ERRORS[r.code]) || "Erreur de connexion");
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (user && user.role !== "super_admin") {
    return <p className="p-6 text-sm text-gray-500">Réservé au super administrateur.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Radar className="text-[#e91818]" /> Distance d&apos;affichage · مسافة ظهور المحلات
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Un magasin est visible par le client si la distance (par la route) jusqu&apos;à lui est inférieure à la
          distance de sa ville. Par défaut : {limits.defaultKm} km. Prise en compte en ~30 secondes.
        </p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : !regions.length ? (
        <p className="text-sm text-gray-400">Aucune région configurée.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => (
            <RegionCard
              key={`${r.country}:${r.ville}`}
              region={r}
              min={limits.min}
              max={limits.max}
              onSaved={(n) => setRegions((list) => list.map((x) => (x.country === n.country && x.ville === n.ville ? n : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
