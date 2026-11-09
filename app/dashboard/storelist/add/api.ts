import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ADD_STORE_PRODUCTS =
  process.env.NEXT_PUBLIC_ADD_STORE_PRODUCTS || "/dash/addStoreProducts";
const UPDATE_STORE_PRODUCT =
  process.env.NEXT_PUBLIC_UPDATE_STORE_PRODUCT || "/dash/updateStoreProduct";
const DELETE_STORE_PRODUCT =
  process.env.NEXT_PUBLIC_DELETE_STORE_PRODUCT || "/dash/deleteStoreProduct";
const SORT_STORE_PRODUCTS =
  process.env.NEXT_PUBLIC_SORT_STORE_PRODUCTS || "/dash/sortStoreProducts";
const FETCH_MENU_STORE = process.env.NEXT_PUBLIC_FETCH_MENU_STORE;
const UPDATE_STATUS_PRODUCTS = process.env.NEXT_PUBLIC_UPDATE_STATUS_PRODUCTS;

interface ApiResult<T> {
  status?: boolean;
  message?: string;
  result?: T;
}

export interface MenuItemInput {
  title: string;
  price: string;
  image?: string;
  currency: string;
  maxCount?: number;
}

async function token(): Promise<string | null> {
  const { value } = await Preferences.get({ key: "token" });
  return value;
}

export async function addRestaurantProducts(
  storeId: string,
  categoryName: string,
  items: { title: string; price: string; currency: string; file: File }[],
): Promise<ApiResult<{ count: number }>> {
  const form = new FormData();
  form.append("storeId", storeId);
  form.append("categoryName", categoryName);
  form.append("course", "false");
  form.append(
    "items",
    JSON.stringify(
      items.map((item) => ({
        title: item.title,
        price: item.price,
        currency: item.currency,
      })),
    ),
  );
  items.forEach((item) => form.append("images", item.file));
  const res = await fetch(`${API_URL}${ADD_STORE_PRODUCTS}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}` },
    body: form,
  });
  return (await res.json()) as ApiResult<{ count: number }>;
}

export async function addCourseStoreProducts(
  storeId: string,
  groupId: string,
  categoryName: string,
  items: MenuItemInput[],
): Promise<ApiResult<{ count: number }>> {
  const res = await fetch(`${API_URL}${ADD_STORE_PRODUCTS}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify({
      storeId,
      groupId,
      categoryName,
      course: true,
      items,
    }),
  });
  return (await res.json()) as ApiResult<{ count: number }>;
}

export interface StoreMenuProduct {
  _id: string;
  title: string;
  price: string;
  image: string;
  currency: string;
  status: string;
  maxCount?: number;
}

export interface StoreMenuCategory {
  _id: string;
  category: string;
  groupId?: string;
  status?: string;
  products: StoreMenuProduct[];
}

function idText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) return String(value);
  return "";
}

export async function listStoreMenu(
  storeId: string,
): Promise<ApiResult<StoreMenuCategory[]>> {
  const res = await fetch(`${API_URL}${FETCH_MENU_STORE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify({ storeId }),
  });
  const data = (await res.json()) as ApiResult<{
    products?: { category?: StoreMenuCategory[] };
  }>;
  const categories = data.result?.products?.category;
  return {
    status: data.status,
    message: data.message,
    result: Array.isArray(categories)
      ? categories.map((category) => ({
          ...category,
          _id: idText(category._id),
          groupId: idText(category.groupId),
          products: Array.isArray(category.products)
            ? category.products.map((product) => ({
                ...product,
                _id: idText(product._id),
                title: product.title || "",
                price: String(product.price ?? ""),
                image: product.image || "",
                currency: product.currency || "DZD",
                status: product.status || "public",
                maxCount: Number(product.maxCount) || 0,
              }))
            : [],
        }))
      : [],
  };
}

export async function updateStoreMenuProduct(
  storeId: string,
  productId: string,
  title: string,
  price: string,
  maxCount: number,
): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${UPDATE_STORE_PRODUCT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify({ storeId, productId, title, price, maxCount }),
  });
  return (await res.json()) as ApiResult<null>;
}

export async function sortStoreMenuProducts(
  storeId: string,
  categoryId: string,
  ids: string[],
): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${SORT_STORE_PRODUCTS}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify({ storeId, categoryId, ids }),
  });
  return (await res.json()) as ApiResult<null>;
}

export async function deleteStoreMenuProduct(
  storeId: string,
  productId: string,
): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${DELETE_STORE_PRODUCT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify({ storeId, productId }),
  });
  return (await res.json()) as ApiResult<null>;
}

export async function setStoreProductStatus(
  productId: string,
  nextStatus: string,
): Promise<ApiResult<unknown>> {
  const res = await fetch(`${API_URL}${UPDATE_STATUS_PRODUCTS}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify({ productId, nextStatus }),
  });
  return (await res.json()) as ApiResult<unknown>;
}
