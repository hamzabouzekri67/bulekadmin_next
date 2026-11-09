import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface GroceryStoreOption {
  id: string;
  name: string;
  image: string;
}

export interface GroceryProductOption {
  id: string;
  categoryId: string;
  title: string;
  price: string;
  image: string;
  currency: string;
  status: string;
}

export type GroceryDisplayType = "horizontal" | "card" | "grid";

export const CARD_MAX_PRODUCTS = 4;

export interface GroceryCollectionItem {
  id: string;
  title: string;
  storeId: string;
  storeName: string;
  storeImage: string;
  productIds: string[];
  products: GroceryProductOption[];
  placement: "store" | "stores" | "both";
  displayType?: GroceryDisplayType;
  groupWithNext?: boolean;
  indexing: number;
}

interface ApiResponse<T> {
  status?: boolean;
  message?: string;
  result?: T;
}

async function request<T>(path: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const { value: token } = await Preferences.get({ key: "token" });
  const response = await fetch(`${API_URL}/dash/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    return { status: false, message: data.message || "تعذر الاتصال بالخادم" };
  }
  return data;
}

export function listGroceryStores() {
  return request<GroceryStoreOption[]>("listGroceryStores");
}

export function listGroceryStoreProducts(storeId: string) {
  return request<GroceryProductOption[]>("listGroceryStoreProducts", { storeId });
}

export function listGroceryCollections(storeId = "") {
  return request<GroceryCollectionItem[]>("listGroceryCollections", { storeId });
}

export function addGroceryCollection(params: {
  title: string;
  storeId: string;
  productIds: string[];
  placement: "store" | "stores" | "both";
  displayType: GroceryDisplayType;
  groupWithNext: boolean;
}) {
  return request<GroceryCollectionItem>("addGroceryCollection", params);
}

export function updateGroceryCollection(params: {
  id: string;
  title: string;
  storeId: string;
  productIds: string[];
  placement: "store" | "stores" | "both";
  displayType: GroceryDisplayType;
  groupWithNext: boolean;
}) {
  return request<GroceryCollectionItem>("updateGroceryCollection", params);
}

// ids بالترتيب المطلوب (الأول يظهر أولاً للعميل).
export function reorderGroceryCollections(ids: string[]) {
  return request<null>("reorderGroceryCollections", { ids });
}

export function deleteGroceryCollection(id: string) {
  return request<null>("deleteGroceryCollection", { id });
}
