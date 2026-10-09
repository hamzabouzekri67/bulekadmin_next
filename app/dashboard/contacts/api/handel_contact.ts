import { User } from "@/app/context/UserContext";
import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FETCH_CONTECT = process.env.NEXT_PUBLIC_FETCH_CONTECT;
const ADD_CONTECT = process.env.NEXT_PUBLIC_ADD_CONTECT;

export async function fetchApiContacts(user: User | null) {
  try {
    const url = `${API_URL}${FETCH_CONTECT}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        ville: user?.ville,
        country: user?.country,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(data);

      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function addApiContacts(
editingId: string | null, name: string, phoneNumber: string, selectedCountry: string, type: string, category: string, wilaya: string,
) {
  try {
    const url = `${API_URL}${ADD_CONTECT}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        editingId:editingId,
        name: name,
        phoneNumber:phoneNumber,
        selectedCountry:selectedCountry,
        type:type,
        category:category,
        ville:wilaya
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(data);

      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}


export async function editApiContacts(
editingId: string | null, name: string, phoneNumber: string, selectedCountry: string, type: string, category: string, wilaya: string,
) {
  try {
    const url = `${API_URL}${ADD_CONTECT}`;
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        editingId:editingId,
        name: name,
        phoneNumber:phoneNumber,
        selectedCountry:selectedCountry,
        type:type,
        category:category,
        ville:wilaya
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(data);

      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
