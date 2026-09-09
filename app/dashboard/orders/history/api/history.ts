
import { Preferences } from "@capacitor/preferences";
import { User } from "../../../../context/UserContext";


const API_URL = process.env.NEXT_PUBLIC_API_URL;
const HISTORY_ORDER = process.env.NEXT_PUBLIC_HISTORY_ORDER

export async function GetOrdersHistory(user: User) {
  try {
    const { value: token } = await Preferences.get({ key: "token" });
     const url = `${API_URL}${HISTORY_ORDER}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        id: user?.id,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    //console.log(error);
    return null;
  }
}
