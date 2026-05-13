/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from "@/app/context/UserContext";
import { AdminData } from "@/app/types/Admins";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIST_ADMINS_PATH = process.env.NEXT_PUBLIC_LIST_AGENTS;
const ADD_AMOUNTE_PATH = process.env.NEXT_PUBLIC_ADD_AMOUNT_ADMINE;

export async function GetAgentList(
  id: string,
  setAdminData: (val: AdminData[]) => void,
  setSingleAdmin?: (val: AdminData) => void,
) {
  try {
    const url = `${API_URL}${LIST_ADMINS_PATH}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: id }),
    });

    if (res.ok) {
      const detailes = await res.json();

      if (detailes.result) {
        const localAgentsRaw = detailes.result.localAgents || [];
        const formattedAgents: AdminData[] = [];

        for (const key in localAgentsRaw) {
          formattedAgents.push(localAgentsRaw[key]);
        }

        setAdminData(formattedAgents);

        if (setSingleAdmin && detailes.result.adminInfo) {
          setSingleAdmin(detailes.result.adminInfo);
        }

        console.log("Données chargées :", detailes.result);
      }
    }
  } catch (error) {
    console.error("Erreur GetAgentList:", error);
    return null;
  }
}

export async function AddAmountAdmin(user: User | null , id:string,amount:string) {
  try {
    const url = `${API_URL}${ADD_AMOUNTE_PATH}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sendId: user?.id,reciverId:id,amount:amount }),
    });

    if (res.ok) {
      const detailes = await res.json();
       console.log(detailes);

      if (detailes.result) {
      
       
      }
    }
  } catch (error) {
    console.error("Erreur GetAgentList:", error);
    return null;
  }
}
