import express from "express";
const router = express.Router();

import {
  submitChallengeSolution,
  verifyPost,
  likePost,
  addComment,
  getAllPosts,
  getUserPosts,
  getSinglePost,getPaginatedLivePosts,
  deletePost,getUserPostsByStatus, updatePostDetails,getPostComments
} from "../controllers/PostController.controller.js";

// 🟢 Submit or update a challenge’s solution (text/image proof)
router.post("/submit", submitChallengeSolution);

// 🟣 Verify a post (increments verify count, updates metrics when verified)
router.post("/verify/:postId", verifyPost);
router.get("/", (req,res)=> res.send("hello from Posts"));

// 💙 Like or unlike a post
router.post("/:postId/like", likePost);

// 💬 Add a comment (supports nested replies)
router.post("/comment/:postId", addComment);

// 📜 Fetch all community posts (feed)
router.get("/all", getAllPosts);

// 👤 Fetch posts for a specific user
router.get("/user/:userId", getUserPosts);

// 🔍 Fetch one specific post by ID
router.get("/:postId", getSinglePost);

// ❌ Delete a post (user-owned or admin)
router.delete("/:postId/delete", deletePost);

// Fetch user posts by status (draft vs completed)
router.get("/user/:userId/status", getUserPostsByStatus);

router.get("/:postId/comments", getPostComments);

// Update post caption, description, tags, live status
router.put("/update/:postId", updatePostDetails);

router.get("/live/paginated", getPaginatedLivePosts);

export default router;
