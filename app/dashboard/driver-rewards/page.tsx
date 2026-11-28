"use client";

import { useCallback, useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { Pause, Pencil, Play, Plus, Square, Trophy, Users, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";

/*
 * تحديات السائقين (web_backend /rewardCampaigns …، super_admin).
 * bulek_backend يحتسب الطلبيات المُسلّمة ويصرف المكافأة تلقائياً للرصيد (worker/rewards).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type CType = "QUEST" | "STREAK";
type Period = "DAILY" | "WEEKLY" | "CAMPAIGN";
type Status = "active" | "paused" | "ended";

interface Campaign {
  _id?: string;
  title: { ar: string; fr: string };
  type: CType;
  period: Period;
  target: number;
  reward: number;
  repeatable: boolean;
  oncePerDriver: boolean;
  audience: "ALL" | "NEW";
  newDriverDays: number;
  villes: string[];
  orderTypes: string[];
  startsAt: string;
  endsAt: string;
  status?: Status;
  budget: { dailyCap: number; totalCap: number };
  rules: { minOrderValue: number; sameClientWindowMin: number; maxSameClient: number; minDeliveryMin: number };
  spentTotal?: number;
  spentToday?: number;
  participants?: number;
  claimed?: number;
  blocked?: number;
  budgetExhaustedDay?: string | null;
}

interface ProgressRow {
  driverId: string;
  name: string;
  phoneNumber?: string;
  periodKey: string;
  count: number;
  streak: number;
  status: string;
  timesClaimed: number;
  payoutBlocked: string | null;
  updatedAt: string;
}

const ERRORS: Record<string, string> = {
  TITLE_REQUIRED: "Titre requis (arabe ou français)",
  INVALID_TYPE: "Type invalide",
  INVALID_PERIOD: "Période invalide",
  INVALID_TARGET: "Objectif entre 1 et 500",
  INVALID_REWARD: "Récompense entre 1 et 5000 DA",
  INVALID_DATES: "Dates invalides (la fin doit être après le début)",
  INVALID_BUDGET: "Budget invalide",
  BUDGET_BELOW_REWARD: "Le budget doit être ≥ la récompense",
  INVALID_RULES: "Règles anti-fraude invalides",
  INVALID_NEW_DAYS: "Nouveaux livreurs : entre 1 et 365 jours",
  INVALID_ORDER_TYPES: "Choisissez au moins un type de commande",
  NOT_FOUND_OR_ENDED: "Défi introuvable ou terminé",
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

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const blank = (): Campaign => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 30 * 86_400_000);
  return {
    title: { ar: "", fr: "" },
    type: "QUEST",
    period: "DAILY",
    target: 10,
    reward: 300,
    repeatable: false,
    oncePerDriver: true,
    audience: "ALL",
    newDriverDays: 30,
    villes: [],
    orderTypes: ["FOOD_ORDER"],
    startsAt: toLocalInput(start),
    endsAt: toLocalInput(end),
    budget: { dailyCap: 0, totalCap: 0 },
    rules: { minOrderValue: 0, sameClientWindowMin: 180, maxSameClient: 1, minDeliveryMin: 3 },
  };
};

const PERIOD_LABEL: Record<Period, string> = { DAILY: "par jour", WEEKLY: "par semaine", CAMPAIGN: "pendant le défi" };
const STATUS_STYLE: Record<Status, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  ended: "bg-gray-100 text-gray-500",
};

function describe(c: Campaign) {
  const once = c.oncePerDriver !== false ? " · une seule fois par livreur" : "";
  return c.type === "QUEST"
    ? `${c.target} commandes ${PERIOD_LABEL[c.period]} → +${c.reward} DA${once}`
    : `${c.target} commandes d'affilée sans refus → +${c.reward} DA${c.repeatable ? " (à chaque série)" : ""} · ${PERIOD_LABEL[c.period]}${once}`;
}

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="block space-y-1">
    <span className="text-xs font-semibold text-gray-600">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400">{hint}</span>}
  </label>
);
const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

function Editor({
  initial,
  cities,
  onClose,
  onSaved,
}: {
  initial: Campaign;
  cities: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [c, setC] = useState<Campaign>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<Campaign>) => setC((x) => ({ ...x, ...patch }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  async function save() {
    setSaving(true);
    setErr(null);
    const r = await post<Res<{ _id: string }>>("/dash/saveRewardCampaign", {
      ...c,
      startsAt: new Date(c.startsAt).toISOString(),
      endsAt: new Date(c.endsAt).toISOString(),
    });
    setSaving(false);
    if (r?.status) onSaved();
    else setErr((r?.code && ERRORS[r.code]) || r?.code || "Erreur de connexion");
  }

  const toggleVille = (v: string) =>
    set({ villes: c.villes.includes(v) ? c.villes.filter((x) => x !== v) : [...c.villes, v] });
  const toggleType = (t: string) =>
    set({ orderTypes: c.orderTypes.includes(t) ? c.orderTypes.filter((x) => x !== t) : [...c.orderTypes, t] });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{c._id ? "Modifier le défi" : "Nouveau défi"}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-700">
            <X />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titre (arabe) — affiché au livreur">
            <input dir="rtl" className={input} value={c.title.ar} onChange={(e) => set({ title: { ...c.title, ar: e.target.value } })} placeholder="أكمل 10 طلبيات اليوم" />
          </Field>
          <Field label="Titre (français)">
            <input className={input} value={c.title.fr} onChange={(e) => set({ title: { ...c.title, fr: e.target.value } })} placeholder="Complétez 10 commandes" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["QUEST", "STREAK"] as CType[]).map((t) => (
            <button
              key={t}
              onClick={() => set({ type: t, repeatable: t === "STREAK" ? c.repeatable : false })}
              className={`rounded-xl border-2 p-3 text-left ${c.type === t ? "border-[#e91818] bg-red-50" : "border-gray-200"}`}
            >
              <div className="text-sm font-bold">{t === "QUEST" ? "🎯 Objectif (Quest)" : "🔥 Série (Streak)"}</div>
              <div className="text-xs text-gray-500">
                {t === "QUEST" ? "Compléter N commandes dans la période" : "N commandes d'affilée sans refus ni ignorer"}
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nombre de commandes (N)">
            <input type="number" min={1} max={500} className={input} value={c.target || ""} onChange={(e) => set({ target: num(e.target.value) })} />
          </Field>
          <Field label="Récompense (DA)">
            <input type="number" min={1} max={5000} className={input} value={c.reward || ""} onChange={(e) => set({ reward: num(e.target.value) })} />
          </Field>
          <Field label="Remise à zéro">
            <select className={input} value={c.period} onChange={(e) => set({ period: e.target.value as Period })}>
              <option value="DAILY">Chaque jour</option>
              <option value="WEEKLY">Chaque semaine</option>
              <option value="CAMPAIGN">Une fois (tout le défi)</option>
            </select>
          </Field>
        </div>
        <label className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm">
          <input
            type="checkbox"
            checked={c.oncePerDriver}
            onChange={(e) => set({ oncePerDriver: e.target.checked, repeatable: e.target.checked ? false : c.repeatable })}
            className="mt-0.5 h-4 w-4 accent-[#e91818]"
          />
          <span>
            <span className="font-semibold">🔒 Une seule fois par livreur</span>
            <span className="block text-xs text-gray-500">
              Un livreur qui a terminé le défi et reçu sa récompense ne peut pas le refaire (même s&apos;il est
              quotidien ou hebdomadaire).
            </span>
          </span>
        </label>
        {c.type === "STREAK" && !c.oncePerDriver && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.repeatable} onChange={(e) => set({ repeatable: e.target.checked })} className="h-4 w-4 accent-[#e91818]" />
            Récompenser à chaque série (sinon une seule fois par période)
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Début">
            <input type="datetime-local" className={input} value={c.startsAt} onChange={(e) => set({ startsAt: e.target.value })} />
          </Field>
          <Field label="Fin">
            <input type="datetime-local" className={input} value={c.endsAt} onChange={(e) => set({ endsAt: e.target.value })} />
          </Field>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-3 text-sm font-bold">👥 Livreurs concernés</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["ALL", "Tous les livreurs"],
                ["NEW", "🆕 Nouveaux livreurs seulement"],
              ] as const
            ).map(([a, l]) => (
              <button
                key={a}
                onClick={() => set({ audience: a })}
                className={`rounded-xl border-2 bg-white p-3 text-left text-sm font-semibold ${c.audience === a ? "border-[#e91818]" : "border-gray-200"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {c.audience === "NEW" && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600">Inscrits depuis moins de</span>
              <input
                type="number"
                min={1}
                max={365}
                className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1"
                value={c.newDriverDays || ""}
                onChange={(e) => set({ newDriverDays: num(e.target.value) })}
              />
              <span className="text-gray-600">jours</span>
              <span className="w-full text-[11px] text-gray-400">
                Ex. : « Bienvenue ! Complétez vos 5 premières commandes → +500 DA » avec « Une fois (tout le défi) ».
              </span>
            </div>
          )}
        </div>

        <Field label="Villes" hint="Aucune sélection = toutes les villes">
          <div className="flex flex-wrap gap-2">
            {cities.map((v) => {
              const on = c.villes.includes(v.toLowerCase());
              return (
                <button
                  key={v}
                  onClick={() => toggleVille(v.toLowerCase())}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-[#e91818] bg-red-50 font-semibold text-[#e91818]" : "border-gray-200 text-gray-600"}`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Types de commande">
          <div className="flex gap-4 text-sm">
            {[
              ["FOOD_ORDER", "Restaurants / magasins"],
              ["COURIER", "Coursier"],
            ].map(([t, l]) => (
              <label key={t} className="flex items-center gap-2">
                <input type="checkbox" checked={c.orderTypes.includes(t)} onChange={() => toggleType(t)} className="h-4 w-4 accent-[#e91818]" />
                {l}
              </label>
            ))}
          </div>
        </Field>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-3 text-sm font-bold">💰 Budget (0 = illimité)</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plafond par jour (DA)" hint="Atteint → le défi s'arrête jusqu'à demain">
              <input type="number" min={0} className={input} value={c.budget.dailyCap} onChange={(e) => set({ budget: { ...c.budget, dailyCap: num(e.target.value) } })} />
            </Field>
            <Field label="Plafond total (DA)" hint="Atteint → le défi se termine">
              <input type="number" min={0} className={input} value={c.budget.totalCap} onChange={(e) => set({ budget: { ...c.budget, totalCap: num(e.target.value) } })} />
            </Field>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-3 text-sm font-bold">🛡️ Anti-fraude</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valeur minimale de commande (DA)">
              <input type="number" min={0} className={input} value={c.rules.minOrderValue} onChange={(e) => set({ rules: { ...c.rules, minOrderValue: num(e.target.value) } })} />
            </Field>
            <Field label="Livraison suspecte si < (minutes)" hint="Depuis l'envoi de la commande au livreur">
              <input type="number" min={0} max={60} className={input} value={c.rules.minDeliveryMin} onChange={(e) => set({ rules: { ...c.rules, minDeliveryMin: num(e.target.value) } })} />
            </Field>
            <Field label="Même client : max commandes comptées">
              <input type="number" min={1} max={20} className={input} value={c.rules.maxSameClient} onChange={(e) => set({ rules: { ...c.rules, maxSameClient: num(e.target.value) } })} />
            </Field>
            <Field label="… sur une fenêtre de (minutes)">
              <input type="number" min={0} max={1440} className={input} value={c.rules.sameClientWindowMin} onChange={(e) => set({ rules: { ...c.rules, sameClientWindowMin: num(e.target.value) } })} />
            </Field>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Toujours exclu : commande dont le numéro du client = numéro du livreur.</p>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-700">{describe(c)}</div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="rounded-xl bg-[#e91818] px-6 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {saving ? "..." : "Enregistrer"}
          </button>
          <button onClick={onClose} className="text-sm text-gray-500">
            Annuler
          </button>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}

function ProgressModal({ c, onClose }: { c: Campaign; onClose: () => void }) {
  const [rows, setRows] = useState<ProgressRow[] | null>(null);
  useEffect(() => {
    post<Res<ProgressRow[]>>("/dash/rewardCampaignProgress", { _id: c._id }).then((r) => setRows(r?.result ?? []));
  }, [c._id]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-3xl space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Livreurs — {c.title.fr || c.title.ar}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-700">
            <X />
          </button>
        </div>
        {!rows ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : !rows.length ? (
          <p className="text-sm text-gray-400">Aucun livreur n&apos;a encore participé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="py-2">Livreur</th>
                  <th>Période</th>
                  <th>Progression</th>
                  <th>Payé</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.driverId + r.periodKey} className="border-t">
                    <td className="py-2">
                      <div className="font-medium">{r.name || r.driverId}</div>
                      <div className="text-xs text-gray-400">{r.phoneNumber}</div>
                    </td>
                    <td className="text-xs">{r.periodKey}</td>
                    <td>
                      {c.type === "STREAK" ? r.streak : r.count} / {c.target}
                    </td>
                    <td>{r.timesClaimed ? `${r.timesClaimed} × ${c.reward} DA` : "—"}</td>
                    <td>
                      {r.payoutBlocked ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">Budget épuisé</span>
                      ) : r.status === "claimed" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Payé ✓</span>
                      ) : (
                        <span className="text-xs text-gray-500">En cours</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverRewardsPage() {
  const { user } = useUser();
  const [list, setList] = useState<Campaign[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [viewing, setViewing] = useState<Campaign | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await post<Res<{ campaigns: Campaign[]; cities: string[] }>>("/dash/rewardCampaigns", {});
    setLoading(false);
    if (r?.status && r.result) {
      setList(r.result.campaigns);
      setCities(r.result.cities);
    } else setMsg((r?.code && ERRORS[r.code]) || "Erreur de connexion");
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(c: Campaign, status: Status) {
    if (status === "ended" && !confirm("Terminer ce défi définitivement ?")) return;
    const r = await post<Res<unknown>>("/dash/setRewardCampaignStatus", { _id: c._id, status });
    if (r?.status) load();
    else setMsg((r?.code && ERRORS[r.code]) || "Erreur");
  }

  const edit = (c: Campaign) =>
    setEditing({
      ...c,
      startsAt: toLocalInput(new Date(c.startsAt)),
      endsAt: toLocalInput(new Date(c.endsAt)),
      audience: c.audience ?? "ALL",
      oncePerDriver: c.oncePerDriver !== false,
      newDriverDays: c.newDriverDays ?? 30,
      rules: { ...blank().rules, ...(c.rules ?? {}) },
      budget: { ...blank().budget, ...(c.budget ?? {}) },
    });

  if (user && user.role !== "super_admin") {
    return <p className="p-6 text-sm text-gray-500">Réservé au super administrateur.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Trophy className="text-[#e91818]" /> Défis livreurs · تحديات السائقين
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Chaque commande livrée est comptée automatiquement. Objectif atteint → récompense ajoutée au solde du livreur
            (payée par Bulek) + notification.
          </p>
        </div>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-2 rounded-xl bg-[#e91818] px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
          <Plus size={16} /> Nouveau défi
        </button>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : !list.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          Aucun défi. Exemple : « Complétez 10 commandes aujourd&apos;hui → +300 DA ».
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c) => {
            const st = (c.status ?? "active") as Status;
            const daily = c.budget?.dailyCap || 0;
            const total = c.budget?.totalCap || 0;
            return (
              <div key={c._id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-gray-900">{c.title.ar || c.title.fr}</div>
                    {c.title.ar && c.title.fr && <div className="text-xs text-gray-500">{c.title.fr}</div>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[st]}`}>
                    {st === "active" ? "Actif" : st === "paused" ? "En pause" : "Terminé"}
                  </span>
                </div>
                <div className="text-sm text-gray-700">{describe(c)}</div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {c.oncePerDriver !== false && (
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 font-semibold text-white">🔒 1× par livreur</span>
                  )}
                  {c.audience === "NEW" && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                      🆕 Nouveaux (&lt; {c.newDriverDays ?? 30} j)
                    </span>
                  )}
                  {(c.villes?.length ? c.villes : ["Toutes les villes"]).map((v) => (
                    <span key={v} className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                      {v}
                    </span>
                  ))}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                    {new Date(c.startsAt).toLocaleDateString("fr-FR")} → {new Date(c.endsAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-center text-xs">
                  <div>
                    <div className="text-base font-bold">{c.participants ?? 0}</div>
                    <div className="text-gray-500">livreurs</div>
                  </div>
                  <div>
                    <div className="text-base font-bold">{c.claimed ?? 0}</div>
                    <div className="text-gray-500">récompenses</div>
                  </div>
                  <div>
                    <div className="text-base font-bold">{(c.spentTotal ?? 0).toLocaleString("fr-FR")} DA</div>
                    <div className="text-gray-500">{total ? `/ ${total.toLocaleString("fr-FR")}` : "dépensé"}</div>
                  </div>
                </div>
                {daily > 0 && (
                  <div className="text-xs text-gray-600">
                    Aujourd&apos;hui : {c.spentToday ?? 0} / {daily} DA
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full bg-[#e91818]" style={{ width: `${Math.min(100, ((c.spentToday ?? 0) / daily) * 100)}%` }} />
                    </div>
                  </div>
                )}
                {(c.blocked ?? 0) > 0 && (
                  <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
                    {c.blocked} livreur(s) ont atteint l&apos;objectif sans paiement (budget épuisé).
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => setViewing(c)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50">
                    <Users size={14} /> Livreurs
                  </button>
                  {st !== "ended" && (
                    <>
                      <button onClick={() => edit(c)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50">
                        <Pencil size={14} /> Modifier
                      </button>
                      {st === "active" ? (
                        <button onClick={() => setStatus(c, "paused")} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50">
                          <Pause size={14} /> Pause
                        </button>
                      ) : (
                        <button onClick={() => setStatus(c, "active")} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-green-700 hover:bg-green-50">
                          <Play size={14} /> Activer
                        </button>
                      )}
                      <button onClick={() => setStatus(c, "ended")} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                        <Square size={14} /> Terminer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Editor
          initial={editing}
          cities={cities}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {viewing && <ProgressModal c={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
