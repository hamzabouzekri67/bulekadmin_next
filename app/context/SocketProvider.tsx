// context/SocketProvider.tsx
"use client";
import { createContext, useContext, useRef, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "./UserContext";

export const SocketContext = createContext<{socket: Socket|null, ready: boolean}>({socket:null, ready:false});

export default function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [ready, setReady] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    socketRef.current = io("https://api.bulekeats.com", {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("🟢 Socket connected بعد refresh ✔");
      socketRef.current?.emit('connectedUser', {"userId": user?.id});
      socketRef.current?.emit('joinAdmin', {"role": `admin_${user?.ville.toLowerCase()}`});
      
      setReady(true);
    });

    socketRef.current.on("disconnect", () => {
      //console.log("🔴 Socket disconnected");
      setReady(false);
    });

    return () => {
      socketRef.current?.off();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, ready }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
