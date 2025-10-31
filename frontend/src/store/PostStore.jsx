import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";
import { persist } from "zustand/middleware";
import { url } from "../URL";

/**
 * 🔥 Zustand Store: usePostStore
 * Handles posts (community challenges) — CRUD, likes, comments, and verifications.
 *
 * ✅ Integrated with:
 * - `postController.js` routes
 * - Cloudinary uploads handled backend-side
 * - Community verification system
 *
 * Each post corresponds to a user's completed challenge batch.
 */
export const usePostStore = create(
  persist(
    (set, get) => ({
      // --- 🧠 STATE ---
      posts: [], // All community posts
      userPosts: [], // Logged-in user’s own posts
      singlePost: null, // One detailed post view
      loading: false,
      submitting: false,
      verifying: false,
      commenting: false,
      draftPosts: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0,
      completedPosts: [],
      comments: {}, // ✅ { postId: [comments] }

      // --- 🧩 ACTIONS ---

      /**
       * 📤 Submit a challenge solution
       * - Automatically uploads image via backend (Cloudinary)
       * - Creates or updates post for the batch
       */
      submitSolution: async (data) => {
        // { userId, batchType, challengeIndex, textSummary, image (base64) }
        try {
          set({ submitting: true });
          const res = await axios.post(`${url}/posts/submit`, data);
          toast.success("✅ Solution submitted!");
          const { userId, batchType } = data;
          await get().fetchChallenges(userId, batchType);

          
          return res.data?.post;
        } catch (err) {
          console.error("❌ submitSolution:", err.message);
          toast.error("Failed to submit solution");
        } finally {
          set({ submitting: false });
        }
      },

      /**
       * 🧾 Fetch all posts from community
       * - Use for global feed
       */
      fetchAllPosts: async () => {
        try {
          set({ loading: true });
          const res = await axios.get(`${url}/posts/all`);
          set({ posts: res.data });
        } catch (err) {
          console.error("❌ fetchAllPosts:", err.message);
          toast.error("Failed to fetch community posts");
        } finally {
          set({ loading: false });
        }
      },

      /**
       * 👤 Fetch posts by a specific user
       * - Shows user’s history of shared batches
       */
      fetchUserPosts: async (userId) => {
        try {
          set({ loading: true });
          const res = await axios.get(`${url}/posts/user/${userId}`);
          set({ userPosts: res.data });
        } catch (err) {
          console.error("❌ fetchUserPosts:", err.message);
          toast.error("Failed to load user posts");
        } finally {
          set({ loading: false });
        }
      },

      /**
       * 🔍 Get single post by ID
       * - For detailed view / comments page
       */
      fetchSinglePost: async (postId) => {
        try {
          set({ loading: true });
          const res = await axios.get(`${url}/posts/${postId}`);
          set({ singlePost: res.data });
        } catch (err) {
          console.error("❌ fetchSinglePost:", err.message);
          toast.error("Failed to fetch post");
        } finally {
          set({ loading: false });
        }
      }, // ✅ Fetch comments for one post
      fetchPostComments: async (postId) => {
        try {
          const res = await axios.get(`${url}/posts/${postId}/comments`);
          set((state) => ({
            comments: {
              ...state.comments,
              [postId]: res.data, // store per post
            },
          }));
        } catch (err) {
          console.error("fetchPostComments error:", err.message);
        }
      },

      /**
       * ❤️ Like or unlike a post
       * - Uses userId from auth store
       */
      toggleLike: async (postId, userId) => {
        try {
          const res = await axios.post(`${url}/posts/${postId}/like`, {
            userId,
          });
          toast.success(res.data.message);
          // Refresh local post state
          get().fetchAllPosts();
          get().fetchUserPostsByStatus(userId); // add this
        } catch (err) {
          console.error("❌ toggleLike:", err.message);
          toast.error("Failed to update like");
        }
      },

      /**
       * 💬 Add comment (supports nested replies)
       * - parentCommentId optional for reply
       */
      addComment: async (postId, data) => {
        try {
          set({ commenting: true });
          const res = await axios.post(`${url}/posts/comment/${postId}`, data);
          toast.success("💬 Comment added!");
          // Refresh both single post and list
          get().fetchAllPosts();
          get().fetchUserPostsByStatus(data.userId);
        } catch (err) {
          console.error("❌ addComment:", err.message);
          toast.error("Failed to add comment");
        } finally {
          set({ commenting: false });
        }
      },

      /**
       * 🧩 Verify post (community approval)
       * - Increases user’s community points
       * - If 45+ verifications → marks verified and updates metrics
       */
      verifyPost: async (postId, verifierId, challengeIndex) => {
        try {
          set({ verifying: true });
          const res = await axios.post(`${url}/posts/verify/${postId}`, {
            verifierId,
            challengeIndex,
          });
          toast.success("✅ Post verified successfully!");
          get().fetchAllPosts();
          return res.data?.post;
        } catch (err) {
          console.error("❌ verifyPost:", err.message);
          toast.error(err.response?.data?.error || "Verification failed");
        } finally {
          set({ verifying: false });
        }
      },

      /**
       * 🗑️ Delete a post (only by owner)
       */
      deletePost: async (postId, userId) => {
        try {
          await axios.delete(`${url}/posts/${postId}/delete`, {
            data: { userId },
          });
          toast.success("🗑️ Post deleted");
          get().fetchAllPosts();
        } catch (err) {
          console.error("❌ deletePost:", err.message);
          toast.error("Failed to delete post");
        }
      },
      fetchUserPostsByStatus: async (userId) => {
        try {
          set({ loading: true });
          const res = await axios.get(`${url}/posts/user/${userId}/status`);
          set({
            draftPosts: res.data.draftPosts,
            completedPosts: res.data.completedPosts,
          });
        } catch (err) {
          console.error("❌ fetchUserPostsByStatus:", err.message);
        } finally {
          set({ loading: false });
        }
      },
      fetchLatestPost: async (nextPage = 1) => {
        try {
          set({ loading: true });
          const res = await axios.get(
            `${url}/posts/live/paginated?page=${nextPage}`
          );

          // Append new posts if not the first page
          set((state) => ({
            completedPosts:
              nextPage === 1
                ? res.data.posts
                : [...state.completedPosts, ...res.data.posts],
            currentPage: res.data.currentPage,
            totalPages: res.data.totalPages,
            totalPosts: res.data.totalPosts,
          }));
        } catch (err) {
          console.error("❌ fetchLatestPost:", err.message);
        } finally {
          set({ loading: false });
        }
      },

      updatePost: async (postId, data) => {
        try {
          const res = await axios.put(`${url}/posts/update/${postId}`, data);
          toast.success("Post updated!");
          // refresh the posts list
          const userId = res.data.post.userId;
          get().fetchUserPostsByStatus(userId);
        } catch (err) {
          console.error("❌ updatePost:", err.message);
          toast.error("Failed to update post");
        }
      },
    }),
    {
      name: "post-storage",
      getStorage: () => localStorage,
      // Don’t persist large data (posts list, etc.)
      partialize: (state) => {
        const { posts, userPosts, singlePost, ...rest } = state;
        return rest;
      },
    }
  )
);
