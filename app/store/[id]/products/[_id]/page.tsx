'use client'

import { useCategories ,CartItem} from "@/app/context/CategoryContext";
import { useParams } from "next/navigation";
import {Plus , Minus ,ShoppingBag ,X } from 'lucide-react';
import React, { useState ,useEffect ,useRef} from 'react';

import Image from "next/image";
import { Category, ListOrder, Order,Product, SuplementChoice, Supplement, SupplementItem } from "@/app/types/Orders";
import {UpdateOrder} from "./api/UpdateOrder";
import { useRouter } from "next/navigation";

export default function ProductsStore(){
      const { _id } = useParams();
      const { categories ,order ,cartItems} = useCategories();
      const category = categories.find(c => c._id === _id);
      const [openedProductId, setOpenedProductId] = useState<string | null>(null);
      //console.log(order?.id);
      

      return (
       <div>
        {category?.products.map((e,index)=>(
          <div key={index} className="bg-white p-4 rounded-2xl border hover:shadow-md transition group">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  {/* <img src="https://via.placeholder.com/150" alt="Raghif" className="rounded-xl object-cover w-full h-full" /> */}
                 {!!e.image?(
                   <Image
                  src={e.image}
                  alt={e.title}
                  fill
                  className="object-cover w-full h-full"
                />
                 ):(<div></div>)}
                </div>
                <div className="flex-1">
                  {category.offer ?  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded uppercase">Best Seller</span>:""}
                  <h4 className="font-bold text-lg mt-1">{e.title}</h4>
                  <p className="text-orange-600 font-black text-xl mt-2">{e.price} {e.currency}</p>
                </div>
               <div className="flex justify-center items-center">
                  <QuantitySelector order={order} product={e} cartItems={cartItems || []} openedProductId={openedProductId }  setOpenedProductId={setOpenedProductId} category={category} />
                </div>
              </div>
            </div>
            
        ))}

        <div className={openedProductId ? "hidden" : ""}>
          <FloatingCart cartItems={cartItems || []}  order={order || null}/>
        </div>
      
       </div>

    )
}

interface QuantitySelectorProps {
  order: Order | null;
  product:Product
  cartItems: CartItem[];
  openedProductId: string | null;
  setOpenedProductId: (id: string | null) => void;  
  category:Category;
}
function QuantitySelector({order ,product, cartItems ,setOpenedProductId, openedProductId, category}:QuantitySelectorProps) {
  const { updateCart } = useCategories();
 
  const listProducts = cartItems?.find(item => item.idproducts === product._id)
  const initialQuantity = listProducts ? listProducts.qentity || 0 : 0;
 
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = openedProductId === product._id;

  const [supplementQty, setSupplementQty] = useState<Record<string, number>>({});
  const hasInitRef = useRef(false);
  const [isRequis, setIsRequis] = useState(false);
  const [defaultSupplementQty, setDefaultSupplementQty] =
  useState<Record<string, number>>({});
  const [defaultQuantity, setDefaultQuantity] = useState(0);
  const [defaultChooseList, setDefaultChooseList] = useState<SuplementChoice[]>([]);
  const [chooseList, setChooseList] = useState<SuplementChoice[]>([]);
  const [showTotal, setshowTotal] = useState<number>(0);

  const [quantity, setQuantity] = useState(0);

  useEffect(()=>{
   setQuantity(initialQuantity)

      if (listProducts?.listSuplement) {
          setChooseList(JSON.parse(JSON.stringify(listProducts.listSuplement)));
        } else {
          setChooseList([]);
        }


         const supplementsPrice = chooseList.reduce(
          (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
          0
        );
         const total = product.totla * quantity + supplementsPrice
         setshowTotal(total)

  function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (isOpen) setOpenedProductId(null);
      }
    } 
      
       if (isOpen) {
          setSupplementQty({ ...supplementQty });
          setDefaultSupplementQty({ ...supplementQty });
          setDefaultQuantity(quantity);
          setDefaultChooseList(JSON.parse(JSON.stringify(chooseList)));

          const hasRequis = product.supplements.some((element) => element.chose === 'requis');

          if (!hasRequis && quantity > 0) {
            setIsRequis(true);
          } else {
            setIsRequis(false);
          }
      }

      

     
    if (hasInitRef.current) return;
    if (!order || !product.supplements.length) return;

    

    initSupplementsFromOrder();
    hasInitRef.current = true;

   

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[initialQuantity, isOpen, setOpenedProductId, order?.id, product.id,listProducts?._id]);
  

   const handleClick = (p0: boolean) => {
  
    if (p0) {
      if (isOpen) setOpenedProductId(null);
      else setOpenedProductId(product._id);
    } else {
      handleUpdate(quantity + 1,false);
    }
  };
  
    const initSupplementsFromOrder = () => {
     const qtyInit: Record<string, number> = {};
       
      product.supplements.forEach((sup) => {

            const related = order?.listOrder?.filter(o =>
            o.listSuplement?.some(c =>
              sup.data.some(item => item._id.toString() === c._id.toString())
            )
            ) || [];

           sup.data.forEach((item: SupplementItem) => {
            const foundOrder = related.find((o: ListOrder) =>
              o.listSuplement?.some((c) => c._id.toString() === item._id.toString())
            );
            

            let foundSupplement;
            if (foundOrder) {
              foundSupplement = foundOrder.listSuplement?.find(
                (c) => c._id.toString() === item._id.toString()
              );
            }

             qtyInit[item._id] = foundSupplement ? foundSupplement.qty || 0 : 0;
            });

             
  
       })


       setSupplementQty(qtyInit);  
      };

 


  const handleUpdate = (newQty: number ,isdec:boolean) => {
    if (newQty < 0) return;
   
     const hasRequis = product.supplements.some((element) => element.chose === 'requis');

     if (!hasRequis && newQty > 0) {
        setIsRequis(true);
    }else{
      const ok = checkRequisStatus(newQty);
      setIsRequis(ok);
    }
  

   if (newQty === 0) {
    const resetSupplements: Record<string, number> = {};
    product.supplements.forEach((sup) => {
      sup.data.forEach((item) => {
        resetSupplements[item._id] = 0;
      });
    });

     setIsRequis(false);
        updateCart(
            product._id,
            newQty,
            product,
            chooseList,
            category   
            );
          
          setDefaultSupplementQty({ ...supplementQty });
          setDefaultQuantity(quantity);
          setDefaultChooseList(JSON.parse(JSON.stringify(chooseList)));            
          setOpenedProductId(null);
           setSupplementQty(resetSupplements);
  }   
      
            if (isdec) {
                const qtyInit: Record<string, number> = {};
              setChooseList(prev => {
              const updated = prev.map(element =>
              {
                if (element.status === "requis"){
                qtyInit[element._id] =element.qty       
                return element
                }
                 
                if (element.qty > newQty) {  
                  qtyInit[element._id] =newQty                
                  return { ...element, qty: newQty }
                }
                 qtyInit[element._id] =newQty
                  return  element
              }
              );
                
                 setSupplementQty(qtyInit);
              
               return updated;
              });
          
            //  setSupplementQty(qtyInit);  


            }

       const supplementsPrice = chooseList.reduce(
          (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
          0
        );
         const total = product.totla * newQty + supplementsPrice
         setshowTotal(total)
      
         

    
    setQuantity(newQty);
  };

  const checkRequisStatus = ( qty: number) => {
  const totalRequisQty = chooseList
    .filter(s => s.status === "requis")
    .reduce((sum, s) => sum + (s.qty || 0), 0);

  return totalRequisQty === qty && qty > 0;
};



  const increaseSupplement = (item: SupplementItem, chose: string) => {
     if (quantity === 0) return;
    
     if (supplementQty[item._id] >= quantity) return;



       const listrequis =  chooseList?.filter(sup => sup.status === "requis")
       //console.log(chooseList);
       
       const totalQty = listrequis?.reduce((sum, sup) => sum + (sup.qty || 0), 0);
     

     if (chose === "requis") {
       
        if (listrequis && totalQty && totalQty  >= quantity) {
          return;
        } 
       
     }

      setChooseList(prev => {
        const index = prev.findIndex(e => e._id === item._id);
        const newList = [...prev];

        if (index !== -1) {
          newList[index] = {
            ...newList[index],
            qty: newList[index].qty! + 1,
          };
        } else {
          newList.push({
            id: item.id,
            price: item.plusPrice,
            title: item.name,
            _id: item._id,
            qty: 1,
            status: chose,
          });
        }
         const supplementsPrice = newList.reduce(
          (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
          0
        );
         const total = product.totla * quantity + supplementsPrice
         setshowTotal(total)
       

         if (chose === "requis") {
          const totalRequisQty = newList
            .filter(s => s.status === "requis")
            .reduce((sum, s) => sum + (s.qty || 0), 0);

          setIsRequis(totalRequisQty === quantity);
        }

        return newList;
        });


    
       
     setSupplementQty(prev => ({
    ...prev,
    [item._id]: (prev[item._id] || 0) + 1,
  }));


};


  const decreaseSupplement = (item: SupplementItem, chose: string) => {
     if ((supplementQty[item._id] || 0) <= 0) return;

    setChooseList(prev => {
        const newList = prev.map(s => ({ ...s }));

        const index = newList.findIndex(e => e._id === item._id);
        if (index === -1) return prev;

        newList[index].qty = (newList[index].qty || 0) - 1;

        if (newList[index].qty === 0) {
          newList.splice(index, 1);
        }
        
         const supplementsPrice = newList.reduce(
          (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
          0
        );
         const total = product.totla * quantity + supplementsPrice
         setshowTotal(total)
        if (chose === "requis") {
          const totalRequisQty = newList
            .filter(s => s.status === "requis")
            .reduce((sum, s) => sum + (s.qty || 0), 0);

          setIsRequis(totalRequisQty === quantity);
        }

        return newList;
      });
      
      setSupplementQty(prev => ({
        ...prev,
        [item._id]: Math.max((prev[item._id] || 1) - 1, 0),
      }));

  }

  const handleCloseBottomSheet = () => {
    
  setSupplementQty(defaultSupplementQty);
  setQuantity(defaultQuantity);

  if (listProducts) {
    listProducts.listSuplement = JSON.parse(JSON.stringify(defaultChooseList));
  }

     const newlistrequis =  chooseList?.filter(sup => sup.status === "requis")
      const newQty = newlistrequis?.reduce((sum, sup) => sum + (sup.qty || 0), 0);      

      if (newQty && newQty == quantity) {
        setIsRequis(true);
      } else {
        setIsRequis(false);
      }
  
    setOpenedProductId(null);
  
};

  return (
    <div className="flex items-center gap-3 bg-gray-200 rounded-full p-1 min-w-25 justify-between shadow-inner">
      <button 
        onClick={() => handleClick(true)}
        className={`p-1.5 rounded-full transition-all ${
          quantity > 0 ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 cursor-not-allowed'
        }`}
      >
        <Minus size={18} strokeWidth={3} />
      </button>

      <span className="font-black text-lg w-6 text-center select-none">
        {quantity}
      </span>

      <button 
        onClick={() => handleClick(true)}
        className="p-1.5 rounded-full bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-all active:scale-90"
      >
        <Plus size={18} strokeWidth={3} />
      </button>

      {isOpen && (
  <>
    {/* الخلفية المعتمة */}
    <div
      className="fixed inset-0 bg-black/40 z-40"
      onClick={handleCloseBottomSheet}
    />

    {/* Bottom Sheet */}
    <div
      ref={menuRef}
      className={`fixed bottom-0 left-0 right-0 max-h-[70%] bg-white z-50
                 shadow-2xl rounded-t-2xl transform transition-transform duration-300
                 flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-800">اختر الإضافات</h2>
        <button onClick={() => setOpenedProductId(null)}>
          <X size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-b">
      <div>
        <h2 className="text-lg font-bold text-gray-800">{category.category}/{product.title}</h2>
        <h2 className="text-lg text-gray-800">{product.price} {product.currency}</h2>
      </div>
        
        <div className="flex items-center gap-3 bg-gray-200 rounded-full p-1 min-w-25 justify-between shadow-inner">
          <button 
            onClick={() => handleUpdate(quantity-1,true)}
            className={`p-1.5 rounded-full transition-all ${
              quantity > 0 ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <Minus size={18} strokeWidth={3} />
          </button>

          <span className="font-black text-lg w-6 text-center select-none">
            {quantity}
          </span>

          <button 
            onClick={() => handleUpdate(quantity+1,false)}
            className="p-1.5 rounded-full bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-all active:scale-90"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
      

      {/* Body */}
      <div className="p-4 overflow-y-auto flex-1">
        {product.supplements.map((sup: Supplement, i: number) => (
          <div key={i}>
            {/* عنوان المجموعة */}
            <div className="flex justify-between items-center mb-4">
              <p className="font-semibold text-gray-800">{sup.title}</p>
              <span className="text-orange-500 font-bold">{sup.chose}</span>
            </div>

            {/* عناصر الإضافات */}
            <div className="space-y-3">
              {sup.data.map((item: SupplementItem) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 border rounded-xl
                             hover:bg-orange-50 transition"
                >
                  <div className=" items-center gap-3">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <span className="font-bold text-orange-600">
                      {item.plusPrice > "0" ? `+${item.plusPrice} ${product.currency}` : "مجاني"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                    <button
                      onClick={() => decreaseSupplement(item,sup.chose)}
                      className="w-7 h-7 flex items-center justify-center rounded-full
                                 bg-white shadow text-gray-600"
                    >
                      −
                    </button>

                    <span className="w-5 text-center font-bold">
                      {supplementQty[item._id] || 0}
                    </span>

                    <button
                      onClick={() => increaseSupplement(item,sup.chose)}
                      className="w-7 h-7 flex items-center justify-center rounded-full
                                 bg-orange-500 text-white shadow"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* زر التأكيد لتحديث السلة */}
      <div className="p-4 border-t">
        <button
          onClick={isRequis ?() =>  {
              updateCart(
              product._id,
              quantity,
              product,
              chooseList,
              category 
             );

              setDefaultSupplementQty({ ...supplementQty });
              setDefaultQuantity(quantity);
              setDefaultChooseList(JSON.parse(JSON.stringify(chooseList)));
              setOpenedProductId(null);
          }:undefined}
          className={`w-full font-bold py-3 rounded-xl shadow-md transition-all
          ${isRequis
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          تحديث السلة  ({showTotal})
        </button>
      </div>
    </div>
  </>
)}


    </div>
  );
}

interface FloatingCartProps {
  cartItems: CartItem[]; 
  order:Order|null
}

function FloatingCart({ cartItems ,order}: FloatingCartProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const totalItems = cartItems.reduce((a, i) => a + (i.qentity || 0), 0);
  const totalPrice = cartItems.reduce((a, i) => a + (i.totalprice || 0), 0);

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative bg-orange-600 p-2 rounded-xl">
              <ShoppingBag size={20} />
              <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[11px] font-black rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase opacity-50 font-black">Total</p>
              <p className="font-black text-xl">
                {totalPrice.toLocaleString()} DZD
              </p>
            </div>
          </div>

          {/* زر خرافي */}
          <button
            onClick={() => setOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-xl 
                       font-black text-sm shadow-lg transition-all
                       animate-pulseBtn active:scale-95"
          >
            Commander
          </button>
        </div>
      </div>

      {/* Overlay + Bottom Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* خلفية مع Blur */}
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 animate-fadeBlur"
          />

          {/* Bottom Sheet */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-4 animate-sheetUp">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-black text-lg">تفاصيل الطلب</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* قائمة الطلبات */}
           <div className="max-h-[65vh] overflow-y-auto px-4 py-3 space-y-3">
                 {cartItems.map((item, index) => {
                                const sups = item.listSuplement || [];

                                return (
                                  <div
                                    key={index}
                                    className="bg-gray-50 rounded-xl p-3 border animate-itemIn"
                                    style={{ animationDelay: `${index * 80}ms` }}
                                  >
                                    <div className="flex justify-between font-black">
                                      <span>
                                        {item.title} × {item.qentity} ({item.originalPrice})
                                      </span>
                                      <span>
                                        {(item.totalprice || 0).toLocaleString()} DZD
                                      </span>
                                    </div>

                                    {/* الإضافات */}
                                    {sups.length > 0 && (
                                      <div className="mt-2 ml-3 space-y-1 text-sm text-gray-700">
                                        {sups.map((sup, i) => {
                                           const lineTotal = Number(sup.price) * (sup.qty || 0)
                                         
                                        //  const lineTotal = Number(sup.price) * (sup.qty || 0)+ Number(item.price);

                                          return (
                                            <div
                                              key={i}
                                              className="flex justify-between"
                                            >
                                              <span>
                                                ➕ {sup.title} × {sup.qty}
                                              </span>
                                              <span className="font-semibold">
                                                +{lineTotal.toLocaleString()} DZD
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>


            {/* المجموع */}
            <div className="mt-4 flex justify-between font-black text-lg">
              <span>Total</span>
              <span>{totalPrice.toLocaleString()} DZD</span>
            </div>

            {/* زر تأكيد */}
            <button onClick={()=>{
               UpdateOrder({order,cartItems,router})
              
            }} className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-black transition-all active:scale-95">
              تأكيد الطلب
            </button>
          </div>
        </div>
      )}
    </>
  );
}