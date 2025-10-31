import mongoose from "mongoose";

const challengeProofSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "ChallengeBatch.challenges" },
  title: String,
  description: String,
  proofText: String, // user summary of how they completed the challenge
  proofImage: String, // Cloudinary URL
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  verifyCount: { type: Number, default: 0 },
});

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  text: String,
  replies: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "ChallengeBatch", required: true },

    // challenge summaries & uploads
    challenges: [challengeProofSchema],

    live:{type:Boolean,default:false},
    discription:{type:String},
    tags:[{type:String}],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
   comments: [commentSchema],
 commentCount: { type: Number, default: 0 }, // ✅ new addition
    caption: { type: String, default: "" },

    // verification system
    verified: { type: Boolean, default: false },
    minVerifications: { type: Number, default: 45 },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
postSchema.pre("save", function (next) {
  this.commentCount = this.comments.length;
  next();
});
const Post = mongoose.model("Post", postSchema);
export default Post;
