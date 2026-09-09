import { Order } from "@/app/types/Orders";

const API_URL = process.env.NEXT_PUBLIC_API_URL_BACKEND;
const SEARCH_DRIVER = process.env.NEXT_PUBLIC_SEARCH_DRIVER;
const RSEARCH_DRIVER = process.env.NEXT_PUBLIC_RSEARCH_DRIVER;

export async function SearchDriver(detailesOrders: Order) {
  try {
    const orderDetailes = {
      orderId: detailesOrders.id,
      restaurantId: detailesOrders.restaurantId._id,
      postionsClient: detailesOrders.postionsClient,
      translocation: detailesOrders.translocation,
      timeOrder: detailesOrders.timeOrder,
      positionsEtabliss: detailesOrders.restaurantId.postionsEtabliss,
      balanceOrder: detailesOrders.isMonthly
        ? detailesOrders.feedriver
        : detailesOrders.totalFeePlatform,
      // requestId:DateTime.now().millisecondsSinceEpoch.toString()
    };
    const url = `${API_URL}${SEARCH_DRIVER}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${detailesOrders.tmpToken || ""}`,
      },
      //credentials: "include",
      body: JSON.stringify(orderDetailes),
    });

    //  console.log(res);

    if (res.ok) {
      const data = await res.json();

      return data;
      //console.log(data);
    }

    return null;
  } catch (error) {
    // console.log(error);
    return null;
  }
}

export async function RsearchDriver(detailesOrders: Order) {
  try {
    const orderDetailes = {
      orderId: detailesOrders.id,
      restaurantId: detailesOrders.restaurantId._id,
      postionsClient: detailesOrders.postionsClient,
      translocation: detailesOrders.translocation,
      timeOrder: detailesOrders.timeOrder,
      positionsEtabliss: detailesOrders.restaurantId.postionsEtabliss,
      balanceOrder: detailesOrders.isMonthly
        ? detailesOrders.feedriver
        : detailesOrders.totalFeePlatform,
    };
    const url = `${API_URL}${RSEARCH_DRIVER}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${detailesOrders.tmpToken || ""}`,
      },
      //credentials: "include",
      body: JSON.stringify(orderDetailes),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    return null;
  } catch (error) {
    // console.log(error);
    return null;
  }
}
