/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from "@/app/context/UserContext";
import { AdminData } from "@/app/types/Admins";
import { DriverData  } from "@/app/types/Drivers";

const API_URL = process.env.NEXT_PUBLIC_API_URL
const LIST_ADMINS_PATH =process.env.NEXT_PUBLIC_LIST_ADMINS
const DRIVER_HANDEL_ACCOUNT =process.env.NEXT_PUBLIC_DRIVER_HANDEL_ACCOUNT


export async function GetAdminsList(user: User | null, status: string, setAdminData: (val: AdminData[]) => void) {

     try {
          
          const url = `${API_URL}${LIST_ADMINS_PATH}`          
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({"id": user?.id}),
           });
           if (res.ok) {
               const detailes = await res.json()
               const AdminDetailes: AdminData[] = [];

                for (const key in detailes.result.AdminDetailes) {
                const detailesData: AdminData = detailes.result.AdminDetailes[key];
                AdminDetailes.push(detailesData);
                }

                console.log(detailes);
                
               setAdminData(AdminDetailes)
              
           }
          
       } catch (error) {
           //console.log(error);
           
           return null
       }
   
    
    
}
