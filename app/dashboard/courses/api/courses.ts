import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const LIST_COURSES = process.env.NEXT_PUBLIC_LIST_COURSES || "/dash/listCourses";
const ADD_COURSE = process.env.NEXT_PUBLIC_ADD_COURSE || "/dash/addCourse";
const UPDATE_COURSE = process.env.NEXT_PUBLIC_UPDATE_COURSE || "/dash/updateCourse";
const DELETE_COURSE = process.env.NEXT_PUBLIC_DELETE_COURSE || "/dash/deleteCourse";
const LIST_COURSE_CATEGORIES =
  process.env.NEXT_PUBLIC_LIST_COURSE_CATEGORIES || "/dash/listCourseCategories";
const ADD_COURSE_CATEGORY =
  process.env.NEXT_PUBLIC_ADD_COURSE_CATEGORY || "/dash/addCourseCategory";
const UPDATE_COURSE_CATEGORY =
  process.env.NEXT_PUBLIC_UPDATE_COURSE_CATEGORY || "/dash/updateCourseCategory";
const DELETE_COURSE_CATEGORY =
  process.env.NEXT_PUBLIC_DELETE_COURSE_CATEGORY || "/dash/deleteCourseCategory";
const LIST_COURSE_PRODUCTS =
  process.env.NEXT_PUBLIC_LIST_COURSE_PRODUCTS || "/dash/listCourseProducts";
const ADD_COURSE_PRODUCT =
  process.env.NEXT_PUBLIC_ADD_COURSE_PRODUCT || "/dash/addCourseProduct";
const UPDATE_COURSE_PRODUCT =
  process.env.NEXT_PUBLIC_UPDATE_COURSE_PRODUCT || "/dash/updateCourseProduct";
const DELETE_COURSE_PRODUCT =
  process.env.NEXT_PUBLIC_DELETE_COURSE_PRODUCT || "/dash/deleteCourseProduct";
const SORT_COURSE_ITEMS =
  process.env.NEXT_PUBLIC_SORT_COURSE_ITEMS || "/dash/sortCourseItems";

export interface CourseItem {
  id: string;
  catg: string;
  course: boolean;
  image: string;
  indexing: number;
}

export interface CourseCategoryItem {
  id: string;
  catg: string;
  coursesId: string;
  indexing: number;
}

export interface CourseProductItem {
  id: string;
  productsTitle: string;
  coursesCatgId: string;
  prodcutsImage: string;
  currency: string;
  indexing: number;
  maxCount: number;
}

interface ApiResult<T> {
  status?: boolean;
  message?: string;
  result?: T;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function authOnly(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return { Authorization: `Bearer ${token}` };
}

async function read<T>(res: Response): Promise<ApiResult<T>> {
  return (await res.json()) as ApiResult<T>;
}

export async function listCourses(): Promise<ApiResult<CourseItem[]>> {
  const res = await fetch(`${API_URL}${LIST_COURSES}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return read<CourseItem[]>(res);
}

export async function addCourse(
  catg: string,
  image: File | null,
): Promise<ApiResult<CourseItem>> {
  const form = new FormData();
  form.append("catg", catg);
  if (image) form.append("image", image);
  const res = await fetch(`${API_URL}${ADD_COURSE}`, {
    method: "POST",
    headers: await authOnly(),
    body: form,
  });
  return read<CourseItem>(res);
}

export async function updateCourse(
  id: string,
  catg: string,
  image: File | null,
): Promise<ApiResult<CourseItem>> {
  const form = new FormData();
  form.append("id", id);
  form.append("catg", catg);
  if (image) form.append("image", image);
  const res = await fetch(`${API_URL}${UPDATE_COURSE}`, {
    method: "POST",
    headers: await authOnly(),
    body: form,
  });
  return read<CourseItem>(res);
}

export async function deleteCourse(id: string): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${DELETE_COURSE}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  return read<null>(res);
}

export async function listCourseCategories(
  coursesId: string,
): Promise<ApiResult<CourseCategoryItem[]>> {
  const res = await fetch(`${API_URL}${LIST_COURSE_CATEGORIES}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ coursesId }),
  });
  return read<CourseCategoryItem[]>(res);
}

export async function addCourseCategory(
  coursesId: string,
  catg: string,
): Promise<ApiResult<CourseCategoryItem>> {
  const res = await fetch(`${API_URL}${ADD_COURSE_CATEGORY}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ coursesId, catg }),
  });
  return read<CourseCategoryItem>(res);
}

export async function updateCourseCategory(
  id: string,
  catg: string,
): Promise<ApiResult<CourseCategoryItem>> {
  const res = await fetch(`${API_URL}${UPDATE_COURSE_CATEGORY}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ id, catg }),
  });
  return read<CourseCategoryItem>(res);
}

export async function deleteCourseCategory(id: string): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${DELETE_COURSE_CATEGORY}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  return read<null>(res);
}

export async function listCourseProducts(
  coursesCatgId: string,
): Promise<ApiResult<CourseProductItem[]>> {
  const res = await fetch(`${API_URL}${LIST_COURSE_PRODUCTS}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ coursesCatgId }),
  });
  return read<CourseProductItem[]>(res);
}

export async function addCourseProduct(
  fields: { coursesCatgId: string; productsTitle: string; currency: string; maxCount: number },
  image: File,
): Promise<ApiResult<CourseProductItem>> {
  const form = new FormData();
  form.append("coursesCatgId", fields.coursesCatgId);
  form.append("productsTitle", fields.productsTitle);
  form.append("currency", fields.currency);
  form.append("maxCount", String(fields.maxCount));
  form.append("image", image);
  const res = await fetch(`${API_URL}${ADD_COURSE_PRODUCT}`, {
    method: "POST",
    headers: await authOnly(),
    body: form,
  });
  return read<CourseProductItem>(res);
}

export async function updateCourseProduct(
  fields: { id: string; productsTitle: string; currency: string; maxCount: number },
  image: File | null,
): Promise<ApiResult<CourseProductItem>> {
  const form = new FormData();
  form.append("id", fields.id);
  form.append("productsTitle", fields.productsTitle);
  form.append("currency", fields.currency);
  form.append("maxCount", String(fields.maxCount));
  if (image) form.append("image", image);
  const res = await fetch(`${API_URL}${UPDATE_COURSE_PRODUCT}`, {
    method: "POST",
    headers: await authOnly(),
    body: form,
  });
  return read<CourseProductItem>(res);
}

export async function sortCourseItems(body: {
  kind: "course" | "category" | "product";
  ids: string[];
  coursesId?: string;
  coursesCatgId?: string;
}): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${SORT_COURSE_ITEMS}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return read<null>(res);
}

export async function deleteCourseProduct(id: string): Promise<ApiResult<null>> {
  const res = await fetch(`${API_URL}${DELETE_COURSE_PRODUCT}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  return read<null>(res);
}
