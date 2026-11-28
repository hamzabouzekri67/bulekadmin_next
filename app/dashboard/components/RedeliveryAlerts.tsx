"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSocket } from "@/app/context/SocketProvider";
import { useUser } from "@/app/context/UserContext";

/*
 * تنبيه مباشر: سائق رفض مهمة «إرسال منتج ناقص» (أو انتهت مهلته).
 * - nextDriverName: رنّت تلقائياً عند السائق التالي (معلومة، تُغلق وحدها بعد 8 ثوانٍ)
 * - exhausted: توقف الرنين التلقائي → اختر سائقاً (يبقى حتى يُغلق)
 * الحدث redelivery_declined يصل من bulek_backend إلى غرفة admin_<ville> (SocketProvider → joinAdmin).
 */

interface DeclineAlert {
  orderId: string;
  trackingId?: string | null;
  itemsNote?: string;
  driverName?: string;
  reason?: string;
  nextDriverName?: string | null;
  exhausted?: boolean;
}

export default function RedeliveryAlerts() {
  const { socket } = useSocket() ?? {};
  const { user } = useUser();
  const [alerts, setAlerts] = useState<DeclineAlert[]>([]);

  useEffect(() => {
    if (!socket) return;
    const onDecline = (e: DeclineAlert) => {
      if (!e?.orderId) return;
      setAlerts((a) => [e, ...a.filter((x) => x.orderId !== e.orderId)].slice(0, 5));
      if (!e.exhausted) {
        setTimeout(() => setAlerts((a) => a.filter((x) => x !== e)), 8000);
      }
    };
    socket.on("redelivery_declined", onDecline);
    return () => {
      socket.off("redelivery_declined", onDecline);
    };
  }, [socket]);

  // الإسناد للـ super_admin فقط
  if (user?.role !== "super_admin" || !alerts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {alerts.map((a) => (
        <div
          key={a.orderId}
          className={`rounded-xl border bg-white p-4 text-sm shadow-lg ${a.exhausted ? "border-orange-300" : "border-blue-200"}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{a.exhausted ? "⚠️" : "🔔"}</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900">
                {a.reason === "timeout" ? "Pas de réponse du livreur" : "Le livreur a refusé"}
                {a.trackingId ? ` · #${a.trackingId}` : ""}
              </div>
              <div className="mt-0.5 text-xs text-gray-600">
                🛵 {a.driverName || "Livreur"} — {a.itemsNote}
                {a.reason && a.reason !== "timeout" ? ` « ${a.reason} »` : ""}
              </div>
              <div className={`mt-1 text-xs font-semibold ${a.exhausted ? "text-orange-700" : "text-blue-700"}`}>
                {a.exhausted
                  ? "Aucun livreur n'a accepté — choisissez un livreur · لم يقبلها أحد"
                  : `→ Proposée automatiquement à ${a.nextDriverName} · ترن الآن عنده`}
              </div>
              <Link
                href={`/dashboard/orders/details?id=${a.orderId}`}
                onClick={() => setAlerts((x) => x.filter((y) => y.orderId !== a.orderId))}
                className="mt-2 inline-block rounded-lg bg-[#e91818] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Réassigner →
              </Link>
            </div>
            <button
              onClick={() => setAlerts((x) => x.filter((y) => y.orderId !== a.orderId))}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
