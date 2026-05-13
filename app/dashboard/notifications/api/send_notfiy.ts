import { User } from "@/app/context/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SEND_NOTIFICATIONS = process.env.NEXT_PUBLIC_SEND_NOTIFICATIONS;

export async function sendNotifications(
  user: User | null,
  formData: { topic: string; title: string; message: string },
  //  selectedOffer: Promotion | null,
  // setAppliedOffers: React.Dispatch<React.SetStateAction<string[]>>,
) {
  try {
    const url = `${API_URL}${SEND_NOTIFICATIONS}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        assistBy: user?.id,
        topic: formData.topic,
        message: formData.message,
        title: formData.title,
      }),
    });
    if (res.ok) {
      const detailes = await res.json();
      if (detailes.result) {
        //  setAppliedOffers((prev) => [...prev, detailes.result.offerId]);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}
