import { User } from "@/app/context/UserContext";
import { StoreData, Workday } from "@/app/types/store";
import { Preferences } from "@capacitor/preferences";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIST_STORE = process.env.NEXT_PUBLIC_LIST_STORE;
const UPDATE_STATUS_STORE = process.env.NEXT_PUBLIC_UPDATE_STATUS_STORE;
const ACCEPTED_STORE_SENT = process.env.NEXT_PUBLIC_ACCEPTED_STORE_SENT;
const UPDATE_STORE = process.env.NEXT_PUBLIC_UPDATE_STORE;

export async function GetStoreList(
  user: User,
  activeTab: string,
  setStoreData: (val: StoreData[]) => void,
  router: ReturnType<typeof useRouter>,
) {
  try {
    const url = `${API_URL}${LIST_STORE}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      //credentials: "include",
      body: JSON.stringify({ ville: user?.ville, status: activeTab }),
    });
    if (res.ok) {
      const detailes = await res.json();

      if (detailes.message === "Invalid Token") {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      const fetDriverData: StoreData[] = [];

      for (const key in detailes.result) {
        const detailesData: StoreData = detailes.result[key];
        fetDriverData.push(detailesData);
      }

      setStoreData(fetDriverData);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    //console.log(error);

    return null;
  }
}

export async function handleOnlineStatus(v: StoreData, status: boolean) {
  try {
    const url = `${API_URL}${UPDATE_STATUS_STORE}`;

    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ storeId: v._id, status: status }),
    });
    if (res.ok) {
      const detailes = await res.json();
      if (detailes.result) {
        return detailes.result.isOpen;
      } else {
        alert("verify connections");
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    //console.log(error);

    return null;
  }
}

export async function acceptedStoreSent(v: StoreData, status: string) {
  try {
    const url = `${API_URL}${ACCEPTED_STORE_SENT}`;

    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ storeId: v._id, status: status }),
    });
    if (res.ok) {
      const detailes = await res.json();
      if (detailes.result) {
        return detailes.result.status;
      } else {
        alert("verify connections");
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    //console.log(error);

    return null;
  }
}

// أضف هذه الدالة في ملف api/storeHandel.ts
export async function updateStoreDetails(
  storeId: string,
  updateData: {
    phoneNumber: string;
    timeP: string;
    workdays: Workday[];
    secondaryPhones: string[];
  },
) {
  try {
    const url = `${API_URL}${UPDATE_STORE}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const response = await fetch(`${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        storeId: storeId,
        ...updateData,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour du magasin");
    }

    const data = await response.json();
    return data; // إرجاع البيانات المحدثة من السيرفر
  } catch (error) {
    console.error("API Error:", error);
    alert("Échec de la mise à jour");
    return null;
  }
}
