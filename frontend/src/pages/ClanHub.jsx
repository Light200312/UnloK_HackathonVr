import React, { useState } from "react";
import { useClanStore } from "../store/clanStore";
import { useNavigate } from "react-router-dom";

const ClanHub = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { searchClans, foundClans, createClan } = useClanStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-200 bg-[#2b2d31] p-6">
      <div className="max-w-xl w-full bg-[#1e1f22] p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-center">Find or Create a Clan</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 rounded bg-[#313338] px-3 py-2 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for clans..."
          />
          <button
            onClick={() => searchClans(searchTerm)}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        <div className="space-y-2">
          {foundClans?.map((c) => (
            <div
              key={c._id}
              className="p-3 bg-[#313338] rounded hover:bg-[#404249] cursor-pointer"
              onClick={() => navigate(`/clan/${c._id}`)}
            >
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-gray-400">{c.description}</p>
            </div>
          ))}
        </div>

        <hr className="my-4 border-gray-600" />
        <button
          onClick={() => navigate("/create-clan")}
          className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
        >
          Create New Clan
        </button>
      </div>
    </div>
  );
};

export default ClanHub;
