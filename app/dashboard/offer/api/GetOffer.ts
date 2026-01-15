import { User } from "@/app/context/UserContext";
import { Promotion } from "@/app/types/offer";


const API_URL = process.env.NEXT_PUBLIC_API_URL
const FETCH_OFFER=process.env.NEXT_PUBLIC_FETCH_OFFER
const USE_OFFER_ADMIN = process.env.NEXT_PUBLIC_USE_OFFER_ADMIN

export async function GetOfferList(setStoreData: (val: Promotion[],) => void, setAppliedOffers: React.Dispatch<React.SetStateAction<string[]>>) {

     try {
          
          const url = `${API_URL}${FETCH_OFFER}`          
   
          const res = await fetch(url, {
           method: "GET",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           });
           if (res.ok) {
               const detailes = await res.json()
               const getOfferData: Promotion[] = [];  
                for (const key in detailes.result) {                    
                const detailesData: Promotion = detailes.result[key];
                 console.log(detailesData.addId);

                 if (detailesData.addId !== null) {
                   setAppliedOffers(prev => [...prev, detailesData.addId || ""]);
                 }
                 
               
                
                 getOfferData.push(detailesData);
                }

                
                
                                 
                setStoreData(getOfferData)
           }
          
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
       } catch (error) {
           return null
       
 }
  
}

export async function addOfferAdmin(user: User | null, selectedOffer: Promotion | null, setAppliedOffers: React.Dispatch<React.SetStateAction<string[]>>) {

     try {
          
          const url = `${API_URL}${USE_OFFER_ADMIN}`          
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({"ville": user?.ville, "assistBy": user?.id,"offer":selectedOffer}),
           });
           if (res.ok) {
                const detailes = await res.json()
                if (detailes.result) {
                    
                 setAppliedOffers(prev => [...prev, detailes.result.offerId]);
                }
                
               
                
           }
          
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
       } catch (error) {
           return null
       
 }
  
}