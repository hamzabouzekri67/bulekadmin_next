import { User } from "@/app/context/UserContext";
import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PRODUCTS_PENDING = process.env.NEXT_PUBLIC_GET_PRODUCTS_PENDING;
const ACCEPTED_ALL_PRODUCTS = process.env.NEXT_PUBLIC_ACCEPTED_ALL_PRODUCTS;
const ACCEPTED_CATG_PRODUCTS = process.env.NEXT_PUBLIC_ACCEPTED_CATG_PRODUCTS;
const PRODUCT_APPROVAL = process.env.NEXT_PUBLIC_PRODUCT_APPROVAL;
const PRODUCT_REJECTED_CATG = process.env.NEXT_PUBLIC_PRODUCT_REJECTED_CATG

export async function fetchPending(user: User | null) {
  try {
    const url = `${API_URL}${PRODUCTS_PENDING}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        ville: user?.ville,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    return null;
  }
}

export async function AcceptedAllProducts() {
  try {
    const url = `${API_URL}${ACCEPTED_ALL_PRODUCTS}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    return null;
  }
}

export async function approveCategoryWithProducts(categoryId: string) {
  try {
    const url = `${API_URL}${ACCEPTED_CATG_PRODUCTS}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        id: categoryId,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    return null;
  }
}

export async function handleProductApprovalAction(
  productId: string,
  action: string,
  rejectionReason: string,
) {
  try {
    const url = `${API_URL}${PRODUCT_APPROVAL}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        id: productId,
        action: action,
        rejectionReason: rejectionReason,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    return null;
  }
}

export async function rejectCategoryHandler(
  categoryId: string,
  rejectionReason: string,
) {
  try {
    const url = `${API_URL}${PRODUCT_REJECTED_CATG}`;
    const { value: token } = await Preferences.get({ key: "token" });

    console.log(url);
    

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        id: categoryId,
        rejectionReason: rejectionReason,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    return null;
  }
}
