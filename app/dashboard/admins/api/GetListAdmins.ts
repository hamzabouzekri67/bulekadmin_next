/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from "@/app/context/UserContext";
import { AdminData } from "@/app/types/Admins";
import { DriverData } from "@/app/types/Drivers";
import { Preferences } from "@capacitor/preferences";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIST_ADMINS_PATH = process.env.NEXT_PUBLIC_LIST_ADMINS;
const DRIVER_HANDEL_ACCOUNT = process.env.NEXT_PUBLIC_DRIVER_HANDEL_ACCOUNT;

export async function GetAdminsList(
  user: User | null,
  status: string,
  setAdminData: (val: AdminData[]) => void,
  router: AppRouterInstance,
) {
  try {
    const url = `${API_URL}${LIST_ADMINS_PATH}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ id: user?.id }),
    });
    if (res.ok) {
      const detailes = await res.json();

      if (detailes.message === "Invalid Token") {
        localStorage.removeItem("token");
        router.push("/login");
        return null;
      }
      const AdminDetailes: AdminData[] = [];

      for (const key in detailes.result.AdminDetailes) {
        const detailesData: AdminData = detailes.result.AdminDetailes[key];
        AdminDetailes.push(detailesData);
      }

      //  console.log(detailes);

      setAdminData(AdminDetailes);
    }
  } catch (error) {
    //console.log(error);

    return null;
  }
}
