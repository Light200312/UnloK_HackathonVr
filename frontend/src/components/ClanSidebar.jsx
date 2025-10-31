import React from "react";
import { User } from "lucide-react";
import { useClanStore } from "../store/clanStore";
import { UserAuth } from "../store/userAuthStore";

const ClanSidebar = ({ onSelectMember }) => {
  const { clan } = useClanStore();
  const { authUser } = UserAuth();

  if (!clan) return null;

  const online = clan.members?.filter((m) => m.isOnline);
  const offline = clan.members?.filter((m) => !m.isOnline);

  return (
    <aside className="w-72 border-r border-gray-700 bg-[#1e1f22] p-3 flex flex-col">
      <h3 className="text-gray-300 font-semibold mb-2">Clan Members</h3>

      <h4 className="text-sm text-green-400 mb-1">Online</h4>
      {online.map((m) => (
        <button
          key={m._id}
          onClick={() => onSelectMember(m)}
          className="flex items-center gap-2 p-2 rounded hover:bg-[#2f3136]"
        >
          <User size={18} />
          <span>{m.username}</span>
        </button>
      ))}

      <hr className="my-2 border-gray-600" />

      <h4 className="text-sm text-gray-400 mb-1">Offline</h4>
      {offline.map((m) => (
        <button
          key={m._id}
          onClick={() => onSelectMember(m)}
          className="flex items-center gap-2 p-2 rounded hover:bg-[#2f3136]"
        >
          <User size={18} className="text-gray-500" />
          <span className="text-gray-400">{m.username}</span>
        </button>
      ))}
    </aside>
  );
};

export default ClanSidebar;
