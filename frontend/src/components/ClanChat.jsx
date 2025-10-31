import React, { useEffect, useState, useRef } from "react";
import { useClanStore } from "../store/clanStore";
import { UserAuth } from "../store/userAuthStore";
import { Camera, Users, MessageSquare } from "lucide-react";

const ClanChat = () => {
  const {
    clan,
    clanMessages,
    getClanMessages,
    sendClanMessage,
    subscribeToClanChat,
    unsubscribeFromClanChat,
  } = useClanStore();

  const { authUser } = UserAuth();
  const userId = authUser?._id;
  const [messageData, setMessageData] = useState({ text: "", image: "", userId });
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!clan?._id) return;
    getClanMessages(clan._id);
    subscribeToClanChat();
    return () => unsubscribeFromClanChat();
  }, [clan?._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [clanMessages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setMessageData((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageData.text.trim() && !messageData.image) return;
    sendClanMessage(clan._id, messageData);
    setMessageData({ text: "", image: "", userId });
  };

  if (!clan) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-gray-400">
        <h2 className="text-xl font-semibold mb-4">You’re not in a Clan yet!</h2>
        <div className="flex gap-4">
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white">Join Clan</button>
          <button className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 text-white">Create Clan</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#313338]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-[#2f3136]">
        <h3 className="font-medium text-gray-200 flex items-center gap-2">
          <MessageSquare size={18} /> {clan.name} Chat
        </h3>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {clanMessages.map((m, i) => (
          <div key={i} className={`flex ${m.senderId._id === userId ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                m.system
                  ? "bg-yellow-700/40 border border-yellow-500/40 text-yellow-200 italic"
                  : m.senderId._id === userId
                  ? "bg-blue-600 text-white"
                  : "bg-[#404249] text-gray-200"
              }`}
            >
              {m.text && <p>{m.text}</p>}
              {m.image && (
                <img src={m.image} alt="sent" className="mt-2 max-h-48 rounded-lg object-cover" />
              )}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-700 bg-[#383a40] px-4 py-3">
        <label className="cursor-pointer rounded bg-[#404249] p-2 text-gray-300 hover:bg-[#50535a]">
          <Camera size={18} />
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        <input
          name="text"
          value={messageData.text}
          onChange={(e) => setMessageData({ ...messageData, [e.target.name]: e.target.value })}
          type="text"
          placeholder={`Message ${clan.name}...`}
          className="flex-1 rounded bg-[#404249] px-3 py-2 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Send
        </button>
      </form>
    </div>
  );
};

export default ClanChat;
