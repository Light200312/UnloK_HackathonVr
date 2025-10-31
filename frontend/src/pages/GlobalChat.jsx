"use client";
import React, { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/Chatstore";
import { UserAuth } from "../store/userAuthStore";
import { usePostStore } from "../store/PostStore"; // 1. Import PostStore
import PostCard from "../components/SubComponent/PostCard";
import { MessageCircle, Send, X } from "lucide-react";

// 5. A new modal component to show comments
const CommentsModal = ({ postId, comments, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-base-300">
          <h3 className="text-lg font-semibold">Comments</h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-base-content/70 text-center">
              No comments yet.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex items-start gap-3">
                <img
                  src={comment.userId?.profilePic || "/profile.png"}
                  alt={comment.username}
                  className="w-8 h-8 rounded-full bg-base-300"
                />
                <div className="flex-1 bg-base-200 p-3 rounded-md">
                  <p className="font-semibold text-sm">{comment.username}</p>
                  <p className="text-base-content/90">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const GlobalChat = () => {
  const { authUser } = UserAuth(); // 2. Get authed user
  const {
    globalMessages,
    isMessagesLoading,
    getUsers,
    getGlobalMessage,
    subscribeToGlobal,
    unsubscribeFromGlobal,
    sendGlobalMessage,
  } = useChatStore();

  // 3. Get all functions and data from PostStore
  const {
    fetchLatestPost,
    completedPosts,
    loading,
    currentPage,
    totalPages,
    toggleLike,
    addComment,
    verifyPost,
    fetchPostComments,
    comments: postComments, // Rename to avoid conflict
  } = usePostStore();

  const [messageData, setMessageData] = useState({
    text: "",
    image: "",
    userId: authUser?._id,
  });

  // 4. State for comment modal
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const mainRef = useRef(null);
  const scrollTimeout = useRef(null);

  // ... (existing useEffects for chat and scroll) ...

  // ⚡ Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalMessages]);

  // ⚡ Fetch chat & posts
  useEffect(() => {
    if (authUser?._id) {
      getUsers(authUser._id);
      getGlobalMessage();
      subscribeToGlobal();
    }
    fetchLatestPost(1);
    return () => unsubscribeFromGlobal();
  }, [authUser?._id]);

  // ⚡ Infinite scroll for posts
  const handleScroll = (e) => {
    if (scrollTimeout.current) return;
    scrollTimeout.current = setTimeout(() => {
      const bottom =
        e.target.scrollHeight - e.target.scrollTop <=
        e.target.clientHeight + 100;
      if (bottom && !loading && currentPage < totalPages) {
        fetchLatestPost(currentPage + 1);
      }
      scrollTimeout.current = null;
    }, 300);
  };

  useEffect(() => {
    const mainEl = mainRef.current;
    if (mainEl) mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl && mainEl.removeEventListener("scroll", handleScroll);
  }, [loading, currentPage, totalPages]);

  // ... (existing chat handlers) ...
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setMessageData((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageData.text.trim() && !messageData.image) return;
    sendGlobalMessage(messageData);
    setMessageData({ text: "", image: "", userId: authUser._id });
  };

  // 6. Define handler functions to pass to PostCard
  const handleShowComments = (postId) => {
    setSelectedPostId(postId);
    fetchPostComments(postId); // Fetch comments when modal is opened
    setIsCommentModalOpen(true);
  };

  const handleAddComment = (postId, text) => {
    if (!authUser?._id) return;
    addComment(postId, { userId: authUser._id, text });
    // Optionally re-fetch comments after adding
    setTimeout(() => fetchPostComments(postId), 500);
  };

  const handleLike = (postId) => {
    if (!authUser?._id) return;
    toggleLike(postId, authUser._id);
  };

  const handleVerify = (challengeToVerify, postId) => {
    if (!authUser?._id) return;

    const post = completedPosts.find((p) => p._id === postId);
    if (!post) return;

    // Find the index of the challenge, which is required by the backend
    const challengeIndex = post.challenges.findIndex(
      (c) => c.challengeId === challengeToVerify.challengeId
    );

    if (challengeIndex === -1) {
      console.error("Could not find challenge index in post");
      return;
    }

    verifyPost(postId, authUser._id, challengeIndex);
  };

  return (
    <div
      data-theme="forest"
      className="min-h-screen w-full flex bg-[#020617] text-white overflow-hidden relative"
    >
      {/* ... (existing background divs) ... */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05),transparent_70%)] animate-pulse" />

      {/* 🌌 Left Side – Community Feed */}
      <main
        ref={mainRef}
        className="flex-1  overflow-y-auto px-4 sm:px-8 py-10 backdrop-blur-lg bg-black/30 shadow-[0_0_20px_rgba(0,255,255,0.1)] relative z-10"
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]">
            {/* Title was empty, adding one */}
            Community Feed
          </h1>

          {loading && currentPage === 1 ? (
            <p className="text-center text-neutral-500">Loading posts...</p>
          ) : completedPosts.length === 0 ? (
            <p className="text-center text-neutral-500">No live posts yet</p>
          ) : (
            completedPosts
              .filter((p) => p.live)
              .map((post) => (
                // 7. Pass all props to the PostCard
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={authUser?._id}
                  onLike={handleLike}
                  onShowComments={handleShowComments}
                  onAddComment={handleAddComment}
                  onVerify={handleVerify}
                />
              ))
          )}

          {loading && currentPage > 1 && (
            <p className="text-center text-sm text-neutral-500 mt-3">
              Loading more posts...
            </p>
          )}
        </div>
      </main>

      {/* 💬 Right Side – Global Chat */}
      <aside className="hidden xl:flex flex-col w-[370px] border-l border-cyan-700/40 bg-black/30 backdrop-blur-lg relative z-10 shadow-[0_0_25px_rgba(0,255,255,0.15)]">
        {/* ... (existing chat UI) ... */}
        {/* Header */}
        <div className="p-4 border-b border-cyan-600/40 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-cyan-300">Global Chat</h2>
          <MessageCircle className="text-cyan-400" />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-cyan-700/50 scrollbar-track-black">
          {!globalMessages?.length ? (
            <div className="text-center text-neutral-500">
              No messages yet. Be the first!
            </div>
          ) : (
            globalMessages.map((m, i) => {
              const isMine = m.senderId?._id === authUser?._id;
              return (
                <div
                  key={m._id || i}
                  className={`flex flex-col ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {!isMine && (
                    <span className="text-xs text-cyan-400 mb-1 font-medium">
                      {m.senderId?.username || "Anonymous"}
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      isMine
                        ? "bg-cyan-600/40 border border-cyan-500/50"
                        : "bg-neutral-800/60 border border-cyan-700/30"
                    }`}
                    style={{
                      boxShadow: isMine
                        ? "0 0 10px rgba(0,255,255,0.3)"
                        : "0 0 5px rgba(0,255,255,0.2)",
                    }}
                  >
                    {m.text && <p>{m.text}</p>}
                    {m.image && (
                      <img
                        src={m.image}
                        alt="sent"
                        className="mt-2 max-h-48 rounded-md border border-cyan-700/40"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1">
                    {new Date(m?.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-cyan-700/40 flex items-center gap-2 bg-black/30"
        >
          <label className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <input
            name="text"
            value={messageData.text}
            onChange={(e) =>
              setMessageData({
                ...messageData,
                [e.target.name]: e.target.value,
              })
            }
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-black/40 border border-cyan-700/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 placeholder-cyan-800"
          />

          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full text-sm shadow-[0_0_8px_rgba(0,255,255,0.4)]"
          >
            <Send size={16} />
          </button>
        </form>

        {/* Image Preview */}
        {messageData.image && (
          <div className="border-t border-cyan-700/30 p-3 bg-black/40">
            <p className="text-sm text-cyan-400 mb-2">Image Preview:</p>
            <img
              src={messageData.image}
              alt="preview"
              className="max-h-48 rounded-lg object-cover border border-cyan-700/40"
            />
          </div>
        )}
      </aside>

      {/* 8. Render the modal */}
      {isCommentModalOpen && (
        <CommentsModal
          postId={selectedPostId}
          comments={postComments[selectedPostId] || []}
          onClose={() => setIsCommentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GlobalChat;