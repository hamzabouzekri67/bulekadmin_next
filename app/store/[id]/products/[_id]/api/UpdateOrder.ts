import { CartItem } from "@/app/context/CategoryContext";
import { Order } from "@/app/types/Orders";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const UPDATE_ORDER = process.env.NEXT_PUBLIC_UPDATE_ORDER;

interface UpdateOrderProps {
  order: Order | null;
  cartItems: CartItem[];
  router: ReturnType<typeof useRouter>;
}
export async function UpdateOrder({
  order,
  cartItems,
  router,
}: UpdateOrderProps) {
  try {
    const url = `${API_URL}${UPDATE_ORDER}`;
    //console.log(order?.listOrder,);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        orderId: order?._id,
        listorder: cartItems,
        feeApplications: order?.feeApplications,
        orderTax: order?.orderTax,
        feedriver: order?.feedriver,
        feedelivery: order?.feedelivery,
        pays: order?.ville,
        promoCode: order?.promoCode,
        discountId: order?.discountmodel,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data) {
        if (order?.status == "prepare") {
          router.replace(`/dashboard/orders/${order?._id}`);
        } else {
          router.replace("/dashboard/orders/Detailes");
        }
      }
    }
  } catch (error) {
    //console.log(error);
  }
}
