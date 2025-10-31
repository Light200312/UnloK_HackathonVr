import React, { useEffect, useState } from "react";
import { usePostStore } from "../store/PostStore";
import { UserAuth } from "../store/userAuthStore";
import { toast } from "react-hot-toast";

export default function MyPostsPage() {
  const { authUser } = UserAuth();
  const userId = authUser?._id;

  const {
    fetchUserPostsByStatus,
    draftPosts,
    completedPosts,
    updatePost,
    deletePost,
    loading,
  } = usePostStore();

  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserPostsByStatus(userId);
    }
  }, [userId]);

  const handleInputChange = (postId, field, value) => {
    setEditingPost((prev) => ({
      ...prev,
      [postId]: { ...prev?.[postId], [field]: value },
    }));
  };

  const handleSave = async (postId) => {
    const data = editingPost?.[postId];
    if (!data) return;
    await updatePost(postId, data);
    setEditingPost((prev) => {
      const clone = { ...prev };
      delete clone[postId];
      return clone;
    });
  };

  const handlePublish = (postId) => {
    updatePost(postId, { live: true });
  };

  const handleUnpublish = (postId) => {
    updatePost(postId, { live: false });
  };

  const handleDelete = (postId) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      deletePost(postId, userId);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading posts...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Draft Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">📝 Draft Posts</h2>
        {draftPosts.length === 0 ? (
          <p className="text-gray-500">No drafts available.</p>
        ) : (
          draftPosts.map((post) => (
            <div
              key={post._id}
              className="border border-gray-300 rounded-xl p-4 mb-6 bg-gray-300 shadow-sm text-primary"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Draft #{post._id.slice(-5)}
              </h3>

              {/* Caption */}
              <label className="block text-sm font-medium text-gray-700">
                Caption
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 mb-3"
                value={
                  editingPost?.[post._id]?.caption ?? post.caption ?? ""
                }
                onChange={(e) =>
                  handleInputChange(post._id, "caption", e.target.value)
                }
              />

              {/* Description */}
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows="3"
                className="w-full border rounded-md p-2 mb-3"
                placeholder="Write a short description..."
                value={
                  editingPost?.[post._id]?.description ??
                  post.discription ??
                  ""
                }
                onChange={(e) =>
                  handleInputChange(post._id, "description", e.target.value)
                }
              />

              {/* Tags */}
              <label className="block text-sm font-medium text-gray-700">
                Tags (comma separated)
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 mb-3"
                value={
                  editingPost?.[post._id]?.tags?.join(", ") ||
                  post.tags?.join(", ") ||
                  ""
                }
                onChange={(e) =>
                  handleInputChange(post._id, "tags", e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean))
                }
              />

              {/* Challenge Solutions */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Challenge Solutions
                </h4>
                <div className="space-y-3">
                  {post.challenges.map((ch) => (
                    <div
                      key={ch.challengeId}
                      className="border border-gray-200 p-3 rounded-md bg-white"
                    >
                      <p className="font-semibold">{ch.title}</p>
                      <p className="text-gray-600 text-sm">
                        {ch.proofText || "No summary yet."}
                      </p>
                      {ch.proofImage && (
                        <img
                          src={ch.proofImage}
                          alt={ch.title}
                          className="mt-2 rounded-md w-56 border"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleSave(post._id)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => handlePublish(post._id)}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700"
                >
                  🚀 Publish
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Completed Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">✅ Published Posts</h2>
        {completedPosts.length === 0 ? (
          <p className="text-gray-500">No published posts yet.</p>
        ) : (
          completedPosts.map((post) => (
            <div
              key={post._id}
              className="border border-gray-300 rounded-xl p-4 mb-6 bg-white shadow"
            >
              <h3 className="text-xl font-semibold">{post.caption || "Untitled Post"}</h3>
              <p className="text-gray-700 mb-2">{post.discription || "No description"}</p>
              <p className="text-sm text-gray-500 mb-3">
                Tags: {post.tags?.join(", ") || "No tags"}
              </p>

              {/* Challenge previews */}
              <div className="grid gap-3 md:grid-cols-2">
                {post.challenges.map((ch) => (
                  <div
                    key={ch.challengeId}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <p className="font-semibold">{ch.title}</p>
                    <p className="text-sm text-gray-600">{ch.proofText}</p>
                    {ch.proofImage && (
                      <img
                        src={ch.proofImage}
                        alt={ch.title}
                        className="mt-2 rounded-md border w-52"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleUnpublish(post._id)}
                  className="bg-yellow-500 text-white px-4 py-1.5 rounded-md hover:bg-yellow-600"
                >
                  🔒 Unpublish
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
