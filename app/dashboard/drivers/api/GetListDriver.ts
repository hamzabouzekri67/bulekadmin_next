/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from "@/app/context/UserContext";
import { DriverData  } from "@/app/types/Drivers";

const API_URL = process.env.NEXT_PUBLIC_API_URL
const DRIVER_LIST_PATH =process.env.NEXT_PUBLIC_FETCH_DRVIER_LIST
const DRIVER_HANDEL_ACCOUNT =process.env.NEXT_PUBLIC_DRIVER_HANDEL_ACCOUNT


export async function GetDriverList(user: User | null, status: string, setDriverData: (val: DriverData[]) => void) {

     try {
          
          const url = `${API_URL}${DRIVER_LIST_PATH}`          
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({'page': 1, 'limit': 10, "ville": user?.ville, "status": status}),
           });
           if (res.ok) {
               const detailes = await res.json()
               const fetDriverData: DriverData[] = [];

                for (const key in detailes.result.data) {
                const detailesData: DriverData = detailes.result.data[key];
                fetDriverData.push(detailesData);
                }

                //console.log(fetDriverData);
                
                setDriverData(fetDriverData)
              
           }
          
       } catch (error) {
           //console.log(error);
           
           return null
       }
   
    
    
}

export async function handelAccountDriver(driverDetailes: DriverData, active: boolean,) {
   try {
      const url = `${API_URL}${DRIVER_HANDEL_ACCOUNT}`    
     if (!driverDetailes.postionsDriver) return
      const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({'driverId':driverDetailes._id,'token':driverDetailes.notificationsToken ,'coordinates': driverDetailes.postionsDriver.coordinates, "isAccountActive":active}),
     });
 
     if (res.ok) {
        const data = await res.json()
        return !!data.result
     }else {
        return false
     }
 
   } catch (error) {
      return false
   }
    
}