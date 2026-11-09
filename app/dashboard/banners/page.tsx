"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Power, Search, Trash2 } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { StoreData } from "@/app/types/store";
import type { BannerItem } from "@/app/types/banner";
import { searchandFindStore } from "../featured/api/api_featured";
import {
  addBanner,
  deleteBanner,
  listBanners,
  setBannerStatus,
} from "./api/banner";



const inputClass =
  "w-full p-3 border border-gray-200 rounded-xl text-sm bg-white";

export default function BannersPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState("0");
  const [storeId, setStoreId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [storeQuery, setStoreQuery] = useState("");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  

  const showNotice = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  const loadBanners = async () => {
    setLoadingList(true);
    try {
      const data = await listBanners();
      if (data.status && Array.isArray(data.result)) {
        setBanners(data.result);
      } else {
        showNotice(false, data.message || "load failed");
      }
    } catch {
      showNotice(false, "conn failed");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "super_admin") {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    void loadBanners();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      setLoadingStores(true);
      try {
        const data = await searchandFindStore(storeQuery, router);
        setStores(Array.isArray(data) ? data : []);
      } catch {
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [storeQuery, ready, router]);

  const chooseStore = (store: StoreData) => {
    setStoreId(store._id);
    setStoreQuery(store.nameEtabliss);
  };

  const submitBanner = async (event: FormEvent) => {
    event.preventDefault();
    if (!storeId.trim()) {
      showNotice(false, "store required");
      return;
    }
    if (!image) {
      showNotice(false, "image required");
      return;
    }
    setSaving(true);
    try {
      const data = await addBanner(
        { storeId: storeId, title: title, order: order },
        image,
      );
      showNotice(Boolean(data.status), data.message || "save failed");
      if (data.status) {
        setTitle("");
        setOrder("0");
        setImage(null);
        setStoreId("");
        setStoreQuery("");
        await loadBanners();
      }
    } catch {
      showNotice(false, "conn failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleBanner = async (item: BannerItem) => {
    const id = item.id || item._id;
    if (!id) return;
    setBusyId(id);
    try {
      const data = await setBannerStatus(id, !item.isActive);
      showNotice(Boolean(data.status), data.message || "update failed");
      if (data.status) await loadBanners();
    } catch {
      showNotice(false, "conn failed");
    } finally {
      setBusyId("");
    }
  };

  const removeBanner = async (item: BannerItem) => {
    const id = item.id || item._id;
    if (!id) return;
    setBusyId(id);
    try {
      const data = await deleteBanner(id);
      showNotice(Boolean(data.status), data.message || "delete failed");
      if (data.status) await loadBanners();
    } catch {
      showNotice(false, "conn failed");
    } finally {
      setBusyId("");
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto text-right" dir="rtl">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-red-600 p-2.5 rounded-xl text-white">
          <ImagePlus size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-950">Banners slider</h1>
          <p className="text-sm text-gray-500 mt-0.5">banner</p>
        </div>
      </div>
      {notice && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${noticeOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form
          onSubmit={submitBanner}
          className="lg:col-span-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4"
        >
          <h2 className="font-bold text-gray-800">new banner</h2>
          <div className="border border-gray-100 rounded-xl p-3">
            <div className="relative mb-3">
              <Search
                className="absolute right-3 top-3.5 text-gray-400"
                size={18}
              />
              <input
                className={`${inputClass} pr-10`}
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
                placeholder="search store"
              />
            </div>
            {loadingStores ? (
              <Loader2
                className="animate-spin text-gray-400 mx-auto"
                size={18}
              />
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {stores.slice(0, 6).map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => chooseStore(s)}
                    className="w-full text-right px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-700"
                  >
                    {s.nameEtabliss}
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-2">
              store id
            </span>
            <input
              className={inputClass}
              value={storeId}
              readOnly
              placeholder="choose"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-2">
              title
            </span>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="titre"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-2">
              order
            </span>
            <input
              type="number"
              className={inputClass}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-2">
              image
            </span>
            <input
              type="file"
              accept="image/*"
              className={inputClass}
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-60"
          >
            {saving ? "wait" : "add"}
          </button>
        </form>

        <section className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          {loadingList ? (
            <p className="text-sm text-gray-500">wait</p>
          ) : banners.length === 0 ? (
            <p className="text-sm text-gray-500">empty</p>
          ) : (
            <div className="space-y-3">
              {banners.map((it:BannerItem) => {
                const id = it.id || it._id;
                const busy = busyId === id;
                return (
                  <article
                    key={id}
                    className="border border-gray-100 rounded-xl overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.imageUrl}
                      alt={it.title || "banner"}
                      className="w-full h-32 object-cover"
                    />
                    <div className="flex items-center justify-between gap-2 p-3">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {it.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleBanner(it)}
                          className={`p-2 rounded-lg disabled:opacity-50 ${it.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {busy ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Power size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeBanner(it)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
