import Post from "../models/Post.model.js";
import User from "../models/User.js";
import ChallengeBatch from "../models/ChallengeBatch.js";
import Matrix from "../models/Matrix.js";
import cloudinary from "../config/cloudinary.js";

/* ------------------------------------------------------------
 ✅ Submit challenge solution
------------------------------------------------------------ */
export const submitChallengeSolution = async (req, res) => {
  try {
    const { userId, batchType, challengeIndex, textSummary, image } = req.body;

    const user = await User.findById(userId);
    const batch = await ChallengeBatch.findOne({ userId, type: batchType });

    if (!user || !batch)
      return res.status(404).json({ error: "User or batch not found" });

    // ⏰ Stop accepting after time limit
    if (Date.now() > new Date(batch.expiresAt).getTime()) {
      if (!batch.submissionClosed) {
        batch.submissionClosed = true;
        await batch.save();
      }
      return res.status(400).json({ error: `⏰ ${batchType} submissions closed.` });
    }

    const challenge = batch.challenges[challengeIndex];
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    // 🧩 Prevent duplicate submission
    if (challenge.submitted && batch.submissionClosed === false) {
      return res.status(400).json({ error: "You already submitted this challenge." });
    }

    // 🖼️ Upload image to Cloudinary if provided
    let imageUrl = challenge.image;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // ✅ Mark as submitted if proofText and image both exist
    if (textSummary && imageUrl) {
      challenge.submitted = true;
      challenge.submittedAt = new Date();
      challenge.completed = true;
      challenge.completedAt = new Date();
    }

    await batch.save();

    // ✅ Update or create Post
    let post = await Post.findOne({ userId, batchId: batch._id });
    if (!post) {
      post = new Post({ userId, batchId: batch._id, challenges: [] });
    }

    const existing = post.challenges.find(
      (c) => c.challengeId?.toString() === challenge._id.toString()
    );

    if (existing) {
      existing.proofText = textSummary || existing.proofText;
      existing.proofImage = imageUrl || existing.proofImage;
    } else {
      post.challenges.push({
        challengeId: challenge._id,
        title: challenge.title,
        description: challenge.description,
        proofText: textSummary,
        proofImage: imageUrl,
      });
    }

    await post.save();

    res.status(200).json({
      message: "✅ Challenge solution submitted successfully",
      post,
      challenge,
    });
  } catch (error) {
    console.error("❌ submitChallengeSolution:", error.message);
    res.status(500).json({ error: "Failed to submit challenge solution" });
  }
};


/* ------------------------------------------------------------
 ✅ Verify post (for metrics + matrix)
------------------------------------------------------------ */
export const verifyPost = async (req, res) => {
  try {
    const { verifierId, challengeIndex } = req.body;
    const { postId } = req.params;

    // 🔍 Find post & user
    const post = await Post.findById(postId);
    const verifier = await User.findById(verifierId);
    if (!post || !verifier)
      return res.status(404).json({ error: "Post or user not found" });

    // 🔍 Find related challenge batch
    const batchOfChallenges = await ChallengeBatch.findById(post.batchId);
    if (!batchOfChallenges)
      return res.status(404).json({ error: "Batch not found" });

    const challenge = batchOfChallenges.challenges[challengeIndex];
    if (!challenge)
      return res.status(404).json({ error: "Challenge index invalid" });

    // 🔍 Match corresponding challenge inside post
    const challengeNeededToVerify = post.challenges?.find(
      (c) => c.challengeId?.toString() === challenge._id.toString()
    );

    if (!challengeNeededToVerify)
      return res.status(404).json({ error: "Challenge not found in post" });

    // 🧩 Prevent duplicate verification
    if (challengeNeededToVerify.verifiedBy?.includes(verifierId))
      return res.status(400).json({ error: "Already verified" });

    // ✅ Update verification
    challengeNeededToVerify.verifiedBy.push(verifierId);
    challengeNeededToVerify.verifyCount =
      challengeNeededToVerify.verifiedBy?.length || 0;

    // 🪙 Increase community points
    verifier.communityPoints = (verifier.communityPoints || 0) + 1;
    await verifier.save();

    // 🧠 Determine metric increment
    const incrementMap = { daily: 5, weekly: 10, monthly: 20 };
    const category = batchOfChallenges.type;
    const increment = incrementMap[category] || 0;

    // 🏁 When challenge gets enough verifications
    if (challengeNeededToVerify.verifyCount >= 45 && !post.verified) {
      post.verified = true;

      for (const ch of batchOfChallenges.challenges) {
        ch.completed = true;
        ch.completedAt = new Date();

        const matrix = await Matrix.findOne({
          userId: post.userId,
          "metrics.name": ch.subMetric,
        });

        if (matrix) {
          const targetMetric = matrix.metrics.find(
            (m) => m.name === ch.subMetric
          );
          if (targetMetric) {
            targetMetric.value = Math.min(100, targetMetric.value + increment);
            await matrix.save();
          }
        }
      }
      await batchOfChallenges.save();
    }

    await post.save();
    res.status(200).json({ message: "✅ Post verified successfully", post });
  } catch (error) {
    console.error("❌ verifyPost:", error.message);
    res.status(500).json({ error: "Failed to verify post: " + error.message });
  }
};

