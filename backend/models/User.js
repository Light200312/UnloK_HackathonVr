import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";



const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, default: uuidv4 },
  type: { type: String, enum: ["friend", "clan", "quest"], required: true },
  direction: { type: String, enum: ["sent", "received"], required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String },
  receiverName: { type: String },
  message: { type: String },
  isAccepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: "relatedModel" },
  relatedModel: { type: String, enum: ["Clan", "Quest", "User", "Post"], default: "User" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    rank: { type: String },
    points: { type: String },
    titles: [{ type: String }],
    badges: [{ type: String }],

    communityPoints: { type: Number, default: 0 },
    verifiedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    clan: { type: mongoose.Schema.Types.ObjectId, ref: "Clan", default: null },
    clanRole: { type: String, enum: ["leader", "co-leader", "member", "none"], default: "none" },

    matrices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Matrix" }],
    friendList: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        rank: { type: String },
      },
    ],

    Followers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        rank: { type: String },
      },
    ],
    relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: "relatedModel" },
relatedModel: { type: String, enum: ["Clan", "Quest", "User", "Post"], default: "User" },


    requestsNotifications: [notificationSchema],

    questSynced: { type: Boolean, default: false },
    questSyncedWith: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    questSyncedDuration: { type: Date },
  },
  { timestamps: true }
);

// Hash before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
