import React from "react";
import { useClanStore } from "../store/clanStore";

const ClanInfoPanel = () => {
  const { clan } = useClanStore();

  if (!clan) return null;

  return (
    <aside className="w-80 border-l border-gray-700 bg-[#1e1f22] p-4">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{clan.name}</h3>
      <p className="text-gray-400 text-sm mb-4">{clan.description}</p>

      {clan.bannerImage && (
        <img src={clan.bannerImage} alt="Clan banner" className="rounded-lg mb-4" />
      )}

      <h4 className="text-gray-300 font-semibold mb-1">Leader</h4>
      <p className="text-gray-400 text-sm">{clan.leader?.username}</p>
    </aside>
  );
};

export default ClanInfoPanel;
