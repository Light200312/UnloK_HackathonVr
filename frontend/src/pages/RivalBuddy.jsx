// File: frontend/src/pages/RivalBuddy.jsx

import React, { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/Chatstore";
import { useClanStore } from "../store/clanStore";
import { UserAuth } from "../store/userAuthStore";
import {
  Users,
  Shield,
  Camera,
  Send,
  Check,
  UserPlus,
  Search,
  Bell,
  X,
  Crown,
  GitPullRequest,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const RivalBuddy = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const [inputData, setInputData] = useState({
    neededUsername: "",
    neededUserID: "",
  });
  const [clanSearch, setClanSearch] = useState("");
  const [showClanChat, setShowClanChat] = useState(false); // Controls main chat area visibility

  const navigate = useNavigate();

  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    getUsers,
    sendMessage,
    getFriends,
    friends,
  } = useChatStore();

  const {
    clan,
    foundClans,
    searchClans,
    requestJoinClan,
    fetchClanByClanId, // Import the clan fetching function
    getClanMessages,
    clanMessages,
    sendClanMessage,
    subscribeToClanChat,
    unsubscribeFromClanChat,
    acceptClanInvite,
  } = useClanStore();

  const {
    authUser,
    foundUsers,
    notifications,
    searchUser,
    makeFriendReq,
    fetchAllNotifications,
    acceptRequest,
    rejectRequest,
  } = UserAuth();

  const userId = authUser._id;
  const messageEndRef = useRef(null);
  const [messageData, setMessageData] = useState({
    text: "",
    image: "",
    userId,
  });
  const [clanText, setClanText] = useState("");
  
  // Helper for displaying roles (uses populated data from clan store)
  const getMemberRole = (memberId) => {
    const id = memberId?._id || memberId;
    if (clan?.leader?._id === id || clan?.leader?.toString() === id) return "LEADER";
    if (clan?.coLeaders?.some(coId => coId?._id === id || coId?.toString() === id)) return "CO-LEADER";
    if (clan?.members?.some(memId => memId?._id === id || memId?.toString() === id)) return "MEMBER";
    return "UNKNOWN";
  };
  
  // Helper to safely get username
  const getMemberUsername = (member) => member?.username || "Unknown";

  /** Scroll chat */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, clanMessages]);

  /** Load initial data & Clan Fix (Proactive Fetch) */
  useEffect(() => {
    if (userId) {
      getUsers(userId);
      getFriends(userId);
      fetchAllNotifications(userId);
      subscribeToMessages();
      
      // === FIX: PROACTIVELY FETCH CLAN INFO ON LOAD ===
      // If authUser has a clan ID but the store's clan object is null/stale, fetch it.
      if (authUser?.clan && !clan?._id) { 
          fetchClanByClanId(authUser.clan);
      }
    }
    if (selectedUser?._id) getMessages(userId, selectedUser._id);
    
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, userId, authUser?.clan, clan?.chatRoomId]);

  /** Clan Chat setup */
  useEffect(() => {
    if (showClanChat && clan?.chatRoomId) {
      getClanMessages(clan.chatRoomId);
      subscribeToClanChat(clan.chatRoomId);
      return () => unsubscribeFromClanChat(clan.chatRoomId);
    }
  }, [showClanChat, clan?.chatRoomId]);

  /** Image Upload */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setMessageData((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  /** Send Friend Chat */
  const handleSend = (e) => {
    e.preventDefault();
    if (!messageData.text.trim() && !messageData.image) return;
    sendMessage(messageData);
    setMessageData({ text: "", image: "", userId });
  };

  /** Send Clan Chat */
  const handleClanSend = async (e) => {
    e.preventDefault();
    if (!clanText.trim()) return;
    await sendClanMessage(clan.chatRoomId, { userId, text: clanText });
    setClanText("");
  };

  return (
    <div className="flex h-screen pt-16 bg-[#0d1117] text-gray-200">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 bg-[#161b22] border-r border-gray-800 flex flex-col">
        <div className="flex justify-around border-b border-gray-700 py-3">
          <button
            onClick={() => {
              setActiveTab("friends");
              setShowClanChat(false);
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${
              activeTab === "friends"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users size={16} /> Friends
          </button>
          <button
            onClick={() => {
              setActiveTab("clan");
              // Keep showClanChat false here, only open chat via button click in the refactored view
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${
              activeTab === "clan"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Shield size={16} /> Clan
          </button>
        </div>

        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <div className="flex-1 overflow-y-auto p-2">
            {friends?.map((u, i) => (
              <button
                key={i}
                onClick={() => {setSelectedUser(u); setShowClanChat(false);}} // Ensure clan chat is closed
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all ${
                  selectedUser?._id === u._id && !showClanChat
                    ? "bg-blue-700 text-white"
                    : "hover:bg-[#1f2630] text-gray-300"
                }`}
              >
                <img
                  src={u.profilePic || "/profile.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <p className="truncate">{u.username}</p>
              </button>
            ))}
          </div>
        )}

        {/* CLAN TAB (REFACTORED - Clan Overview or Join/Search) */}
        {activeTab === "clan" && (
          <div className="flex flex-col flex-1 p-4 overflow-y-auto">
            {clan ? (
              <div className="space-y-4">
                
                {/* Clan Info Card */}
                <div className="text-center bg-[#1f2630] p-4 rounded-lg border border-cyan-700/50">
                  <h3 className="text-xl font-bold text-cyan-400">
                    {clan.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 mb-2">
                    {clan.description}
                  </p>
                  <p className="text-xs text-gray-500 flex justify-center items-center gap-4">
                    <span>Rank: <span className="font-semibold">{clan.rank || "N/A"}</span></span>
                    <span>Points: <span className="font-semibold">{clan.clanPoints || 0}</span></span>
                  </p>
                </div>
                
                {/* Clan Chat Button */}
                <button
                  onClick={() => setShowClanChat(true)}
                  className={`w-full text-sm px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 ${
                    showClanChat ? "bg-green-700 text-white cursor-default" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={showClanChat}
                >
                  <Shield size={16} /> {showClanChat ? "Clan Chat Open" : "Open Clan Chat"}
                </button>

                {/* Member List */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-3">
                    Members ({clan.members?.length || 0})
                  </h4>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {(clan.members || [])
                      .filter(Boolean)
                      .map((m) => (
                          <div
                            key={m._id || m} 
                            className="flex items-center gap-2 p-2 rounded hover:bg-[#1f2630] cursor-default"
                          >
                            <img
                              src={m.profilePic || "/profile.png"}
                              alt="avatar"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm truncate">
                              {getMemberUsername(m)}
                            </span>
                             <span className={`text-xs font-medium ml-auto px-1 rounded-full ${
                               getMemberRole(m) === "LEADER" ? "text-yellow-500 bg-yellow-900/30" :
                               getMemberRole(m) === "CO-LEADER" ? "text-green-500 bg-green-900/30" :
                               "text-gray-400 bg-gray-700/30"
                             }`}>
                               {getMemberRole(m)}
                             </span>
                          </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              // Non-Member View (Join/Search)
              <>
                <p className="text-gray-400 text-sm mb-4 text-center">
                  You are not in a clan yet. Search below or create one.
                </p>
                <div className="flex gap-3 justify-center mb-6">
                  <button
                    onClick={() => navigate("/create-clan")}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Create Clan
                  </button>
                </div>

                {/* Clan Search */}
                <div className="w-full mt-2">
                  <div className="flex items-center bg-[#1f2630] rounded px-2">
                    <Search size={16} className="text-gray-400" />
                    <input
                      type="text"
                      value={clanSearch}
                      onChange={(e) => setClanSearch(e.target.value)}
                      placeholder="Search clans..."
                      className="w-full bg-transparent px-2 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                    />
                    <button
                      onClick={() => searchClans(clanSearch)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Go
                    </button>
                  </div>

                  <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                    {foundClans?.length > 0 ? (
                      foundClans.map((c) => (
                        <div
                          key={c._id}
                          className="p-2 bg-[#1e242f] border border-gray-700 rounded-md flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-white">{c.name}</p>
                            <p className="text-xs text-gray-400">Leader: {c.leader?.username || "N/A"}</p>
                          </div>
                          <button
                            onClick={() =>
                              requestJoinClan({ clanId: c._id, userId })
                            }
                            className="mt-1 bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <GitPullRequest size={12} /> Request Join
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-xs text-center p-2">
                        {clanSearch ? "No clans match your search." : "Enter a name to search."}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex flex-col flex-1 bg-[#0f141a]">
        {/* Render Clan Chat when explicitly requested AND clan data is loaded */}
        {showClanChat && clan ? (
          <>
            <div className="flex items-center gap-2 border-b border-gray-800 bg-[#161b22] px-5 py-3">
              <h3 className="text-md font-medium text-white flex items-center gap-2">
                <Crown size={18} className="text-yellow-400" /> {clan.name} Chat
              </h3>
              <button
                onClick={() => setShowClanChat(false)}
                className="ml-auto text-red-500 hover:text-red-400"
                title="Close Clan Chat"
              >
                <X size={20} />
              </button>
            </div>
            {/* Messages body and input form using clan.chatRoomId */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {clanMessages?.map((m, i) => (
                <div
                  key={m?._id || i}
                  className={`flex ${
                    m.senderId === userId ? "justify-end" : "justify-start"
                  }`}
                >
                   <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      m.system
                        ? "bg-yellow-700/40 border border-yellow-500/40 text-yellow-200 italic"
                        : m.senderId === userId
                        ? "bg-blue-600 text-white"
                        : "bg-[#1f2630] text-gray-200"
                    }`}
                  >
                    {!m.system && m.senderId !== userId && (
                      <span className="font-semibold text-cyan-300 text-xs block mb-1">
                        {m.senderId?.username || "System"}
                      </span>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <form
              onSubmit={handleClanSend}
              className="flex items-center gap-2 border-t border-gray-800 bg-[#161b22] px-4 py-3"
            >
              <input
                value={clanText}
                onChange={(e) => setClanText(e.target.value)}
                placeholder="Message your clan..."
                className="flex-1 rounded bg-[#1f2630] px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium text-white flex items-center gap-1"
              >
                <Send size={16} /> Send
              </button>
            </form>
          </>
        ) : activeTab === "friends" && selectedUser ? (
          <>
             {/* Friend Chat UI */}
             <div className="flex items-center gap-2 border-b border-gray-800 bg-[#161b22] px-5 py-3">
                <h3 className="text-md font-medium text-white">
                  {selectedUser.username}
                </h3>
            </div>
            {/* ... Friend messages body and input form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isMessagesLoading ? (
                <p className="text-center text-gray-400">Loading messages...</p>
              ) : (
                messages?.map((m, i) => (
                  <div
                    key={m?._id || i}
                    className={`flex ${
                      m?.senderId === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                        m?.senderId === userId
                          ? "bg-blue-600 text-white"
                          : "bg-[#1f2630] text-gray-200"
                      }`}
                    >
                      {m?.text && <p>{m.text}</p>}
                      {m?.image && (
                        <img
                          src={m.image}
                          alt="sent"
                          className="mt-2 max-h-48 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>
            
            {selectedUser && (
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-gray-800 bg-[#161b22] px-4 py-3"
              >
                <label className="cursor-pointer rounded bg-[#1f2630] p-2 text-gray-300 hover:bg-[#2a3544]">
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <input
                  name="text"
                  value={messageData.text}
                  onChange={(e) =>
                    setMessageData({
                      ...messageData,
                      [e.target.name]: e.target.value,
                    })
                  }
                  placeholder="Message..."
                  className="flex-1 rounded bg-[#1f2630] px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium text-white flex items-center gap-1"
                >
                  <Send size={16} /> Send
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
             {activeTab === "friends" ? "Select a friend to start chatting." : "Join or Create a Clan to access the chat."}
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR (Notifications, Search Users) */}
      <aside className="w-80 border-l border-gray-800 bg-[#161b22] p-5 space-y-6 hidden sm:block">
        {/* ... rest of the right sidebar content (Notifications, Search Users) */}
      </aside>

    </div>
  );
};

export default RivalBuddy;