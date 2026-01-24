// "use client";

// import { useState } from "react";
// import { Order } from "@/app/types/Orders";
// import { AcceptedOrders } from "../api/HandleOrders";
// import { User } from "../../../../context/UserContext";
// import { useOrders } from "../../../../context/UserOrdersContext";


// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
//   DialogClose
// } from "@/components/ui/dialog";

// interface NewOrdersProps {
//   orders: Order;
//   user: User | null
// }

// export default function OrderTimeDialog({orders,user}:NewOrdersProps) {
//   const [minutes, setMinutes] = useState(5);
//   const { newOrders , setNewOrders , orderEnCours,setOrderEnCours } = useOrders();

//   const increase = () => {
//     if (minutes < 60) setMinutes(minutes + 1);
//   };

//   const decrease = () => {
//     if (minutes > 5) setMinutes(minutes - 1);
//   };

//   const handleConfirm = () => {
//     if (!user) return
//     AcceptedOrders(orders,minutes,user,newOrders,setNewOrders)
//     //alert(`تم تحديد وقت الطلب: ${minutes} دقيقة`);
//   };

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <button className="bg-blue-600 text-white text-sm py-1 rounded-md hover:bg-blue-700 transition p-4">
//          Accepter
//         </button>
//       </DialogTrigger>

//       {/* محتوى الـ Dialog */}
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>تحديد وقت تجهيز الطلب</DialogTitle>
//           <DialogDescription>
//             استخدم الأزرار لاختيار الوقت (5 - 60 دقيقة)
//           </DialogDescription>
//         </DialogHeader>

//         {/* أزرار زيادة ونقصان الوقت */}
//         <div className="py-4 flex items-center justify-center gap-4">
//           <button
//             onClick={decrease}
//             className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-lg font-bold"
//           >
//             -
//           </button>

//           <span className="text-xl font-semibold">{minutes} دقيقة</span>

//           <button
//             onClick={increase}
//             className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-lg font-bold"
//           >
//             +
//           </button>
//         </div>

//         {/* أزرار الإغلاق والتأكيد */}
//         <DialogFooter className="flex justify-end gap-2">
//           <DialogClose className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
//             إلغاء
//           </DialogClose>
//           <button
//             onClick={handleConfirm}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//           >
//             تأكيد
//           </button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import { useState } from "react";
import { Order } from "@/app/types/Orders";
import { AcceptedOrders } from "../api/HandleOrders";
import { User } from "../../../../context/UserContext";
import { useOrders } from "../../../../context/UserOrdersContext";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface NewOrdersProps {
  orders: Order;
  user: User | null;
}

export default function OrderTimeDialog({ orders, user }: NewOrdersProps) {
  // الوقت الأول والوقت الثاني
  const [firstTime, setFirstTime] = useState(5);
  const [secondTime, setSecondTime] = useState(5);

  const { newOrders, setNewOrders } = useOrders();

  const increase = (type: "first" | "second") => {
    if (type === "first" && firstTime < 60) setFirstTime(firstTime + 1);
    if (type === "second" && secondTime < 60) setSecondTime(secondTime + 1);
  };

  const decrease = (type: "first" | "second") => {
    if (type === "first" && firstTime > 5) setFirstTime(firstTime - 1);
    if (type === "second" && secondTime > 5) setSecondTime(secondTime - 1);
  };

  const handleConfirm = () => {
    if (!user) return;
    // أرسل الوقتين مع الطلب
     AcceptedOrders(orders, firstTime , user, newOrders, setNewOrders ,secondTime);
    //alert(`تم تحديد وقت الطلب: ${firstTime} دقيقة و ${secondTime} دقيقة إضافية`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-blue-600 text-white text-sm py-1 rounded-md hover:bg-blue-700 transition p-4">
          Accepter
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تحديد وقت تجهيز الطلب</DialogTitle>
          <DialogDescription>
            استخدم الأزرار لاختيار الوقتين (5 - 60 دقيقة لكل وقت)
          </DialogDescription>
        </DialogHeader>

        {/* الوقت الأول */}
        <div className="py-4 flex items-center justify-center gap-4">
          <button
            onClick={() => decrease("first")}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-lg font-bold"
          >
            -
          </button>
          <span className="text-xl font-semibold">{firstTime} دقيقة للعميل</span>
          <button
            onClick={() => increase("first")}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-lg font-bold"
          >
            +
          </button>
        </div>

        {/* الوقت الثاني */}
        <div className="py-4 flex items-center justify-center gap-4">
          <button
            onClick={() => decrease("second")}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-lg font-bold"
          >
            -
          </button>
          <span className="text-xl font-semibold">{secondTime} دقيقة للسائق</span>
          <button
            onClick={() => increase("second")}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-lg font-bold"
          >
            +
          </button>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <DialogClose className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            إلغاء
          </DialogClose>

           <DialogClose onClick={handleConfirm} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            تأكيد
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
