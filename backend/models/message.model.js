import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Either a private message (receiverId) OR a global message (room = "global")
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null means it's not a private DM
    },

    room: {
      type: String,
      default: null, // e.g., "global", "room123"
      index: true,
    },
     clanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clan",
      default: null,
      index: true, // for fast group fetch
    },
    system: {
  type: Boolean,
  default: false
},



    text: {
      type: String,
    },

    image: {
      type: String,
    },

    // Only for global messages: TTL deletes after 5 minutes
    expiresAt: {
      type: Date,
      default: null, // set only if message is global
      index: { expires: '5m' }, // MongoDB TTL index
    },
  },
  { timestamps: true }
);

// Middleware: set expiresAt if it's a global message
messageSchema.pre("save", function (next) {
  if (this.room === "global") {
    this.expiresAt = new Date();
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
