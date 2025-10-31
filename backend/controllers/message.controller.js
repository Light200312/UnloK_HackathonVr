import User from "../models/User.js";
import Message from "../models/message.model.js";

import cloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../config/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.params.id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password -matrices");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.body.userId;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getFriendsForSidebar = async (req, res) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId).populate({
      path: "friendList.userId",
      select: "username profilePic rank points email createdAt"
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // extract populated friend data
    const friends = user.friendList.map(f => ({
      _id: f.userId?._id,
      username: f.userId?.username,
      profilePic: f.userId?.profilePic,
      rank: f.userId?.rank,
      points: f.userId?.points,
      email: f.userId?.email,
      createdAt: f.userId?.createdAt,
    }));

    res.status(200).json(friends);
  } catch (error) {
    console.error("Error in getFriendsForSidebar:", error.message);
    res.status(500).json({ error: "Failed to fetch friends list" });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.body.userId;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * GET /globalMessage
 * Fetch the latest global messages (sorted by creation time)
 */
export const getGlobalMessage = async (req, res) => {
  try {
    const messages = await Message.find({ room: "global" })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("senderId", "username email")
      .lean();

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error in getGlobalMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /globalMessage
 * Send a new message to the global chat
 */
export const sendGlobalMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.body.userId;

    if (!text && !image) {
      return res.status(400).json({ error: "Message text or image required" });
    }

    let imageUrl;
    if (image) {
      // upload to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      room: "global",
      text,
      image: imageUrl,
    });

    const populatedMsg = await newMessage.populate("senderId", "username email");

    // 🔥 emit to everyone in the "global" room
    io.to("global").emit("newGlobalMessage", populatedMsg);

    res.status(201).json(populatedMsg);
  } catch (error) {
    console.error("Error in sendGlobalMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};