import User from "../models/User.js";
import Matrix from "../models/Matrix.js";
import { creategeneralstats } from "./matrixController.js";
import { sendNotification } from "../utils/notificationService.js";

const rankTiers = [
  { points: 700, code: "S1", title: "Devine" },
  { points: 500, code: "A2", title: "Spirit" },
  { points: 350, code: "B3", title: "Sovereign" },
  { points: 200, code: "C4", title: "Saint" },
  { points: 100, code: "D5", title: "Master" },
  { points: 50, code: "E6", title: "Awakened" },
  { points: 0, code: "F7", title: "Sleeper" },
];

// Helper to get rank info
const getRankInfo = (points) =>
  rankTiers.find((tier) => points >= tier.points) || rankTiers.at(-1);

/** 🧾 Register User */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ error: "User already exists" });

    user = new User({ username, email, password });
    await user.save();

    const matrices = {
      "Cognitive Growth": ["Focus", "Problem Solving", "Critical Thinking", "Learning Speed", "Memory"],
      "Physical Wellness": ["Strength", "Stamina", "Sleep", "Health Score"],
      "Emotional Intelligence": ["Self-Awareness", "Impulse Control", "Empathy", "Stress Management"],
      "Social Character": ["Communication", "Listening", "Leadership", "Conflict Resolution", "Integrity"],
      "Discipline & Productivity": ["Task Completion", "Time Management", "Habit Streaks", "Goal Consistency", "Motivation"],
      "Growth Mindset": ["Feedback Openness", "Learning Activity", "Resilience", "Mentorship"],
      "Purpose & Values": ["Goal Clarity", "Value Alignment", "Contribution", "Self-Reflection"],
    };

    await creategeneralstats({ body: { userId: user._id, matrices } });

    res.status(201).json({ message: "Registered successfully", _id: user._id, username: user.username });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ error: "Failed to register user" });
  }
};

/** 🔐 Login */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login success",
      _id: user._id,
      username: user.username,
      rank: user.rank,
      titles: user.titles,
      badges: user.badges,
      points: user.points,
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

/** 🧩 Global Ranking */
export const findRankingOrder = async (req, res) => {
  try {
    const users = await User.find({}, "_id username");
    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        const matrices = await Matrix.find({ userId: user._id, type: "general" });
        const totalPoints = matrices.reduce(
          (sum, m) => sum + m.metrics.reduce((s, x) => s + x.value, 0),
          0
        );
        const rank = getRankInfo(totalPoints);
        await User.findByIdAndUpdate(user._id, {
          points: totalPoints,
          rank: rank.code,
          $addToSet: { titles: rank.title },
        });
        return {
          _id: user._id,
          username: user.username,
          totalPoints,
          rankCode: rank.code,
          rankTitle: rank.title,
        };
      })
    );

    const rankedUsers = updatedUsers
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 20)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.totalPoints,
        rankCode: user.rankCode,
        rankTitle: user.rankTitle,
      }));

    res.json({ success: true, users: rankedUsers });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch rankings." });
  }
};

/** 🔍 Find Users */
export const FindUsers = async (req, res) => {
  const { neededUsername, neededUserID } = req.body;
  try {
    let foundUsers = [];
    if (neededUserID)
      foundUsers = [await User.findById(neededUserID).select("username _id rank points profilePic email")];
    else if (neededUsername)
      foundUsers = await User.find({ username: neededUsername }).select("username _id rank points profilePic email");
    else return res.status(400).json({ error: "Provide username or ID" });
    res.status(200).json(foundUsers.filter(Boolean));
  } catch {
    res.status(500).json({ error: "Error finding user" });
  }
};

/** 👥 Send Friend Request */
export const AddToFriendList = async (req, res) => {
  const { friendId, userId } = req.body;

  try {

    if (!userId || !friendId)
      return res.status(400).json({ error: "Missing userId or friendId" });

    if (friendId === userId)
      return res.status(400).json({ error: "You cannot add yourself" });
console.log("DEBUG AddToFriendList:", { userId, friendId });
    const sender = await User.findById(userId);
    const receiver = await User.findById(friendId);
    if (!sender || !receiver)
      return res.status(404).json({ error: "User not found" });

    // Prevent duplicate requests or existing friends
    const alreadyFriends = sender.friendList?.some(
      (f) => f.userId?.toString() === friendId
    );
    const alreadySent = sender.requestsNotifications?.some(
      (n) =>
        n.receiver?.toString() === friendId &&
        n.type === "friend" &&
        !n.isAccepted
    );
    const alreadyReceived = receiver.requestsNotifications?.some(
      (n) =>
        n.sender?.toString() === userId &&
        n.type === "friend" &&
        !n.isAccepted
    );

    if (alreadyFriends)
      return res.status(400).json({ error: "Already friends" });
    if (alreadySent || alreadyReceived)
      return res.status(400).json({ error: "Request already sent" });

    // ✅ Send Notification
    await sendNotification({
      senderId: userId,
      receiverId: friendId,
      type: "friend",
      message: `${sender.username} sent you a friend request.`,
    });

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("❌ Error in AddToFriendList:", err);
    res.status(500).json({ error: "Failed to send friend request" });
  }
};

//

/** ✅ Accept Friend Request */
export const acceptFriendRequest = async (req, res) => {
  const { userId, notificationId } = req.body;
  try {
    const user = await User.findById(userId);
    const notif = user.requestsNotifications.find(
      (n) => n.notificationId === notificationId && n.type === "friend" && n.direction === "received"
    );
    if (!notif) return res.status(404).json({ error: "Notification not found" });

    const friend = await User.findById(notif.sender);
    if (!friend) return res.status(404).json({ error: "Sender not found" });

    // Add to each other's lists
    user.friendList.push({ userId: friend._id, username: friend.username, rank: friend.rank });
    friend.friendList.push({ userId: user._id, username: user.username, rank: user.rank });

    // Remove notifications
    user.requestsNotifications = user.requestsNotifications.filter((n) => n.notificationId !== notificationId);
    friend.requestsNotifications = friend.requestsNotifications.filter((n) => n.receiver.toString() !== userId);

    await user.save();
    await friend.save();
    res.status(200).json({ message: "Friend request accepted" });
  } catch {
    res.status(500).json({ error: "Failed to accept friend request" });
  }
};

/** ❌ Reject Friend Request */
export const rejectFriendRequest = async (req, res) => {
  const { userId, notificationId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const notif = user.requestsNotifications.find(
      (n) => n.notificationId === notificationId
    );
    if (!notif) return res.status(404).json({ error: "Notification not found" });

    // Remove from both sides
    const sender = await User.findById(notif.sender);
    if (sender) {
      sender.requestsNotifications = sender.requestsNotifications.filter(
        (n) => n.notificationId !== notificationId
      );
      await sender.save();
    }

    user.requestsNotifications = user.requestsNotifications.filter(
      (n) => n.notificationId !== notificationId
    );
    await user.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reject friend request" });
  }
};

/** 🔔 Fetch All Notifications */
export const fetchNotifications = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const received = user.requestsNotifications.filter((n) => n.direction === "received");
    const sent = user.requestsNotifications.filter((n) => n.direction === "sent");

    res.status(200).json({ received, sent });
  } catch (error) {
    console.error("❌ Fetch notifications failed:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

