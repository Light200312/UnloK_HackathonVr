import mongoose from "mongoose";

const clanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  bannerImage: String,

  leader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coLeaders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  chatRoomId: { type: String, unique: true },
  clanPoints: { type: Number, default: 0 },
  rank: { type: String, default: "Bronze" },

  createdAt: { type: Date, default: Date.now },
});

const Clan = mongoose.model("Clan", clanSchema);
export default Clan;
