"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

type SocketContextType = {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: string[];
  unreadCount: number;
  setUnreadCount: (count: number) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = localStorage.getItem("skillswap_access_token");
    if (!token) {
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      setConnected(true);
      setSocket(socketInstance);
    };
    const onDisconnect = () => setConnected(false);
    const onOnlineUsers = (users: string[]) => setOnlineUsers(users);
    const onMessageNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("online_users", onOnlineUsers);
    socketInstance.on("message_notification", onMessageNotification);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("online_users", onOnlineUsers);
      socketInstance.off("message_notification", onMessageNotification);
      socketInstance.disconnect();
      setConnected(false);
      setOnlineUsers([]);
      setSocket(null);
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      socket: isAuthenticated ? socket : null,
      connected: isAuthenticated ? connected : false,
      onlineUsers: isAuthenticated ? onlineUsers : [],
      unreadCount: isAuthenticated ? unreadCount : 0,
      setUnreadCount,
    }),
    [isAuthenticated, socket, connected, onlineUsers, unreadCount],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
}
