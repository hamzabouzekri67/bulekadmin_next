/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from "@/app/context/UserContext";
import { DriverData } from "@/app/types/Drivers";
import { Preferences } from "@capacitor/preferences";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DRIVER_LIST_PATH = process.env.NEXT_PUBLIC_FETCH_DRVIER_LIST;
const DRIVER_HANDEL_ACCOUNT = process.env.NEXT_PUBLIC_DRIVER_HANDEL_ACCOUNT;

export async function GetDriverList(
  user: User | null,
  status: string,
  setDriverData: (val: DriverData[]) => void,
  router: ReturnType<typeof useRouter>,
) {
  try {
    const url = `${API_URL}${DRIVER_LIST_PATH}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      //credentials: "include",
      body: JSON.stringify({
        page: 1,
        limit: 10,
        ville: user?.ville,
        status: status,
      }),
    });
    if (res.ok) {
      const detailes = await res.json();

      if (detailes.message === "Invalid Token") {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      const fetDriverData: DriverData[] = [];

      for (const key in detailes.result.data) {
        const detailesData: DriverData = detailes.result.data[key];
        fetDriverData.push(detailesData);
      }

      setDriverData(fetDriverData);
    }
  } catch (error) {
    //console.log(error);

    return null;
  }
}

export async function handelAccountDriver(
  driverDetailes: DriverData,
  active: boolean,
) {
  try {
    const url = `${API_URL}${DRIVER_HANDEL_ACCOUNT}`;
    const { value: token } = await Preferences.get({ key: "token" });
    if (!driverDetailes.postionsDriver) return;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, },
      credentials: "include",
      body: JSON.stringify({
        driverId: driverDetailes._id,
        token: driverDetailes.notificationsToken,
        coordinates: driverDetailes.postionsDriver.coordinates,
        isAccountActive: active,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.result;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
