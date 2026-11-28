"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { Clock, Plus, Trash2, TrendingUp, Zap } from "lucide-react";
import { useUser } from "@/app/context/UserContext";

/*
 * Bonus السائق في الطلبية العادية حسب فترات اليوم (web_backend /driverBonusConfigs).
 * - «Toutes les villes» = الافتراضي. إعداد مدينة يستبدله كلياً لتلك المدينة.
 * - الطلبية المُنشأة داخل فترة يُثبَّت فيها الـ Bonus، يراه السائق في الطلب، ويُضاف لرصيده عند التسليم (يدفعه Bulek).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface BonusWindow {
  start: string;
  end: string;
  amount: number;
}
interface Boost {
  enabled: boolean;
  everySeconds: number;
  amount: number;
  max: number;
}
interface BonusConfig {
  ville: string;
  enabled: boolean;
  windows: BonusWindow[];
  boost: Boost;
}

const DEFAULT_BOOST: Boost = { enabled: false, everySeconds: 60, amount: 50, max: 300 };

const ERRORS: Record<string, string> = {
  INVALID_WINDOW: "Plage invalide : heures HH:mm et montant entre 1 et 5000 DA",
  TOO_MANY_WINDOWS: "12 plages maximum",
  INVALID_BOOST: "Augmentation invalide : toutes les 30–3600 s, montant ≥ 1, maximum ≥ montant (≤ 5000 DA)",
  CANNOT_DELETE_DEFAULT: "La configuration par défaut ne peut pas être supprimée",
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

const label = (ville: string) => (ville === "default" ? "Toutes les villes · كل المدن" : ville);

function ConfigCard({
  initial,
  onSaved,
  onDeleted,
}: {
  initial: BonusConfig;
  onSaved: (c: BonusConfig) => void;
  onDeleted?: () => void;
}) {
  const [cfg, setCfg] = useState<BonusConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setCfg(initial), [initial]);

  const setBoost = (patch: Partial<Boost>) => setCfg((c) => ({ ...c, boost: { ...c.boost, ...patch } }));
  const b = cfg.boost;
  const steps = b.amount > 0 ? Math.ceil(b.max / b.amount) : 0;

  const setWindow = (i: number, patch: Partial<BonusWindow>) =>
    setCfg((c) => ({ ...c, windows: c.windows.map((w, j) => (j === i ? { ...w, ...patch } : w)) }));

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await post<Res<BonusConfig>>("/dash/saveDriverBonusConfig", cfg);
    setSaving(false);
    if (r?.status && r.result) {
      onSaved({ ...r.result, boost: r.result.boost ?? DEFAULT_BOOST });
      setMsg({ ok: true, text: "Enregistré ✓" });
    } else setMsg({ ok: false, text: (r?.code && ERRORS[r.code]) || r?.code || "Erreur de connexion" });
  }

  async function remove() {
    if (!confirm(`Supprimer la configuration de ${cfg.ville} ? Elle utilisera la configuration par défaut.`)) return;
    const r = await post<Res<unknown>>("/dash/deleteDriverBonusConfig", { ville: cfg.ville });
    if (r?.status) onDeleted?.();
    else setMsg({ ok: false, text: (r?.code && ERRORS[r.code]) || "Erreur de connexion" });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">{label(cfg.ville)}</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <span className={cfg.enabled ? "font-semibold text-green-700" : "text-gray-500"}>
            {cfg.enabled ? "Activé" : "Désactivé"}
          </span>
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => setCfg((c) => ({ ...c, enabled: e.target.checked }))}
            className="h-5 w-5 accent-[#e91818]"
          />
        </label>
      </div>

      <div className="space-y-2">
        {cfg.windows.map((w, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
            <Clock size={16} className="text-gray-500" />
            <span className="text-xs text-gray-600">De</span>
            <input
              type="time"
              value={w.start}
              onChange={(e) => setWindow(i, { start: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
            />
            <span className="text-xs text-gray-600">à</span>
            <input
              type="time"
              value={w.end}
              onChange={(e) => setWindow(i, { end: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
            />
            <span className="text-xs text-gray-600">Bonus</span>
            <input
              type="number"
              min={1}
              max={5000}
              value={w.amount || ""}
              onChange={(e) => setWindow(i, { amount: Number(e.target.value) })}
              className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
            />
            <span className="text-xs text-gray-600">DA</span>
            {w.end <= w.start && w.start !== w.end && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">passe minuit 🌙</span>
            )}
            <button
              onClick={() => setCfg((c) => ({ ...c, windows: c.windows.filter((_, j) => j !== i) }))}
              className="ml-auto text-gray-400 hover:text-red-600"
              aria-label="Supprimer la plage"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {!cfg.windows.length && <p className="text-sm text-gray-400">Aucune plage — pas de bonus.</p>}
        {cfg.windows.length < 12 && (
          <button
            onClick={() => setCfg((c) => ({ ...c, windows: [...c.windows, { start: "22:00", end: "02:00", amount: 100 }] }))}
            className="flex items-center gap-1 text-sm font-semibold text-[#e91818] hover:underline"
          >
            <Plus size={16} /> Ajouter une plage
          </button>
        )}
      </div>

      {/* زيادة السعر إن لم يقبل أحد */}
      <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <TrendingUp size={16} className="text-orange-600" /> Personne n&apos;accepte → augmenter le prix
          </span>
          <input
            type="checkbox"
            checked={b.enabled}
            onChange={(e) => setBoost({ enabled: e.target.checked })}
            className="h-5 w-5 accent-[#e91818]"
          />
        </label>
        <div className={`flex flex-wrap items-center gap-2 text-sm ${b.enabled ? "" : "pointer-events-none opacity-40"}`}>
          <span className="text-gray-600">Toutes les</span>
          <input
            type="number"
            min={30}
            max={3600}
            step={10}
            value={b.everySeconds || ""}
            onChange={(e) => setBoost({ everySeconds: Number(e.target.value) })}
            className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1"
          />
          <span className="text-gray-600">s sans acceptation :</span>
          <span className="font-semibold text-gray-800">+</span>
          <input
            type="number"
            min={1}
            max={5000}
            value={b.amount || ""}
            onChange={(e) => setBoost({ amount: Number(e.target.value) })}
            className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1"
          />
          <span className="text-gray-600">DA, maximum</span>
          <input
            type="number"
            min={1}
            max={5000}
            value={b.max || ""}
            onChange={(e) => setBoost({ max: Number(e.target.value) })}
            className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1"
          />
          <span className="text-gray-600">DA</span>
        </div>
        {b.enabled && b.everySeconds > 0 && b.amount > 0 && (
          <p className="text-xs text-gray-600">
            Ex. : après {b.everySeconds} s → +{Math.min(b.amount, b.max)} DA · après {b.everySeconds * 2} s → +
            {Math.min(b.amount * 2, b.max)} DA · maximum +{b.max} DA atteint après {steps * b.everySeconds} s. Le livreur
            voit le prix total (pas de « bonus »), payé par Bulek à la livraison.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#e91818] px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
        {onDeleted && (
          <button onClick={remove} className="text-sm text-gray-500 hover:text-red-600">
            Supprimer (utiliser le défaut)
          </button>
        )}
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

export default function DriverBonusPage() {
  const { user } = useUser();
  const [configs, setConfigs] = useState<BonusConfig[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCity, setNewCity] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await post<Res<{ configs: BonusConfig[]; cities: string[] }>>("/dash/driverBonusConfigs", {});
    setLoading(false);
    if (r?.status && r.result) {
      setConfigs(
        r.result.configs.map((c) => ({
          ...c,
          enabled: c.enabled !== false,
          windows: c.windows ?? [],
          boost: { ...DEFAULT_BOOST, ...(c.boost ?? {}) },
        })),
      );
      setCities(r.result.cities);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const def = useMemo<BonusConfig>(
    () =>
      configs.find((c) => c.ville === "default") ?? {
        ville: "default",
        enabled: true,
        windows: [],
        boost: DEFAULT_BOOST,
      },
    [configs],
  );
  const perCity = configs.filter((c) => c.ville !== "default");
  const available = cities.filter((c) => !perCity.some((p) => p.ville === c.toLowerCase()));

  const upsert = (c: BonusConfig) => setConfigs((list) => [...list.filter((x) => x.ville !== c.ville), c]);

  if (user && user.role !== "super_admin") {
    return <p className="p-6 text-sm text-gray-500">Réservé au super administrateur.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Zap className="text-[#e91818]" /> Bonus livreurs · مكافأة السائقين
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Pendant ces plages horaires (heure locale du restaurant), le prix de livraison affiché au livreur est
          augmenté. Si personne n&apos;accepte, le prix augmente aussi à chaque intervalle (envoi par vagues : nombre
          de livreurs par vague = « driverCount » de la ville, 30 s par vague). Payé par Bulek à la livraison. Une
          configuration de ville remplace celle par défaut.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : (
        <>
          <ConfigCard initial={def} onSaved={upsert} />

          {perCity.map((c) => (
            <ConfigCard
              key={c.ville}
              initial={c}
              onSaved={upsert}
              onDeleted={() => setConfigs((list) => list.filter((x) => x.ville !== c.ville))}
            />
          ))}

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-gray-300 p-4">
            <span className="text-sm text-gray-600">Configuration spécifique pour :</span>
            <select
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="">— choisir une ville —</option>
              {available.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              disabled={!newCity}
              onClick={() => {
                upsert({ ville: newCity.toLowerCase(), enabled: true, windows: def.windows, boost: def.boost });
                setNewCity("");
              }}
              className="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
