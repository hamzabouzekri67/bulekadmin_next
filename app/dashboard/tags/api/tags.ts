import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIST_TAG_CATALOG =
  process.env.NEXT_PUBLIC_LIST_TAG_CATALOG || "/dash/listTagCatalog";
const ASSIGN_TAG_CATEGORY =
  process.env.NEXT_PUBLIC_ASSIGN_TAG_CATEGORY || "/dash/assignTagCategory";
const ADD_TAG_CATEGORY =
  process.env.NEXT_PUBLIC_ADD_TAG_CATEGORY || "/dash/addTagCategory";
const UPDATE_TAG_CATEGORY =
  process.env.NEXT_PUBLIC_UPDATE_TAG_CATEGORY || "/dash/updateTagCategory";
const UPDATE_TAG = process.env.NEXT_PUBLIC_UPDATE_TAG || "/dash/updateTag";
const DELETE_TAG = process.env.NEXT_PUBLIC_DELETE_TAG || "/dash/deleteTag";

export interface TagCategory {
  _id: string;
  id: string;
  name: string;
  name_ar: string;
  color: string;
  icons: string;
  status: boolean;
}

export interface StoreTag {
  _id: string;
  id: string;
  name: string;
  name_ar: string;
  image: string;
  status: boolean;
  catgId: string | null;
  category: TagCategory | null;
}

interface ApiResult<T> {
  status?: boolean;
  message?: string;
  result?: T;
}

export interface TagCatalog {
  tags: StoreTag[];
  categories: TagCategory[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function read<T>(res: Response): Promise<ApiResult<T>> {
  return (await res.json()) as ApiResult<T>;
}

export async function listTagCatalog(): Promise<ApiResult<TagCatalog>> {
  const res = await fetch(`${API_URL}${LIST_TAG_CATALOG}`, {
    method: "GET",
    headers: await authHeaders(),
  });
  return read<TagCatalog>(res);
}

export async function assignTagCategory(
  tagId: string,
  catgId: string,
): Promise<ApiResult<StoreTag>> {
  const res = await fetch(`${API_URL}${ASSIGN_TAG_CATEGORY}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ tagId, catgId }),
  });
  return read<StoreTag>(res);
}

export async function addTagCategory(
  fields: {
    name: string;
    name_ar: string;
    color: string;
  },
  image: File,
): Promise<ApiResult<TagCategory>> {
  const { value: token } = await Preferences.get({ key: "token" });
  const form = new FormData();
  form.append("name", fields.name);
  form.append("name_ar", fields.name_ar);
  form.append("color", fields.color);
  form.append("icons", image);
  const res = await fetch(`${API_URL}${ADD_TAG_CATEGORY}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return read<TagCategory>(res);
}

async function authOnly(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return { Authorization: `Bearer ${token}` };
}

export async function updateTagCategory(
  fields: {
    id: string;
    name: string;
    name_ar: string;
    color: string;
    status: boolean;
  },
  image: File | null,
): Promise<ApiResult<TagCategory>> {
  const form = new FormData();
  form.append("id", fields.id);
  form.append("name", fields.name);
  form.append("name_ar", fields.name_ar);
  form.append("color", fields.color);
  form.append("status", String(fields.status));
  if (image) form.append("icons", image);
  const res = await fetch(`${API_URL}${UPDATE_TAG_CATEGORY}`, {
    method: "POST",
    headers: await authOnly(),
    body: form,
  });
  return read<TagCategory>(res);
}

export async function updateTag(
  fields: {
    id: string;
    name: string;
    name_ar: string;
    status: boolean;
    catgId: string;
  },
  image: File | null,
): Promise<ApiResult<StoreTag>> {
  const form = new FormData();
  form.append("id", fields.id);
  form.append("name", fields.name);
  form.append("name_ar", fields.name_ar);
  form.append("status", String(fields.status));
  form.append("catgId", fields.catgId);
  if (image) form.append("image", image);
  const res = await fetch(`${API_URL}${UPDATE_TAG}`, {
    method: "POST",
    headers: await authOnly(),
    body: form,
  });
  return read<StoreTag>(res);
}

export async function deleteTag(id: string): Promise<ApiResult<{ id: string }>> {
  const res = await fetch(`${API_URL}${DELETE_TAG}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  return read<{ id: string }>(res);
}
