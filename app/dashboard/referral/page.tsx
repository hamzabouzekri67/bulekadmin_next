"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bike, Check, Gift, Loader2, Users } from "lucide-react";
import { getReferralConfig, saveReferralConfig, type ReferralConfig } from "./api/referral";

/*
 * نظام الدعوة (super_admin):
 * - الزبائن: المدعو يحصل على توصيل مجاني لأول طلبية، والداعي يكافأ عند أول طلبية مُسلَّمة للمدعو
 *   (توصيل مجاني أو رصيد في المحفظة).
 * - السائقون: الداعي يُشحن رصيده الأساسي بعد أن يكمل المدعو عدداً من الطلبيات.
 * القواعد في bulek_backend/service/referral (الكاش 30 ثانية).
 */

const EMPTY: ReferralConfig = {
  enabled: false,
  inviterRewardType: "FREE_DELIVERY",
  inviterWalletAmount: 200,
  inviterFreeDeliveries: 1,
  inviteeFreeDelivery: true,
  freeDeliveryMaxAmount: 0,
  voucherExpiryDays: 30,
  minOrderAmount: 0,
  driverEnabled: false,
  driverRewardAmount: 500,
  driverRequiredOrders: 5,
  driverInviteClientsEnabled: false,
  driverClientRewardAmount: 100,
  loyaltyEnabled: false,
  loyaltyEveryOrders: 10,
  loyaltyRewardType: "FREE_DELIVERY",
  loyaltyWalletAmount: 200,
  loyaltyMinOrderAmount: 0,
  applyWindowDays: 7,
  maxReferralsPerUser: 0,
};

