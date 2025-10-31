import { create } from "zustand";
import toast from "react-hot-toast";
// import { axios } from "../lib/axios";
import { url } from "../URL";
import axios from "axios";
import { UserAuth } from "./userAuthStore";
import { persist } from "zustand/middleware";
export const useChatStore = create(
   persist((set, get) => ({
  messages: [],
  globalMessages: [],  
  users: [],
  friends:[],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async (userId) => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get(`${url}/messages/users/${userId}`);
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getFriends: async (userId) => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get(`${url}/messages/friends/${userId}`);
      set({ friends: res.data }); // friends users state for friend list
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch friends");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId,sUser) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axios.post(`${url}/messages/get/${sUser}`,{userId});
      set({ messages: res.data });
      console.log(res.data)
  
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
    getGlobalMessage: async () => {
    set({ isMessagesLoading: true });
    try {
      const res = await axios.get(`${url}/messages/globalMessage`);
      set({ globalMessages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axios.post(`${url}/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  //remember to send userId in body
    sendGlobalMessage: async (messageData) => {
    const {  globalMessages } = get();
    try {
      const res = await axios.post(`${url}/messages/globalMessage`, messageData);
      set({ globalMessages: [...globalMessages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

subscribeToMessages: () => {
  const { selectedUser } = get();
  if (!selectedUser) return;

  const socket = UserAuth?.getState().socket;
  if (!socket) return;

  // Remove old listener first to avoid duplicates
  socket.off("newMessage");

  socket.on("newMessage", (newMessage) => {
    const isMessageSentFromSelectedUser =
      newMessage?.senderId === selectedUser?._id;

    if (!isMessageSentFromSelectedUser) return;

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  });
},

 subscribeToGlobal: () => {
  const socket = UserAuth?.getState().socket;
  if (!socket) return;

  // Remove old listener first to avoid duplicates
  socket.off("newGlobalMessage");

  socket.on("newGlobalMessage", (newMessage) => {
    const { globalMessages } = get();
   if (globalMessages.some(m => m._id === newMessage._id)) return;
    set((state) => ({
      globalMessages: [...state.globalMessages, newMessage],
    }));
  });
},

  unsubscribeFromMessages: () => {
    const socket = UserAuth?.getState().socket;
    socket?.off("newMessage");
  },
  unsubscribeFromGlobal: () => {
  const socket = UserAuth?.getState().socket;
  socket?.off("newGlobalMessage");
},


  setSelectedUser: (selectedUser) => set({ selectedUser }),
}) ,
    {
      name: "message-storage", // 🔐 key in localStorage
      getStorage: () => localStorage, // default
       // ⛔ exclude messages from being persisted
      partialize: (state) => {
        const { messages ,globalMessages, ...rest } = state;
        return rest;
      },onRehydrateStorage: () => (state) => {
        // 👇 automatically reconnect socket if authUser already exists
        if (state?.authUser) {
          state.connectSocket();
        }
      }
    }
  )
 );
