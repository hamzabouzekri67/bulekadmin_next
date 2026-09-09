import { User } from "@/app/context/UserContext";
import { Order, Driver } from "@/app/types/Orders";
import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FETCH_ORDER = process.env.NEXT_PUBLIC_FETCH_ORDER;

export async function GetOrdersPending(
  user: User | null,
  orderId: string,
  callback: (order: Order) => void,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setDriversList: (drivers: Driver[]) => void,
  setDriver: (order: Driver) => void,
) {
  try {
    const url = `${API_URL}${FETCH_ORDER}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
   //   credentials: "include",
      body: JSON.stringify({
        ville: user?.ville,
        id: user?.id,
        orderId: orderId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result.orders.length <= 0) return null;

      const order: Order = data.result.orders[0];
      callback(order);
      if (order.driver) {
        order.driver.id = order.driver._id;
        setDriver(order.driver);
        //setCurrentDriver(null);
      } else if (Array.isArray(data.result.driver)) {
        const formattedDrivers = data.result.driver.map((d: Driver) => ({
          ...d,
          id: d._id,
        }));
        setDriversList(formattedDrivers);
      }
      setLoading(false);
      return data.result[0];
    }
    setLoading(false);
    return null;
  } catch (error) {
    //console.log(error);
    setLoading(false);
    return null;
  }
}
