import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  clanId: { type: mongoose.Schema.Types.ObjectId, ref: "Clan", default: null },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // submissions
  score: { type: Number, default: 0 },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ["1v1", "clanWar"], required: true },

    // Common challenge batch
    challengeBatchId: { type: mongoose.Schema.Types.ObjectId, ref: "ChallengeBatch", required: true },

    // Competing sides
    teamA: teamSchema,
    teamB: teamSchema,

    // Event status
    live: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },

    startTime: { type: Date },
    endTime: { type: Date },

    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Clan" },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
