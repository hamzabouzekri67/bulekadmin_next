import { DriverData } from "@/app/types/Drivers";
import { AmountItem, PaymentInfo } from "@/app/types/PaymentInfo";
import { Preferences } from "@capacitor/preferences";
import { Dispatch, SetStateAction } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GET_DERIVER_DETAILES = process.env.NEXT_PUBLIC_GET_DRIVER_DETAILES;
const GET_LIST_AMOUNT = process.env.NEXT_PUBLIC_GET_LIST_AMOUNT;
const SEND_AMOUNT_DRIVER = process.env.NEXT_PUBLIC_SEND_AMOUNT_DRIVER;

export async function GetDriverDetailes(
  driverId: string,
  setlistPayement: (paymentInfo: PaymentInfo[]) => void,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setDriverDetailes: Dispatch<SetStateAction<DriverData | null>>,
) {
  try {
    const url = `${API_URL}${GET_DERIVER_DETAILES}`;

    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ driverId: driverId }),
    });
    if (res.ok) {
      const data = await res.json();

      if (data.status === false) return;
      console.log(data.result);

      if (data.result) {
        setlistPayement(data.result.payment);
        setDriverDetailes(data.result.driverDetailes);
      }
    }

    setLoading(false);
  } catch (error) {
    //console.log(error);

    return null;
  }
}
type ApiResponse = {
  result: AmountItem[];
};
export async function GetAmountList(
  setListAmount: Dispatch<SetStateAction<AmountItem[]>>,
) {
  try {
    const url = `${API_URL}${GET_LIST_AMOUNT}`;

    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      setListAmount(data.result);
    }
  } catch (error) {
    //console.log(error);

    return null;
  }
}

export async function SendAmountDriver(payload: {
  notificationsToken: string;
  driverId: string;
  id: string;
  amount: number;
  bonus: number;
  adminId: unknown;
}) {
  try {
    const url = `${API_URL}${SEND_AMOUNT_DRIVER}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result.status) {
        alert("تمت العملية بنجاح! الصفحة ستُعاد تحميلها.");
        window.location.reload();
      } else {
        alert(data.result.message);
      }
    }
  } catch (error) {
    //console.log(error);

    return null;
  }
}
