import React, { useEffect } from "react";
import { UserAuth } from "../store/userAuthStore";
import { useClanStore } from "../store/clanStore";
import { Loader2, Check, X, Send, Shield } from "lucide-react";

export default function RequestsPage() {
  const { authUser, fetchAllNotifications, notifications, acceptRequest, rejectRequest } = UserAuth();
  const { acceptJoinRequest, rejectJoinRequest, acceptClanInvite } = useClanStore();

  useEffect(() => {
    if (authUser?._id) fetchAllNotifications(authUser._id);
  }, [authUser]);

  const received = notifications?.received || [];
  const sent = notifications?.sent || [];

  const handleAccept = async (req) => {
    if (req.type === "friend") {
      await acceptRequest({ userId: authUser._id, notificationId: req.notificationId });
    } else if (req.type === "clan" && req.direction === "received") {
      // Leader accepting a join request
      await acceptJoinRequest({
        leaderId: authUser._id,
        userId: req.sender?._id,
        clanId: req.clanId,
      });
    } else if (req.type === "clan" && req.direction === "sent") {
      // User accepting an invite
      await acceptClanInvite({
        userId: authUser._id,
        clanId: req.clanId,
      });
    }
  };

  const handleReject = async (req) => {
    if (req.type === "friend") {
      await rejectRequest({ userId: authUser._id, notificationId: req.notificationId });
    } else if (req.type === "clan") {
      await rejectJoinRequest({
        leaderId: authUser._id,
        userId: req.sender?._id,
        clanId: req.clanId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-white">Requests & Notifications</h1>

        {/* RECEIVED */}
        <section className="mb-10">
          <h2 className="text-xl mb-3 text-blue-400 flex items-center gap-2">
            <Loader2 size={20} /> Incoming
          </h2>
          <div className="bg-[#1b1b1b] p-4 rounded-lg space-y-3">
            {received.length ? (
              received.map((req) => (
                <div
                  key={req.notificationId}
                  className="flex justify-between items-center bg-[#222] p-3 rounded-md hover:bg-[#2b2b2b]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.sender?.profilePic || "/profile.png"}
                      alt="profile"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {req.senderName?.senderName}
                      </p>
                      <p className="text-sm text-gray-400">
                        {req.type === "clan"
                          ? `Clan join request for ${req.clanName || "a clan"}`
                          : req.message || "Friend request"}
                      </p>
                    </div>
                  </div>

                  {!req.isAccepted ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm flex items-center gap-1"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm flex items-center gap-1"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <Check size={14} /> Accepted
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No pending requests.</p>
            )}
          </div>
        </section>

        {/* SENT */}
        <section>
          <h2 className="text-xl mb-3 text-yellow-400 flex items-center gap-2">
            <Send size={20} /> Sent
          </h2>
          <div className="bg-[#1b1b1b] p-4 rounded-lg space-y-3">
            {sent.length ? (
              sent.map((req) => (
                <div
                  key={req.notificationId}
                  className="flex justify-between items-center bg-[#222] p-3 rounded-md hover:bg-[#2b2b2b]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.receiver?.profilePic || "/profile.png"}
                      alt="profile"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {req.receiverName || req.receiver?.username || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {req.type === "clan"
                          ? `Clan join request to ${req.clanName || "a clan"}`
                          : req.message || "Friend request pending..."}
                      </p>
                    </div>
                  </div>
                  {req.isAccepted ? (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <Check size={14} /> Accepted
                    </span>
                  ) : (
                    <span className="text-yellow-400 text-sm flex items-center gap-1">
                      <Loader2 size={14} /> Pending
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No sent requests.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
