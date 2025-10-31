import React, { useEffect, useState } from "react";
import { UserAuth } from "../store/userAuthStore";
import { useClanStore } from "../store/clanStore";
import {
  Users,
  Shield,
  Search,
  Bell,
  X,
  Check,
  Send,
  UserPlus,
  Loader2,
  ListRestart,
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";

const SocialHub = () => {
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

  const {
    clan,
    foundClans,
    searchClans,
    requestJoinClan,
    clanRequests,
    getClanRequests,
    acceptClanInvite,
    rejectJoinRequest,
    acceptJoinRequest,
  } = useClanStore();

  const userId = authUser?._id;

  const [inputData, setInputData] = useState({
    neededUsername: "",
    neededUserID: "",
  });
  const [clanSearchTerm, setClanSearchTerm] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);

  /** Function to refresh clan join requests (for leaders) */
  const handleRefreshClanRequests = async () => {
      if (!clan?._id || clan.leader?.toString() !== userId) return;
      setLoadingRequests(true);
      await getClanRequests({ clanId: clan._id, userId });
      setLoadingRequests(false);
  };
  
  /** Load initial data */
  useEffect(() => {
    if (userId) {
      fetchAllNotifications(userId);
      if (clan && clan.leader?.toString() === userId) {
        handleRefreshClanRequests();
      }
    }
  }, [userId, clan?._id, clan?.leader]);
  
  /** Handlers for Notifications (Friend/Clan Invites) */
  const handleAccept = async (req) => {
    if (req.type === "friend") {
      await acceptRequest({ userId, notificationId: req.notificationId });
    } else if (req.type === "clan" && req.direction === "sent" && req.relatedModel === "Clan") {
      // User accepting an invite to join (not a join request to the leader)
       await acceptClanInvite({
        userId,
        clanId: req.relatedId,
        notificationId: req.notificationId,
      });
    }
    // Re-fetch notifications after action
    fetchAllNotifications(userId);
  };

  const handleReject = async (req) => {
    if (req.type === "friend") {
      await rejectRequest({ userId, notificationId: req.notificationId });
    }
    // Re-fetch notifications after rejection
    fetchAllNotifications(userId);
  };

  /** Handlers for Clan Leader Actions (Accept/Reject Join Requests) */
  const handleLeaderAcceptJoinRequest = async (requestedUserId) => {
      await acceptJoinRequest({ clanId: clan._id, leaderId: userId, userId: requestedUserId });
      handleRefreshClanRequests(); // Refresh the list
  }

  const handleLeaderRejectJoinRequest = async (requestedUserId) => {
      await rejectJoinRequest({ clanId: clan._id, leaderId: userId, userId: requestedUserId });
      handleRefreshClanRequests(); // Refresh the list
  }


  return (
    <div className="min-h-screen pt-24 p-6 bg-[#0d1117] text-gray-200 flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: User & Clan Search */}
      <div className="flex-1 space-y-8 max-w-xl mx-auto md:mx-0">
        
        {/* === FIND USERS (FRIENDS & RIVALS) === */}
        <section className="bg-[#161b22] p-5 rounded-xl border border-gray-800 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
            <Users size={20} /> Find Users
          </h2>
          <div className="space-y-3">
            {/* Search Inputs */}
            {["neededUsername", "neededUserID"].map((field) => (
              <input
                key={field}
                type="text"
                value={inputData[field]}
                name={field}
                placeholder={
                  field === "neededUsername"
                    ? "Search by Username..."
                    : "Search by ID..."
                }
                onChange={(e) =>
                  setInputData({
                    ...inputData,
                    [e.target.name]: e.target.value,
                  })
                }
                className="w-full rounded bg-[#1b1f24] border border-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ))}
            <button
              className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              onClick={(e) => {
                e.preventDefault();
                searchUser(inputData);
              }}
            >
              Search
            </button>
          </div>
          
          {/* Search Results */}
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {foundUsers?.length > 0 && (
              <p className="text-xs text-gray-400 font-semibold mb-1">Found Users ({foundUsers.length})</p>
            )}
            {foundUsers && foundUsers.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between bg-[#1f2630] p-3 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                    <img src={u.profilePic || "/profile.png"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                        <p className="font-medium text-white">{u.username}</p>
                        <p className="text-xs text-gray-400">{u.rank || "N/A"} | {u.points || 0} pts</p>
                    </div>
                </div>
                <button
                  onClick={() => makeFriendReq({ friendId: u._id, userId })}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition"
                >
                  <UserPlus size={14} /> Add Friend
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* === FIND CLANS === */}
        <section className="bg-[#161b22] p-5 rounded-xl border border-gray-800 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
            <Shield size={20} /> Find Clans
          </h2>
          {clan ? (
              <div className="text-center p-4 bg-[#1f2630] rounded-lg">
                  <h3 className="font-semibold text-white">{clan.name}</h3>
                  <p className="text-sm text-gray-400">You are already a member of this clan.</p>
                  <p className="text-xs text-gray-500 mt-1">Leader: {clan.leader?.username || "N/A"}</p>
              </div>
          ) : (
          <>
            <div className="flex items-center bg-[#1f2630] rounded px-2 mb-4">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={clanSearchTerm}
                onChange={(e) => setClanSearchTerm(e.target.value)}
                placeholder="Search clans by name or ID..."
                className="w-full bg-transparent px-2 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => searchClans(clanSearchTerm)}
                className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-sm text-white transition"
              >
                Go
              </button>
            </div>
            
            {/* Clan Search Results */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {foundClans?.length > 0 ? (
                foundClans.map((c) => (
                  <div
                    key={c._id}
                    className="p-3 bg-[#1f2630] border border-gray-700 rounded-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-gray-400">Leader: {c.leader?.username || "N/A"}</p>
                    </div>
                    <button
                      onClick={() =>
                        requestJoinClan({ clanId: c._id, userId })
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 rounded text-white transition"
                    >
                      Request to Join
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-xs text-center">
                  Search to find clans.
                </p>
              )}
            </div>
          </>
          )}
        </section>
      </div>

      {/* RIGHT COLUMN: Notifications & Clan Requests */}
      <div className="md:w-96 space-y-8 bg-[#161b22] p-5 rounded-xl border border-gray-800 shadow-lg">
        
        {/* === INCOMING NOTIFICATIONS (Invites/Friend Requests) === */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
            <Bell size={20} /> Incoming Requests
          </h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(notifications?.received || []).filter(n => n.status === "pending").length ? (
              (notifications.received || []).filter(n => n.status === "pending").map((n, i) => (
                <div
                  key={n.notificationId || i}
                  className="flex flex-col rounded bg-[#1f2630] p-3 text-sm text-gray-200 border border-purple-500/30"
                >
                  <p className="font-medium mb-1">
                    {n.type === "clan" ? <Shield size={14} className="inline mr-1 text-purple-400" /> : <UserPlus size={14} className="inline mr-1 text-blue-400" />}
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">From: {n.senderName || n.sender?.username || "Unknown"}</p>
                  
                  <div className="flex gap-2 self-end">
                      <button
                        onClick={() => handleAccept(n)}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 flex items-center gap-1"
                      >
                        <Check size={14} /> Accept
                      </button>

                      <button
                        onClick={() => handleReject(n)}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 flex items-center gap-1"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs text-center">No pending requests.</p>
            )}
          </div>
        </section>

        {/* === CLAN JOIN REQUESTS (FOR LEADER) === */}
        {clan && clan.leader?.toString() === userId && (
          <section className="pt-4 border-t border-gray-700">
            <h2 className="text-xl font-bold mb-3 text-orange-400 flex items-center gap-2">
              <Shield size={20} /> Clan Join Requests
            </h2>
            <button
              onClick={handleRefreshClanRequests}
              className="mb-3 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs text-white flex items-center gap-1 transition"
              disabled={loadingRequests}
            >
              {loadingRequests ? <Loader2 size={14} className="animate-spin" /> : <ListRestart size={14} />} Refresh Requests
            </button>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {clanRequests?.length ? (
                clanRequests.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between rounded bg-[#1f2630] p-3 text-sm text-gray-200 border border-orange-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={r.profilePic || "/profile.png"}
                        className="w-8 h-8 rounded-full object-cover"
                        alt="user"
                      />
                      <p className="font-medium">{r.username || r._id.slice(-5)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLeaderAcceptJoinRequest(r._id)}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 flex items-center gap-1"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => handleLeaderRejectJoinRequest(r._id)}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 flex items-center gap-1"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs text-center">No join requests yet.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SocialHub;