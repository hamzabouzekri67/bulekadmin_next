import { User } from "../../../../context/UserContext";

export async function GetOrdersPending(url: string, user:User) {
    try {

       const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({"ville": user?.ville, "id": user?.id ,status: "pending"}),
        });
        if (res.ok) {
         return await res.json();   
        }
        return null
        
    } catch (error) {
        //console.log(error);
        return null
    }
 
}