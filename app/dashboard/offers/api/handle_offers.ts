const GET_STORE_DOC = process.env.NEXT_PUBLIC_GET_STORE_DOC;
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SAVE_STORE_DOC = process.env.NEXT_PUBLIC_SAVE_STORE_DOC;

export async function getDocStore(selectedRestaurantId: string) {
  const url = `${API_URL}${GET_STORE_DOC}/${selectedRestaurantId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (res.ok) {
    const detailes = await res.json();
    if (detailes.status) {
      return detailes.result;
    } else {
      alert("verify connections");
    }
  }
}

export async function saveDocStore(
  selectedRestaurantId: string,
  payload: {
    deliverySettings: {
      hasFreeDeliveryThreshold: boolean;
      freeDeliveryMinAmount: number;
      maxFreeDeliveryDistance: number;
      sponsoredBy: { restaurantShare: number; platformShare: number };
    };
    discountSettings: {
      hasOrderDiscount: boolean;
      minAmountForDiscount: number;
      discountType: string;
      discountValue: number;
      sponsoredBy: { restaurantShare: number; platformShare: number };
    };
  },
) {
  const url = `${API_URL}${SAVE_STORE_DOC}/${selectedRestaurantId}/offers`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const detailes = await res.json();
    if (detailes.status) {
      return detailes.result;
    } else {
      alert("verify connections");
    }
  }
}
