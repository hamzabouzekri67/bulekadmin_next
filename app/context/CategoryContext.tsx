"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Category, ListOrder, Order, Product, SuplementChoice, SupplementItem } from "@/app/types/Orders";
import { GetProducts } from "../store/api/GetProducts"; 

interface CategoryContextType {
  categories: Category[];
  order:Order|null,
  loading: boolean;
  fetchCategories: (storeId: string , orderId:string | null) => Promise<boolean>;
  updateCart: (productId: string, quantity: number, productDetails: Product, supplements: SuplementChoice[],category:Category ) => void;
  cartItems: CartItem[];

}

const CategoryContext = createContext<CategoryContextType>({
  categories: [],
  loading: true,
  order:null,
  fetchCategories: async () => false,
  updateCart: (productId: string, quantity: number, productDetails: Product, supplements: SuplementChoice[],category:Category ) => {},
  cartItems: []
});

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setproduct] = useState<CartItem[]>([]);
  const [order, setorder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async (storeId: string , orderId:string | null) => {
    setLoading(true);
    const result = await GetProducts(storeId, setCategories ,orderId,setorder);
    setLoading(false);  
    return result;
  };
    
     
     
  useEffect(() => {
  if (!order?.listOrder?.length) return;

  setproduct((prev) => {
    const newList = [...prev];

    order.listOrder.forEach((item) => {
      if (!item.qentity || item.qentity <= 0) return;

      const exists = newList.find(
        (ci) => ci.idproducts === item.idproducts
      );

      if (!exists) {        
        newList.push({
          idproducts: item.idproducts,
          qentity: item.qentity,
          title: item.title,
          originalPrice:item.originalPrice,
          totalprice: item.totalprice,
          currency: item.currency || "DZD",
          image: "",
          listSuplement: item.listSuplement || [], 
          messageOrder:"",
          offer: item.offer || false,
          category:item.category || ""
        });
      }
    });

    return newList;
  });
}, [order]);



     
       const updateCart = (
            productId: string,
            quantity: number,
            productDetails: Product,
            supplements: SuplementChoice[] = [],
            category: Category
            ) => {
            setproduct((prev) => {

              let newList = [...prev];

               //console.log(" New Cart Items: ", newList);

              const itemIndex = newList.findIndex(
                (item) => item.idproducts === productDetails._id
              );

              const price = productDetails.totla || 0;

              const supplementsPrice = supplements.reduce(
              (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
              0
            );

                //console.log('New unitTotal: ',  price * quantity + supplementsPrice );

              if (quantity <= 0) {
                if (itemIndex > -1) {
                  newList = newList.filter(
                    (item) => item.idproducts !== productDetails._id
                  );
                }
                return newList;
              }

              if (itemIndex > -1) {
                newList[itemIndex] = {
                  ...newList[itemIndex],
                  qentity: quantity,
                  totalprice: price * quantity + supplementsPrice,
                  listSuplement: supplements,
                };
                return newList;
              }

              newList.push({
                idproducts: productId,
                qentity: quantity,
                title: productDetails.title,
                originalPrice:price,
                totalprice: price * quantity + supplementsPrice,
                currency: productDetails.currency || "DZD",
                image: productDetails.image,
                listSuplement: supplements,
                messageOrder:"",
                offer:category.offer,
                category:category.category
                
               // offer:order.l
                
              });
              
              return newList;
            });
            };


  return (
    <CategoryContext.Provider value={{ categories, loading, fetchCategories ,order ,updateCart , cartItems: product }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoryContext);
}

 export type CartItem = Partial<Product> & {
  idproducts: string;
  qentity: number;
  totalprice: number;
  originalPrice?: number ;
  listSuplement?: SuplementChoice[];
  messageOrder:string,
  offer:boolean,
  category:string
  
  
};