/* ------------------------------------------------------------
 ✅ Like or Unlike a Post
------------------------------------------------------------ */
export const likePost = async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    const post = await Post.findById(postId).select("-comments");
    if (!post) return res.status(404).json({ error: "Post not found" });

    // make sure likes exists
    if (!Array.isArray(post.likes)) post.likes = [];

    const index = post.likes.indexOf(userId);
    if (index === -1) post.likes.push(userId);
    else post.likes.splice(index, 1);

    await post.save();

    res.status(200).json({
      message: index === -1 ? "Post liked" : "Like removed",
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error("❌ likePost:", err.message);
    res.status(500).json({ error: "Failed to like post" });
  }
};

/* ------------------------------------------------------------
 ✅ Add comment or reply
------------------------------------------------------------ */
// ✅ Add comment (supports nested replies)
export const addComment = async (req, res) => {
  try {
    const { userId, text, parentCommentId } = req.body;
    const { postId } = req.params;

    const user = await User.findById(userId);
    const post = await Post.findById(postId);
    if (!user || !post)
      return res.status(404).json({ error: "User or Post not found" });

    const newComment = {
      userId,
      username: user.username,
      text,
      replies: [],
      createdAt: new Date(),
    };

    if (parentCommentId) {
      const parent = post.comments.id(parentCommentId);
      if (!parent)
        return res.status(404).json({ error: "Parent comment not found" });
      parent.replies.push(newComment);
    } else {
      post.comments.push(newComment);
    }

    post.commentCount = post.comments.length; // ✅ ensure count updated

    await post.save();
    res.status(201).json({
      message: "💬 Comment added",
      commentCount: post.commentCount,
    });
  } catch (error) {
    console.error("❌ addComment:", error.message);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

/* ------------------------------------------------------------
 ✅ Get Post Comments (new)
------------------------------------------------------------ */
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId, "comments")
      .populate("comments.userId", "username rank")
      .lean();

    if (!post) return res.status(404).json({ error: "Post not found" });

    res.status(200).json(post.comments || []);
  } catch (error) {
    console.error("❌ getPostComments:", error.message);
    res.status(500).json({ error: "Failed to fetch post comments" });
  }
};

/* ------------------------------------------------------------
 ✅ Fetch Posts (exclude comments)
------------------------------------------------------------ */
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({}, "-comments")
      .populate("userId", "username rank")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ getAllPosts:", error.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId }, "-comments").sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ getUserPosts:", error.message);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

export const getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId, "-comments").populate(
      "userId",
      "username rank"
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    console.error("❌ getSinglePost:", error.message);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

export const getUserPostsByStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch posts for user
    const posts = await Post.find({ userId }, "-comments")
      .populate("userId", "username rank avatar")
      .sort({ createdAt: -1 })
      .lean();

    // Attach metric + submetric from ChallengeBatch
    for (const post of posts) {
      const batch = await ChallengeBatch.findById(post.batchId).lean();
      if (batch) {
        post.challenges = post.challenges.map((ch) => {
          const ref = batch.challenges.find(
            (bch) => bch._id.toString() === ch.challengeId.toString()
          );
          return {
            ...ch,
            metricCategory: ref?.metricCategory,
            subMetric: ref?.subMetric,
          };
        });
      }
    }

    const draftPosts = posts.filter((p) => !p.live);
    const completedPosts = posts.filter((p) => p.live);

    res.status(200).json({ draftPosts, completedPosts });
  } catch (error) {
    console.error("❌ getUserPostsByStatus:", error.message);
    res.status(500).json({ error: "Failed to fetch posts by status" });
  }
};

// ✅ Fetch paginated live posts (10 at a time)
export const getPaginatedLivePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // which page (default: 1)
    const limit = 10; // number of posts per page
    const skip = (page - 1) * limit;

    // 🔹 Fetch only live posts, skip comments field for performance
    const posts = await Post.find({ live: true }, "-comments")
      .populate("userId", "username rank avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 🔹 Count total posts for pagination metadata
    const totalPosts = await Post.countDocuments({ live: true });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    console.error("❌ getPaginatedLivePosts:", error.message);
    res.status(500).json({ error: "Failed to fetch live posts" });
  }
};

/* ------------------------------------------------------------
 ✅ Update Post (caption, description, tags)
------------------------------------------------------------ */
export const updatePostDetails = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption, description, tags, live } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (caption !== undefined) post.caption = caption;
    if (description !== undefined) post.description = description;
    if (tags !== undefined) post.tags = tags;
    if (live !== undefined) post.live = live;

    await post.save();
    res.status(200).json({ message: "✅ Post updated successfully", post });
  } catch (error) {
    console.error("❌ updatePostDetails:", error.message);
    res.status(500).json({ error: "Failed to update post details" });
  }
};

/* ------------------------------------------------------------
 ✅ Delete Post
------------------------------------------------------------ */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.userId.toString() !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "🗑️ Post deleted successfully" });
  } catch (error) {
    console.error("❌ deletePost:", error.message);
    res.status(500).json({ error: "Failed to delete post" });
  }
};
