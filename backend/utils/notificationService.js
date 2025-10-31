import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Sends proper sender/receiver notifications
 * with different messages for each direction.
 */
export const sendNotification = async ({ senderId, receiverId, type }) => {
  try {
    if (!senderId || !receiverId || !type) {
      throw new Error("Missing required fields: senderId, receiverId, or type");
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      throw new Error("Sender or receiver not found");
    }

    const notifId = uuidv4();

    // ✉️ Separate messages for sender and receiver
    const receiverMsg = `${sender.username} sent you a ${type} request.`;
    const senderMsg = `You sent a ${type} request to ${receiver.username}.`;

    const receivedNotif = {
      notificationId: notifId,
      type,
      direction: "received",
      sender: sender._id,
      receiver: receiver._id,
      senderName: sender.username,
      receiverName: receiver.username,
      message: receiverMsg,
    };

    const sentNotif = {
      ...receivedNotif,
      direction: "sent",
      message: senderMsg,
    };

    receiver.requestsNotifications.push(receivedNotif);
    sender.requestsNotifications.push(sentNotif);

    await receiver.save();
    await sender.save();

    console.log("✅ Notification sent successfully:", notifId);
    return notifId;
  } catch (error) {
    console.error("❌ sendNotification error:", error);
    throw error;
  }
};
