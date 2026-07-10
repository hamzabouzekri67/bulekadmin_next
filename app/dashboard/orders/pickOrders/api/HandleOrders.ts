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

export async function AcceptedOrders(
  orders: Order,
  minutes: number,
  user: User,
  myOrders: Order[],
  setmyOrders: (val: Order[]) => void,
  secondTime: number,
) {
  try {
    //  console.log("newOrders",newOrders);
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

    //console.log(url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orders.tmpToken || ""}`,
      },
      //credentials: "include",
      body: JSON.stringify(detailesOrder),
    });

    // //console.log(res);

    if (res.ok) {
      const data = await res.json();

      const targetId = data.result?.result?.orderId;

      if (targetId) {
        // console.log("الـ ID المستهدف للحذف:", targetId);

        const updated = myOrders.filter(
          (o) => String(o._id) !== String(targetId),
        );

        setmyOrders(updated);

        return;
      } else {
        //console.log("لم يتم العثور على orderId في المسار data.result.result");
      }
    }
    //     return null
  } catch (error) {
    //console.log(error);
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
  try {
    const url = `${API_URL}${REJECT_ORDER_PATH}`;

    //console.log(url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${order?.tmpToken || ""}`,
      },
      body: JSON.stringify({
        orderId: order?._id,
        notificationsToken: order?.send.notificationsToken,
        message: order?.message,
        itemRejected: unavailableProducts,
        assistedBy: user?.id,
        indexMessage: indexMessage,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      //  console.log(data);

      if (data && data.result) {
        if (!data.result.status) return;

        setmyOrders((prev) => prev.filter((e) => e._id !== order?._id));
      }

      return;
    }
    //     return null
  } catch (error) {
    //console.log(error);
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
      //  credentials: "include",
      body: JSON.stringify({
        orderId: order?._id,
        claimId: user?.id,
      }),
    });

    console.log(res);

    if (res.ok) {
      const data = await res.json();

      if (data && data.result) {
        // الحالة الأولى: نجاح العملية (أنت من حجزت الطلب)
        if (data.result.status) {
          // حذف الطلب من القائمة لأنه انتقل لـ "طلباتي"
          setNewOrders((prev) => prev.filter((e) => e._id !== order?._id));

          const goToDetails = window.confirm(
            `Commande #${order?.TrackingId} acceptée !\n\n` +
              `Voulez-vous traiter cette commande maintenant ?\n` +
              `- "OK" لتعديل حالة الطلب وتجهيزه.\n` +
              `- "Annuler" للبقاء هنا واستلام طلبات أخرى.`,
          );

          if (goToDetails) {
            router.push(`/dashboard/orders/handlerOrders`);
            console.log("التوجه إلى تفاصيل الطلب...");
          } else {
            console.log("البقاء لاستلام مزيد من الطلبات");
          }

          // هنا يمكنك توجيه المستخدم إذا أردت كما ناقشنا سابقاً
        }
        // الحالة الثانية: فشل العملية (الطلب طار!)
        else {
          // إظهار رسالة تنبيه للمسير
          alert(
            data.result.message ||
              "Désolé, ce commande est déjà prise par un autre agent.",
          );

          // حذف الطلب من القائمة فوراً لكي لا يحاول الضغط عليه مرة أخرى
          setNewOrders((prev) => prev.filter((e) => e._id !== order?._id));
        }
      }
    }
  } catch (error) {
    console.log("error");
    return null;
  }
}
