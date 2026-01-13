import { User } from "@/app/context/UserContext";
import { StoreData } from "@/app/types/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL
const LIST_STORE=process.env.NEXT_PUBLIC_LIST_STORE
const UPDATE_STATUS_STORE =process.env.NEXT_PUBLIC_LIST_UPDATE_STATUS_STORE
const ACCEPTED_STORE_SENT =process.env.NEXT_PUBLIC_LIST_ACCEPTED_STORE_SENT


export async function GetStoreList(user: User, activeTab: string ,setStoreData: (val: StoreData[]) => void) {

     try {
          
          const url = `${API_URL}${LIST_STORE}`          
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({"ville": user?.ville, "status": activeTab}),
           });
           if (res.ok) {
              const detailes = await res.json()
              const fetDriverData: StoreData[] = [];
              

                for (const key in detailes.result) {
                const detailesData: StoreData = detailes.result[key];
                fetDriverData.push(detailesData);
                }

                
                setStoreData(fetDriverData)
                           
              
           }
          
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
       } catch (error) {
           //console.log(error);
           
           return null
       }
   
    
    
}

export async function handleOnlineStatus(v: StoreData, status: boolean) {

     try {
          
          const url = `${API_URL}${UPDATE_STATUS_STORE}`          
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({"storeId": v._id,"status":status}),
           });
           if (res.ok) {
               const detailes = await res.json()
               if (detailes.result) {
                 return detailes.result.isOpen
               }else{
                alert('verify connections')
               }
               
           }
          
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
       } catch (error) {
           //console.log(error);
           
           return null
       }
   
    
    
}

export async function acceptedStoreSent(v: StoreData, status: string,) {

     try {
          
          const url = `${API_URL}${ACCEPTED_STORE_SENT}`          
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({"storeId": v._id,'status':status}),
           });
           if (res.ok) {
               const detailes = await res.json()
               if (detailes.result) {
                 return detailes.result.status
               }else{
                alert('verify connections')
               }
               
           }
          
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
       } catch (error) {
           //console.log(error);
           
           return null
       }
   
    
    
}

