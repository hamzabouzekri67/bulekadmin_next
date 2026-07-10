import { Preferences } from "@capacitor/preferences";
import { useRouter } from "next/navigation";

const SEARCH_STORE_AND_FIND = process.env.NEXT_PUBLIC_SEARCH_STORE_AND_FIND;
const FIND_PRODUCT_FEATURED = process.env.NEXT_PUBLIC_FIND_PRODUCT_FEATURED;
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SAVE_FEATURED = process.env.NEXT_PUBLIC_SAVE_FEATURED;

export async function searchandFindStore(
  searchQuery: string,
  router: ReturnType<typeof useRouter>,
) {
  const url = `${API_URL}${SEARCH_STORE_AND_FIND}?search=${encodeURIComponent(searchQuery)}`;

  const { value: token } = await Preferences.get({ key: "token" });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    // credentials: "include",
    //body: JSON.stringify({ storeId: v._id, status: status }),
  });
  if (res.ok) {
    const detailes = await res.json();

    if (detailes.message === "Invalid Token") {
      localStorage.removeItem("token");
      router.push("/login");
      return null;
    }

    if (detailes.status) {
      return detailes.result;
    } else {
      alert("verify connections");
    }
  }
}

export async function findProductsFauterd(clientId: string) {
  const url = `${API_URL}${FIND_PRODUCT_FEATURED}?id=${encodeURIComponent(clientId)}`;

  const { value: token } = await Preferences.get({ key: "token" });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    //body: JSON.stringify({ storeId: v._id, status: status }),
  });
  if (res.ok) {
    const detailes = await res.json();
    // console.log(detailes);

    if (detailes.status) {
      return detailes.result;
    } else {
      alert("verify connections");
    }
  }
}

export async function saveFeatuerd(
  storeId: string,
  selectedItems: string[],
  campaignStart: string | null,
  campaignEnd: string | null,
) {
  const url = `${API_URL}${SAVE_FEATURED}`;
  const { value: token } = await Preferences.get({ key: "token" });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      storeId,
      campaignStart: campaignStart,
      campaignEnd: campaignEnd,
      featuredItems: selectedItems,
    }),
  });
  if (res.ok) {
    const detailes = await res.json();
    // console.log(detailes);

    if (detailes.status) {
      return detailes.result;
    } else {
      alert("verify connections");
    }
  }
}
