import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import axios from "axios";
import { io } from "socket.io-client";
import { persist } from "zustand/middleware";
import { url, url2, url1 } from "../URL";

const BASE_URL = import.meta.env.MODE === "development" ? url1 : url2;

export const UserAuth = create(
  persist(
    (set, get) => ({
      authUser: null,
      isSigningUp: false,
      isLoggingIn: false,
      ranking: null,
      socket: null,
      foundUsers: null,

      // ✅ changed from single `notifications:null` to structured notifications
      notifications: { received: [], sent: [] },

        /** 🔍 Search for users */
      searchUser: async (userData) => {
        try {
          const res = await axios.post(`${url}/user/FindFriend`, userData);
          set({ foundUsers: res.data });
          toast.success("User(s) found!");
        } catch {
          toast.error("User not found!");
        }
      },

      /** 🤝 Send a friend request */
      /** 📩 Send Friend Request */
      makeFriendReq: async (userData) => {
        try {
          const res = await axios.post(`${url}/user/addFriendRequest`, userData);
          toast.success(res.data.message);
        } catch (error) {
          const msg =
            error?.response?.data?.error || "Failed to send friend request";
          toast.error(msg);
        }
      },


      /** 🔔 Fetch all notifications */
       /** 🔔 Fetch All Notifications */
      fetchAllNotifications: async (userId) => {
        try {
          const res = await axios.post(`${url}/user/fetchNotification`, { userId });
          set({ notifications: res.data });
        } catch {
          toast.error("Failed to load notifications");
        }
      },
      /** ✅ Accept a friend request */
      acceptRequest: async (userData) => {
        try {
          const res = await axios.post(`${url}/user/acceptRequest`, userData);
          toast.success("Friend request accepted!");
          console.log("✅ Friend Request Accepted:", res.data);

          // 🆕 refresh notifications immediately
          await get().fetchAllNotifications(userData.userId);
        } catch (error) {
          console.error(error);
          toast.error("Failed!");
        }
      },
       /** ❌ Reject Request */
      rejectRequest: async (data) => {
        try {
          const res = await axios.post(`${url}/user/rejectRequest`, data);
          toast.success("Request rejected!");
          await get().fetchAllNotifications(data.userId);
        } catch {
          toast.error("Failed to reject request");
        }
      },

      /** 🧾 Sign up new user */
      signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const res = await axios.post(`${url}/user/register`, data);
          set({ authUser: res.data });
          console.log("🆕 Signup:", res.data);

          get().connectSocket();
          get().switchStorageKey(res.data._id);
          toast.success("Account created successfully");
        } catch (error) {
          console.error("Signup error:", error?.response?.data || error);
          toast.error(error?.response?.data?.error || "Signup failed");
        } finally {
          set({ isSigningUp: false });
        }
      },

      /** 🔐 Login existing user */
      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axios.post(`${url}/user/login`, data);
          set({ authUser: res.data });
          console.log("🔐 Login:", res.data);

          get().connectSocket();
          get().switchStorageKey(res.data._id);
          toast.success("Logged in successfully");
        } catch (error) {
          console.error("Login error:", error?.response?.data || error);
          toast.error(error?.response?.data?.error || "Login failed");
        } finally {
          set({ isLoggingIn: false });
        }
      },

      /** 🚪 Logout */
      logout: async () => {
        try {
          get().disConnectSocket();
          set({ authUser: null });
          set({ isLoggingIn: false });
          localStorage.removeItem(get().storageKey);
          toast.success("Logged out successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Logout failed");
        }
      },

      /** 🌍 Fetch Global Ranking */
      getGlobalRanking: async () => {
        try {
          const res = await axios(`${url}/user/get-global-ranking`);
          set({ ranking: res.data });
          console.log("🏆 Global Ranking:", res.data);
        } catch (error) {
          console.error(error);
          toast.error("Error: Global Ranking fetch failed.");
        }
      },

      /** 🔌 Connect user socket */
      connectSocket: async () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
          query: { userId: authUser._id },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });
        socket.connect();

        set({ socket });

        // ✅ listen for online users
        socket.on("getOnlineUsers", (userIds) => {
          set({ onlineUsers: userIds });
        });

        // 🆕 live notification event (if backend emits "newNotification")
        socket.on("newNotification", (notif) => {
          set((state) => ({
            notifications: {
              ...state.notifications,
              received: [notif, ...state.notifications.received],
            },
          }));
          toast("📩 New notification received");
        });

        console.log("🟢 Socket connected");
      },

      /** 🔌 Disconnect socket */
      disConnectSocket: async () => {
        const socket = get().socket;
        if (socket && socket.connected) {
          socket.off(); // remove all event listeners
          socket.disconnect();
          console.log("🔌 Socket disconnected manually");
          set({ socket: null });
        }
      },

      /** 🗝️ Switch storage key dynamically per user */
      switchStorageKey: (userId) => {
        const newKey = `auth-store-${userId}`;
        set({ storageKey: newKey });
      },

      /** 🌐 Check backend connection (debug helper) */
      checkconnection: async () => {
        try {
          const res = await axiosInstance.get("/");
          toast.success("Backend connected: " + res.status);
        } catch (error) {
          console.log("Error in connection");
        }
      },
    }),
    {
      name: "auth-store", // default storage name
      getStorage: () => localStorage,
      onRehydrateStorage: () => (state) => {
        if (state?.authUser) {
          state.connectSocket();
        }
      },

      // prevent socket from being persisted
      partialize: (state) => {
        const { socket, ...rest } = state;
        return rest;
      },
    }
  )
);
