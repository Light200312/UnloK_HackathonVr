import Clan from "../models/Clan.js";
import User from "../models/User.js";
import Message from "../models/message.model.js";
import { v4 as uuidv4 } from "uuid";
import { io } from "../config/socket.js";
import {mongoose} from "mongoose"
/* 🏰 Create a Clan */
export const createClan = async (req, res) => {
  try {
    const { name, description, bannerImage, leaderId } = req.body;

    const leader = await User.findById(leaderId);
    if (!leader) return res.status(404).json({ error: "Leader not found" });
    if (leader.clan)
      return res.status(400).json({ error: "User already in a clan" });

    const clan = await Clan.create({
      name,
      description,
      bannerImage,
      leader: leader._id,
      members: [leader._id],
      chatRoomId: uuidv4(),
    });

    leader.clan = clan._id;
    leader.clanRole = "leader";
    await leader.save();

    res.status(201).json({ message: "Clan created successfully", clan });
  } catch (err) {
    console.error("❌ Error creating clan:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 📩 Invite a user to a Clan */
export const inviteToClan = async (req, res) => {
  try {
    const { clanId, senderId, targetUserId } = req.body;

    const clan = await Clan.findById(clanId);
    const sender = await User.findById(senderId);
    const target = await User.findById(targetUserId);

    if (!clan || !sender || !target)
      return res.status(404).json({ error: "Invalid clan or user" });

    if (!["leader", "co-leader"].includes(sender.clanRole))
      return res.status(403).json({ error: "No permission to invite users" });

    if (target.clan)
      return res.status(400).json({ error: "User already in a clan" });

    target.requestsNotifications.push({
      notificationId: uuidv4(),
      userId: sender._id,
      username: sender.username,
      rank: sender.rank,
      requestRegarding: `Invitation to join clan ${clan.name}`,
      notificationType: "received",
      isAccepted: false,
    });

    await target.save();

    res.status(200).json({ message: "Clan invite sent successfully" });
  } catch (err) {
    console.error("❌ Error inviting user:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ✅ Accept Clan Invite */
export const acceptClanInvite = async (req, res) => {
  try {
    const { userId, clanId, notificationId } = req.body;

    const user = await User.findById(userId);
    const clan = await Clan.findById(clanId);
    if (!user || !clan)
      return res.status(404).json({ error: "User or clan not found" });

    user.requestsNotifications = user.requestsNotifications.filter(
      (n) => n.notificationId !== notificationId
    );

    user.clan = clan._id;
    user.clanRole = "member";
    await user.save();

    clan.members.push(user._id);
    await clan.save();

    const joinMsg = await Message.create({
      senderId: user._id,
      room: clan.chatRoomId,
      text: `🎉 ${user.username} has joined the clan.`,
      system: true,
    });

    io.to(clan.chatRoomId).emit("newClanMessage", joinMsg);

    res.status(200).json({ message: "Joined clan successfully", clan });
  } catch (err) {
    console.error("❌ Error accepting clan invite:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
/* ✅ Accept Clan Join Request */
export const acceptClanJoinRequest = async (req, res) => {
  try {
    const { clanId, leaderId, userId } = req.body;

    const clan = await Clan.findById(clanId);
    const leader = await User.findById(leaderId);
    const user = await User.findById(userId);

    if (!clan || !leader || !user)
      return res.status(404).json({ error: "Invalid clan or users" });

    if (leader._id.toString() !== clan.leader.toString())
      return res.status(403).json({ error: "Only leader can accept requests" });

    // ✅ Add user to clan
    if (!clan.members.includes(user._id)) {
      clan.members.push(user._id);
      clan.joinRequests = clan.joinRequests.filter(
        (id) => id.toString() !== userId
      );
      await clan.save();
    }

    user.clan = clan._id;
    user.clanRole = "member";
    await user.save();

    // ✅ Update notifications
    leader.requestsNotifications.forEach((n) => {
      if (n.sender?.toString() === userId && n.relatedId?.toString() === clanId) {
        n.status = "accepted";
      }
    });

    user.requestsNotifications.forEach((n) => {
      if (n.receiver?.toString() === leaderId && n.relatedId?.toString() === clanId) {
        n.status = "accepted";
      }
    });

    await leader.save();
    await user.save();

    // ✅ System message in clan chat
    const joinMsg = await Message.create({
      senderId: user._id,
      room: clan.chatRoomId,
      text: `🎉 ${user.username} has joined the clan!`,
      system: true,
    });

    io.to(clan.chatRoomId).emit("newClanMessage", joinMsg);
    io.to(user._id.toString()).emit("notificationUpdate", {
      message: `Your join request for ${clan.name} was accepted.`,
    });

    res.status(200).json({ message: "Join request accepted successfully" });
  } catch (err) {
    console.error("❌ Error accepting clan join request:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getClanRequests = async (req, res) => {
  try {
    const { clanId, userId } = req.body;
    if (!clanId || !userId)
      return res.status(400).json({ error: "Clan ID and User ID are required" });

    const clan = await Clan.findById(clanId)
      .populate("joinRequests", "username profilePic rank")
      .populate("leader", "username");

    if (!clan) return res.status(404).json({ error: "Clan not found" });

    // ✅ Only leader or co-leader can view requests
    const isAuthorized =
      clan.leader._id.toString() === userId ||
      clan.coLeaders.some((co) => co.toString() === userId);

    if (!isAuthorized)
      return res.status(403).json({ error: "Not authorized to view requests" });

    res.status(200).json({ joinRequests: clan.joinRequests });
  } catch (err) {
    console.error("❌ Error fetching clan requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
/* 🚪 Leave Clan */
export const leaveClan = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.clan)
      return res.status(400).json({ error: "User not in a clan" });

    const clan = await Clan.findById(user.clan);
    if (!clan) return res.status(404).json({ error: "Clan not found" });

    clan.members = clan.members.filter((m) => m.toString() !== userId);
    clan.coLeaders = clan.coLeaders.filter((m) => m.toString() !== userId);
    await clan.save();

    user.clan = null;
    user.clanRole = "none";
    await user.save();

    const leaveMsg = await Message.create({
      senderId: user._id,
      room: clan.chatRoomId,
      text: `👋 ${user.username} has left the clan.`,
      system: true,
    });

    io.to(clan.chatRoomId).emit("newClanMessage", leaveMsg);

    res.status(200).json({ message: "User left the clan successfully" });
  } catch (err) {
    console.error("❌ Error leaving clan:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 🚫 Kick Member */
export const kickClanMember = async (req, res) => {
  try {
    const { clanId, memberId, adminId } = req.body;

    const clan = await Clan.findById(clanId);
    const admin = await User.findById(adminId);
    const member = await User.findById(memberId);

    if (!clan || !admin || !member)
      return res.status(404).json({ error: "Not found" });

    if (!["leader", "co-leader"].includes(admin.clanRole))
      return res.status(403).json({ error: "No permission" });

    clan.members = clan.members.filter((m) => m.toString() !== memberId);
    clan.coLeaders = clan.coLeaders.filter((m) => m.toString() !== memberId);
    await clan.save();

    member.clan = null;
    member.clanRole = "none";
    await member.save();

    const kickMsg = await Message.create({
      senderId: admin._id,
      room: clan.chatRoomId,
      text: `⚔️ ${member.username} was kicked from the clan by ${admin.username}.`,
      system: true,
    });

    io.to(clan.chatRoomId).emit("newClanMessage", kickMsg);

    res.status(200).json({ message: "Member kicked successfully" });
  } catch (err) {
    console.error("❌ Error kicking member:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ⚙️ Update Role (Promote/Demote) */
export const updateClanRole = async (req, res) => {
  try {
    const { clanId, adminId, memberId, newRole } = req.body;

    const clan = await Clan.findById(clanId);
    const admin = await User.findById(adminId);
    const member = await User.findById(memberId);

    if (!clan || !admin || !member)
      return res.status(404).json({ error: "Not found" });

    if (admin.clanRole !== "leader")
      return res.status(403).json({ error: "Only leader can promote/demote" });

    member.clanRole = newRole;
    await member.save();

    if (newRole === "co-leader" && !clan.coLeaders.includes(member._id)) {
      clan.coLeaders.push(member._id);
    } else if (newRole === "member") {
      clan.coLeaders = clan.coLeaders.filter((id) => id.toString() !== memberId);
    }
    await clan.save();

    const roleAction =
      newRole === "co-leader"
        ? `⬆️ ${member.username} has been promoted to Co-Leader by ${admin.username}.`
        : `⬇️ ${member.username} has been demoted to Member by ${admin.username}.`;

    const roleMsg = await Message.create({
      senderId: admin._id,
      room: clan.chatRoomId,
      text: roleAction,
      system: true,
    });

    io.to(clan.chatRoomId).emit("newClanMessage", roleMsg);

    res.status(200).json({ message: `Updated ${member.username} to ${newRole}` });
  } catch (err) {
    console.error("❌ Error updating clan role:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 💬 Get Clan Messages (from room/chatRoomId) */
export const getClanMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const messages = await Message.find({ room: chatRoomId })
      .sort({ createdAt: 1 })
      .populate("senderId", "username profilePic");

    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Error fetching clan messages:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 📤 Send Clan Message */
export const sendClanMessage = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { userId, text, image } = req.body;

    const msg = await Message.create({ senderId: userId, room: chatRoomId, text, image });
    const populated = await msg.populate("senderId", "username profilePic");

    io.to(clanId).emit("newClanMessage", populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Error sending clan message:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 🔍 Search Clans */
export const searchClans = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    const searchConditions = [
      { name: { $regex: query, $options: "i" } },
    ];

    // ✅ Only add _id search if the query is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(query)) {
      searchConditions.push({ _id: query });
    }

    const clans = await Clan.find({ $or: searchConditions })
      .populate("leader", "username rank profilePic")
      .populate("members", "username rank profilePic");

    res.status(200).json(clans);
  } catch (err) {
    console.error("❌ Error searching clans:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* 🧭 Get Clan Info */
export const getClanInfo = async (req, res) => {
  try {
    const { clanId } = req.params;
    const clan = await Clan.findById(clanId)
      .populate("leader", "username rank profilePic")
      .populate("coLeaders", "username rank profilePic")
      .populate("members", "username rank profilePic");

    if (!clan) return res.status(404).json({ error: "Clan not found" });
    res.status(200).json(clan);
  } catch (err) {
    console.error("❌ Error getting clan info:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* 🙋‍♂️ Request to Join Clan */
export const requestJoinClan = async (req, res) => {
  try {
    const { clanId, userId } = req.body;

    // 🔍 Fetch user and clan
    const clan = await Clan.findById(clanId);
    const user = await User.findById(userId);
    if (!clan || !user)
      return res.status(404).json({ error: "Clan or user not found" });

    // 🚫 Already in a clan?
    if (user.clan)
      return res.status(400).json({ error: "Already in a clan" });

    // 🚫 Already requested?
    if (clan.joinRequests.includes(userId))
      return res.status(400).json({ error: "Already requested to join" });

    // ✅ Add join request to clan
    clan.joinRequests.push(userId);
    await clan.save();

    // 🔹 Create Notification Objects
    const leader = await User.findById(clan.leader);
    if (!leader)
      return res.status(404).json({ error: "Clan leader not found" });

    // ✅ Receiver (Leader)
    const leaderNotification = {
      notificationId: uuidv4(),
      type: "clan",
      direction: "received",
      sender: user._id,
      receiver: leader._id,
      senderName: user.username,
      receiverName: leader.username,
      message: `${user.username} requested to join your clan "${clan.name}".`,
      relatedId: clan._id,
      relatedModel: "Clan",
      status: "pending",
    };

    // ✅ Sender (User)
    const userNotification = {
      notificationId: uuidv4(),
      type: "clan",
      direction: "sent",
      sender: user._id,
      receiver: leader._id,
      senderName: user.username,
      receiverName: leader.username,
      message: `You requested to join clan "${clan.name}".`,
      relatedId: clan._id,
      relatedModel: "Clan",
      status: "pending",
    };

    // 📨 Push both sides
    leader.requestsNotifications.push(leaderNotification);
    user.requestsNotifications.push(userNotification);

    await leader.save();
    await user.save();

    // (Optional) Real-time update to leader
    io.to(leader._id.toString()).emit("newNotification", leaderNotification);

    res.status(200).json({ message: "Join request sent successfully" });
  } catch (err) {
    console.error("❌ Error requesting join:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const rejectClanJoinRequest = async (req, res) => {
  try {
    const { clanId, leaderId, userId } = req.body;

    const clan = await Clan.findById(clanId);
    const leader = await User.findById(leaderId);
    const user = await User.findById(userId);

    if (!clan || !leader || !user)
      return res.status(404).json({ error: "Invalid clan or users" });

    clan.joinRequests = clan.joinRequests.filter(
      (id) => id.toString() !== userId
    );
    await clan.save();

    // Update notifications
    leader.requestsNotifications.forEach((n) => {
      if (n.sender?.toString() === userId && n.relatedId?.toString() === clanId) {
        n.status = "rejected";
      }
    });
    user.requestsNotifications.forEach((n) => {
      if (n.receiver?.toString() === leaderId && n.relatedId?.toString() === clanId) {
        n.status = "rejected";
      }
    });

    await leader.save();
    await user.save();

    io.to(user._id.toString()).emit("notificationUpdate", {
      message: `Your join request for ${clan.name} was rejected.`,
    });

    res.status(200).json({ message: "Join request rejected" });
  } catch (err) {
    console.error("❌ Error rejecting join request:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
