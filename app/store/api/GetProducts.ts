import { Category, Order } from "@/app/types/Orders";
import { ParamValue } from "next/dist/server/request/params";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FETCH_MENU_STORE = process.env.NEXT_PUBLIC_FETCH_MENU_STORE;
const ADD_CATG = process.env.NEXT_PUBLIC_ADD_CATG;
const UPDATE_CATG = process.env.NEXT_PUBLIC_UPDATE_CATG;
const DELETED_CATG = process.env.NEXT_PUBLIC_DELETED_CATG;
const CHECK_STATUS_STORE = process.env.NEXT_PUBLIC_CHECK_STATUS_STORE;
const COMPELETED_STORE_PROFILE =
  process.env.NEXT_PUBLIC_COMPELETED_STORE_PROFILE;

const GET_TAGS = process.env.NEXT_PUBLIC_GET_TAGS;
export async function checkStatusStore(id: string | string[]) {
  try {
    const url = `${API_URL}${CHECK_STATUS_STORE}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function compeletedProfileStore(dataToSend: FormData) {
  try {
    console.log(dataToSend);

    const url = `${API_URL}${COMPELETED_STORE_PROFILE}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {},
      // headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: dataToSend,
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function GetProducts(
  storeId: string,
  setCategory: (val: Category[]) => void,
  orderId: string | null,
  setOrder: (val: Order | null) => void,
) {
  try {
    const url = `${API_URL}${FETCH_MENU_STORE}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ storeId: storeId, orderId: orderId }),
    });

    if (res.ok) {
      const data = await res.json();
      //console.log(data.result.order);
      if (data.result.products.category) {
        setCategory(data.result.products.category);
      }
      if (data.result.order) {
        //console.log(data.result.order);

        setOrder(data.result.order);
      }

      return !!data.result;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function addCatg(
  id: ParamValue,
  newCategoryName: string,
  isOffer: boolean,
) {
  try {
    const url = `${API_URL}${ADD_CATG}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: id,
        newCategoryName: newCategoryName,
        isOffer: isOffer,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function updateCatg(
  id: ParamValue,
  editingCategoryId: string,
  isActive: boolean,
  newCategoryName: string,
  isOffer: boolean,
) {
  try {
    const url = `${API_URL}${UPDATE_CATG}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: id,
        ctgId: editingCategoryId,
        status: isActive ? "public" : "pause",
        newCategoryName: newCategoryName,
        isOffer: isOffer,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function deleteCatg(editingCategoryId: string) {
  try {
    const url = `${API_URL}${DELETED_CATG}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ctgId: editingCategoryId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function getTags() {
  try {
    const url = `${API_URL}${GET_TAGS}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
