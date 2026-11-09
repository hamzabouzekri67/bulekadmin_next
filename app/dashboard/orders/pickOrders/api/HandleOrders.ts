import { User } from "@/app/context/UserContext";
import { Order, UnavailableProduct } from "@/app/types/Orders";
import { Preferences } from "@capacitor/preferences";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Dispatch, SetStateAction } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL_BACKEND;
const web_URL = process.env.NEXT_PUBLIC_API_URL;

const ACCEPTED_ORDER_PATH = process.env.NEXT_PUBLIC_ACCEPTED_BACKEND;
const REJECT_ORDER_PATH = process.env.NEXT_PUBLIC_REJECT_ORDER;
const PROCESS_ORDERS = process.env.NEXT_PUBLIC_PROCESS_ORDERS;

/**
 * مسح tmpToken من order معين داخل الـ state فوراً بعد الاستخدام
 * لمنع إعادة الاستخدام أو القراءة من DevTools
 */
function clearTmpToken(
  orderId: string,
  setState: Dispatch<SetStateAction<Order[]>>,
) {
  setState((prev) =>
    prev.map((o) =>
      String(o._id) === String(orderId) ? { ...o, tmpToken: undefined } : o,
    ),
  );
}

export async function AcceptedOrders(
  orders: Order,
  minutes: number,
  user: User,
  myOrders: Order[],
  setmyOrders: Dispatch<SetStateAction<Order[]>>,
  secondTime: number,
) {
  // ── guard: لا نرسل بدون tmpToken ────────────────────────────────────
  if (!orders.tmpToken) {
    console.error("[AcceptedOrders] tmpToken مفقود — تم إلغاء العملية");
    return null;
  }

  // ── نسخ الـ token ثم مسحه من الـ state فوراً قبل أي await ────────────
  const tokenSnapshot = orders.tmpToken;
  clearTmpToken(orders._id, setmyOrders);

  try {
    const url = `${API_URL}${ACCEPTED_ORDER_PATH}`;
    const detailesOrder = {
      timePrepare: minutes,
      orderId: orders._id,
      restaurantId: orders.restaurantId._id,
      translocation: orders.translocation,
      timeOrder: orders.timeOrder,
      positionsEtabliss: orders.restaurantId.postionsEtabliss,
      notificationsToken: orders.send.notificationsToken,
      assistedBy: user.id,
      timeDriver: secondTime,
      clientId: orders.send.id,
    };

    const res = await fetch(url, {
      method: "POST",
      referrerPolicy: "no-referrer",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenSnapshot}`,
      },
      body: JSON.stringify(detailesOrder),
    });

    if (res.ok) {
      const data = await res.json();
      const targetId = data.result?.result?.orderId;

      // ── تحقق: orderId في الـ response يجب أن يطابق ما أرسلناه ─────────
      if (targetId && String(targetId) !== String(orders._id)) {
        console.error(
          "[AcceptedOrders] orderId في الـ response لا يطابق الطلب — رُفضت النتيجة",
        );
        return null;
      }

      if (targetId) {
        const updated = myOrders.filter(
          (o) => String(o._id) !== String(targetId),
        );
        setmyOrders(updated);
        return;
      } else {
        console.log("لم يتم العثور على orderId في data.result.result");
      }
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

type RejetecOrder = {
  order: Order | null;
  unavailableProducts: UnavailableProduct[];
  user: User | null;
  indexMessage: number | 0;
  setmyOrders: Dispatch<SetStateAction<Order[]>>;
};

export async function RejectedOrders({
  order,
  unavailableProducts,
  user,
  indexMessage,
  setmyOrders,
}: RejetecOrder) {
  // ── guard: لا نرسل بدون order أو tmpToken ────────────────────────────
  if (!order) {
    console.error("[RejectedOrders] order مفقود — تم إلغاء العملية");
    return null;
  }

  if (!order.tmpToken) {
    console.error("[RejectedOrders] tmpToken مفقود — تم إلغاء العملية");
    return null;
  }

  // ── نسخ الـ token ثم مسحه من الـ state فوراً قبل أي await ────────────
  const tokenSnapshot = order.tmpToken;
  clearTmpToken(order._id, setmyOrders);

  try {
    const url = `${API_URL}${REJECT_ORDER_PATH}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenSnapshot}`,
      },
      body: JSON.stringify({
        orderId: order._id,
        notificationsToken: order.send.notificationsToken,
        message: order.message,
        itemRejected: unavailableProducts,
        assistedBy: user?.id,
        indexMessage: indexMessage,
      }),
    });

    if (res.ok) {
      const data = await res.json();

      if (data && data.result) {
        if (!data.result.status) return;
        setmyOrders((prev) => prev.filter((e) => e._id !== order._id));
      }

      return;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

type ProcessOrder = {
  order: Order | null;
  user: User | null;
  setNewOrders: Dispatch<SetStateAction<Order[]>>;
  router: AppRouterInstance;
};
export async function processOrder({
  order,
  user,
  setNewOrders,
  router,
}: ProcessOrder) {
  try {
    const url = `${web_URL}${PROCESS_ORDERS}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: order?._id,
        claimId: user?.id,
      }),
    });

    if (res.ok) {
      const data = await res.json();

      if (data && data.result) {
        if (data.result.status) {
          setNewOrders((prev) => prev.filter((e) => e._id !== order?._id));

          const goToDetails = window.confirm(
            `Commande #${order?.TrackingId} acceptée !\n\n` +
              `Voulez-vous traiter cette commande maintenant ?\n` +
              `- "OK" لتعديل حالة الطلب وتجهيزه.\n` +
              `- "Annuler" للبقاء هنا واستلام طلبات أخرى.`,
          );

          if (goToDetails) {
            router.push(`/dashboard/orders/handlerOrders`);
          }
        } else {
          alert(
            data.result.message ||
              "Désolé, ce commande est déjà prise par un autre agent.",
          );
          setNewOrders((prev) => prev.filter((e) => e._id !== order?._id));
        }
      }
    }
  } catch (error) {
    console.log("error", error);
    return null;
  }
}
