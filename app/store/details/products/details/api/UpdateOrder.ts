import { CartItem } from "@/app/context/CategoryContext";
import { Order } from "@/app/types/Orders";
import { Preferences } from "@capacitor/preferences";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const UPDATE_ORDER = process.env.NEXT_PUBLIC_UPDATE_ORDER;
const UPLOAD_PRODUCTS = process.env.NEXT_PUBLIC_UPLOAD_PRODUCTS;
const UPDATE_STATUS_PRODUCTS = process.env.NEXT_PUBLIC_UPDATE_STATUS_PRODUCTS;
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
    const { value: token } = await Preferences.get({ key: "token" });
    //console.log(order?.listOrder,);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
          router.replace(`/dashboard/orders/details?id=${order._id}`);
        } else {
          router.replace("/dashboard/orders/handlerOrders");
        }
      }
    }
  } catch (error) {
    //console.log(error);
  }
}

export async function updateProducts(formData: FormData) {
  try {
    const url = `${API_URL}${UPLOAD_PRODUCTS}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // credentials: "include",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();

      return data;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function updateStatusProducts(_id: string, nextStatus: string) {
  try {
    const url = `${API_URL}${UPDATE_STATUS_PRODUCTS}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        productId: _id,
        nextStatus: nextStatus,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    console.log(error);
  }
}
