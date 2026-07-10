import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const UPDATE_STATUS_DRIVER = process.env.NEXT_PUBLIC_UPDATE_STATUS_DRIVER;

export async function updateStatusDriver(_id: string | undefined) {
  try {
    const url = `${API_URL}${UPDATE_STATUS_DRIVER}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
     // credentials: "include",
      body: JSON.stringify({ driverId: _id, status: "completed" }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    //console.log(error);

    return null;
  }
}