const ERRORS: Record<string, string> = {
  WALLET_AMOUNT_REQUIRED: "مبلغ الرصيد يجب أن يكون أكبر من 0",
  DRIVER_AMOUNT_REQUIRED: "مبلغ شحن السائق يجب أن يكون أكبر من 0",
  LOYALTY_AMOUNT_REQUIRED: "مبلغ مكافأة الولاء يجب أن يكون أكبر من 0",
  DRIVER_CLIENT_AMOUNT_REQUIRED: "مبلغ شحن السائق عن الزبون يجب أن يكون أكبر من 0",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#e91818] focus:ring-2 focus:ring-[#e91818]/10 disabled:bg-gray-50 disabled:text-gray-400";

function NumberField({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <input
        type="number"
        min={0}
        disabled={disabled}
        className={inputClass}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm font-semibold text-gray-800"
    >
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#e91818]" : "bg-gray-300"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "right-0.5" : "right-[22px]"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}

export default function ReferralPage() {
  const [cfg, setCfg] = useState<ReferralConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getReferralConfig().then((r) => {
      if (r.status && r.result) setCfg({ ...EMPTY, ...r.result });
      else setMsg({ ok: false, text: r.message ?? "تعذّر تحميل الإعدادات" });
      setLoading(false);
    });
  }, []);

  const set = <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await saveReferralConfig(cfg);
    setSaving(false);
    if (r.status && r.result) {
      setCfg({ ...EMPTY, ...r.result });
      setMsg({ ok: true, text: "تم الحفظ — يصل التطبيق خلال 30 ثانية" });
    } else {
      setMsg({ ok: false, text: (r.code && ERRORS[r.code]) || r.message || "فشل الحفظ" });
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#e91818]" />
      </div>
    );
  }

  const s = cfg.stats;
  const wallet = cfg.inviterRewardType === "WALLET";

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-red-50 p-2 text-[#e91818]">
          <Gift size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">نظام الدعوة</h1>
          <p className="text-sm text-gray-500">رابط دعوة لكل زبون وسائق، والمكافأة بعد أول طلبية حقيقية</p>
        </div>
      </header>

      {/* الزبائن */}
      <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Users size={18} /> الزبائن
          </h2>
          <Toggle checked={cfg.enabled} onChange={(v) => set("enabled", v)} label="تفعيل دعوة الزبائن" />
        </div>

        {s && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="بانتظار أول طلبية" value={s.client.pending} />
            <Stat label="دعوات مكافأة" value={s.client.rewarded} />
            <Stat label="رصيد مدفوع (دج)" value={s.client.paidAmount} />
          </div>
        )}

        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-700">مكافأة الداعي (عند أول طلبية مُسلَّمة للمدعو)</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["FREE_DELIVERY", "توصيل مجاني"],
                ["WALLET", "رصيد في المحفظة"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => set("inviterRewardType", k)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  cfg.inviterRewardType === k
                    ? "border-[#e91818] bg-red-50 text-[#e91818]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {wallet ? (
            <NumberField
              label="مبلغ الرصيد للداعي (دج)"
              value={cfg.inviterWalletAmount}
              onChange={(v) => set("inviterWalletAmount", v)}
              hint="يُضاف لمحفظة الكاش باك ويُصرف في الطلبيات (يتطلب تفعيل الكاش باك)"
            />
          ) : (
            <NumberField
              label="عدد التوصيلات المجانية للداعي"
              value={cfg.inviterFreeDeliveries}
              onChange={(v) => set("inviterFreeDeliveries", v)}
              hint="من 1 إلى 10 لكل صديق"
            />
          )}
          <NumberField
            label="أقل سعر طعام لطلبية المدعو (دج)"
            value={cfg.minOrderAmount}
            onChange={(v) => set("minOrderAmount", v)}
            hint="0 = أي طلبية"
          />
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <Toggle
            checked={cfg.inviteeFreeDelivery}
            onChange={(v) => set("inviteeFreeDelivery", v)}
            label="المدعو يحصل على توصيل مجاني لأول طلبية"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="أقصى تغطية للتوصيل المجاني (دج)"
            value={cfg.freeDeliveryMaxAmount}
            onChange={(v) => set("freeDeliveryMaxAmount", v)}
            hint="0 = كامل سعر التوصيل. التطبيق يدفع الجزء المغطّى للسائق"
          />
          <NumberField
            label="صلاحية الكوبون / الرصيد (أيام)"
            value={cfg.voucherExpiryDays}
            onChange={(v) => set("voucherExpiryDays", v)}
          />
        </div>
      </section>

      {/* السائقون */}
      <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Bike size={18} /> السائقون
          </h2>
          <Toggle checked={cfg.driverEnabled} onChange={(v) => set("driverEnabled", v)} label="تفعيل دعوة السائقين" />
        </div>

        {s && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="قيد التقدم" value={s.driver.pending} />
            <Stat label="دعوات مكافأة" value={s.driver.rewarded} />
            <Stat label="شحن مدفوع (دج)" value={s.driver.paidAmount} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="مبلغ الشحن للسائق الداعي (دج)"
            value={cfg.driverRewardAmount}
            onChange={(v) => set("driverRewardAmount", v)}
            hint="يُضاف للرصيد الأساسي"
          />
          <NumberField
            label="عدد الطلبيات التي يكملها المدعو"
            value={cfg.driverRequiredOrders}
            onChange={(v) => set("driverRequiredOrders", v)}
            hint="يُثبَّت لكل دعوة وقت كتابة الكود"
          />
        </div>

        {/* السائق يدعو زبائن جدد بنفس كوده */}
        <div className="space-y-4 rounded-xl bg-gray-50 p-4">
          <Toggle
            checked={cfg.driverInviteClientsEnabled}
            onChange={(v) => set("driverInviteClientsEnabled", v)}
            label="السائق يدعو زبائن جدد"
          />
          <p className="text-xs leading-relaxed text-gray-500">
            الزبون الجديد يكتب كود السائق أو يفتح رابطه في Bulek Eats فيحصل على هدية المدعو (توصيل مجاني إن كان مفعّلاً).
            عند تسليم أول طلبية للزبون يُشحن رصيد السائق. لا مكافأة إن سلّم السائق الطلبية لزبونه بنفسه.
          </p>
          {s?.driverClients && (
            <div className="grid grid-cols-3 gap-3">
              <Stat label="بانتظار أول طلبية" value={s.driverClients.pending} />
              <Stat label="زبائن مكافأة" value={s.driverClients.rewarded} />
              <Stat label="شحن مدفوع (دج)" value={s.driverClients.paidAmount} />
            </div>
          )}
          <NumberField
            label="شحن السائق عن كل زبون جديد (دج)"
            value={cfg.driverClientRewardAmount}
            onChange={(v) => set("driverClientRewardAmount", v)}
            hint="بعد أول طلبية مُسلَّمة للزبون (يخضع لأقل سعر طعام في قسم الزبائن)"
          />
        </div>
      </section>

      {/* الولاء */}
      <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Gift size={18} /> مكافأة الولاء
          </h2>
          <Toggle checked={cfg.loyaltyEnabled} onChange={(v) => set("loyaltyEnabled", v)} label="تفعيل الولاء" />
        </div>
        <p className="text-xs leading-relaxed text-gray-500">
          كل عدد من الطلبيات المُسلَّمة يحصل الزبون على مكافأة، ويرى تقدّمه في المحفظة.
          يُحسب من تاريخ أول تفعيل{cfg.loyaltyStartAt ? ` (${new Date(cfg.loyaltyStartAt).toLocaleDateString("fr-FR")})` : ""}، بلا أثر رجعي.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["FREE_DELIVERY", "توصيل مجاني"],
              ["WALLET", "رصيد في المحفظة"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => set("loyaltyRewardType", k)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                cfg.loyaltyRewardType === k
                  ? "border-[#e91818] bg-red-50 text-[#e91818]"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label="كل كم طلبية"
            value={cfg.loyaltyEveryOrders}
            onChange={(v) => set("loyaltyEveryOrders", v)}
            hint="من 2 إلى 100"
          />
          {cfg.loyaltyRewardType === "WALLET" && (
            <NumberField
              label="مبلغ المكافأة (دج)"
              value={cfg.loyaltyWalletAmount}
              onChange={(v) => set("loyaltyWalletAmount", v)}
            />
          )}
          <NumberField
            label="أقل سعر طعام يُحسب (دج)"
            value={cfg.loyaltyMinOrderAmount}
            onChange={(v) => set("loyaltyMinOrderAmount", v)}
            hint="0 = كل الطلبيات"
          />
        </div>
      </section>

      {/* عام */}
      <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">الحماية من التحايل</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="مهلة كتابة الكود بعد التسجيل (أيام)"
            value={cfg.applyWindowDays}
            onChange={(v) => set("applyWindowDays", v)}
            hint="وقبل أول طلبية مكتملة"
          />
          <NumberField
            label="أقصى عدد مدعوين لكل شخص"
            value={cfg.maxReferralsPerUser}
            onChange={(v) => set("maxReferralsPerUser", v)}
            hint="0 = بلا حد"
          />
        </div>
        <p className="text-xs leading-relaxed text-gray-500">
          دائماً: لا يدعو أحد نفسه (نفس الرقم أو الحساب)، جهاز واحد = دعوة واحدة، ولا يُقبل جهاز الداعي نفسه.
        </p>
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-gray-100 bg-white/90 py-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#e91818] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          حفظ
        </button>
        {msg && (
          <span className={`flex items-center gap-1 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>
            {!msg.ok && <AlertCircle size={16} />}
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
