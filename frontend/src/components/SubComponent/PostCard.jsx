import React, { useState } from "react";
import {
  CheckCircle,
  Eye,
  Tag,
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import { cn } from "../../lib/utils"; // Assuming you have cn utility

/**
 * A redesigned, minimalist PostCard.
 *
 * It now expects the following props to be fully functional:
 * - post: The post object
 * - currentUserId: The ID of the logged-in user (to check if liked)
 * - onLike: (postId) => void
 * - onShowComments: (postId) => void
 * - onAddComment: (postId, commentText) => void
 * - onVerify: (challenge, postId) => void
 */
export default function PostCard({
  post,
  currentUserId,
  onLike,
  onShowComments,
  onAddComment,
  onVerify,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Check if the current user has liked this post
  const isLiked = post.likes?.includes(currentUserId);

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle the new comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(post._id, commentText);
    setCommentText("");
  };

  return (
    <div
      className={cn(
        "bg-base-200 rounded-lg shadow p-4 sm:p-6 text-base-content mb-6 transition-all",
        "border border-base-300/50 hover:border-primary/20" // Cleaner border
      )}
    >
      {/* --- Card Header: User Info --- */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img
            src={post.userId?.profilePic || "/profile.png"} // Use placeholder
            alt={post.userId?.username || "user"}
            className="w-10 h-10 rounded-full bg-base-300 object-cover border border-base-300"
          />
          <div>
            <h2 className="font-semibold text-base-content">
              {post.userId?.username || "Unknown User"}
            </h2>
            <p className="text-sm text-base-content/70">
              {post.userId?.rank || "Novice"}
            </p>
          </div>
        </div>
        <div className="text-sm text-base-content/60 pt-1">
          {formatDate(post.createdAt)}
        </div>
      </div>

      {/* --- Post Caption/Description --- */}
      {post.discription && (
        <p className="text-base-content/90 my-4 whitespace-pre-line">
          {post.discription}
        </p>
      )}

      {/* --- Post Tags --- */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="badge badge-outline badge-primary text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* --- Challenges List --- */}
      <ul className="space-y-3 mt-4">
        {post.challenges.map((ch, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <li
              key={ch.challengeId || i}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className={cn(
                "bg-base-100 border border-base-300 rounded-lg p-3.5 cursor-pointer",
                "transition-all duration-300 hover:border-primary/50",
                isExpanded && "border-primary/50"
              )}
            >
              {/* --- Always Visible Challenge Info --- */}
              <div>
                <div className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <Tag size={14} />
                  <span>
                    {ch.metricCategory || "General"} • {ch.subMetric || "N/A"}
                  </span>
                </div>
                <h3 className="text-md font-semibold text-base-content mt-1">
                  {ch.title}
                </h3>
              </div>

              {/* --- Footer / Toggle --- */}
              <div className="flex justify-between items-center mt-3 text-sm">
                <span className="font-medium text-primary/80">
                  {ch.verifyCount}/7 Verifications
                </span>
                <span className="font-medium text-primary flex items-center gap-1">
                  {isExpanded ? "Hide" : "View Solution"}
                  <Eye size={14} />
                </span>
              </div>

              {/* --- Expanded Content --- */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-base-300 space-y-4">
                  {/* Proof Text */}
                  {ch.proofText && (
                    
                    <div>
                      <div className="mb-2 text-gray-500"> {ch.description}</div>
                      <h4 className="text-xs font-semibold uppercase text-base-content/70 mb-1">
                        My Solution:
                      </h4>
                      <p className="text-sm text-base-content/90 leading-relaxed whitespace-pre-line">
                        {ch.proofText}
                      </p>
                    </div>
                  )}

                  {/* Proof Image */}
                  {ch.proofImage && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-base-content/70 mb-1">
                        Proof Image:
                      </h4>
                      <img
                        src={ch.proofImage}
                        alt="proof"
                        className="w-full max-h-72 object-cover rounded-md border border-base-300 mt-2"
                      />
                    </div>
                  )}

                  {/* Verify Button */}
                  {onVerify && (
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents accordion from closing
                          onVerify(ch, post._id);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={16} />
                        Verify Solution
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* --- Post Actions (Like/Comment) --- */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-base-300">
        {onLike && (
          <button
            onClick={() => onLike(post._id)}
            className={cn(
              "btn btn-sm btn-ghost flex items-center gap-1.5",
              isLiked ? "text-primary" : "text-base-content/70"
            )}
            aria-label="Like post"
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            {post.likes?.length || 0}
          </button>
        )}
        {onShowComments && (
          <button
            onClick={() => onShowComments(post._id)}
            className="btn btn-sm btn-ghost flex items-center gap-1.5 text-base-content/70"
            aria-label="Show comments"
          >
            <MessageCircle size={16} />
            {post.commentCount || 0}
          </button>
        )}
      </div>

      {/* --- Add Comment Input --- */}
      {onAddComment && (
        <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Add a comment..."
            className="input input-bordered input-sm w-full bg-base-100"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            aria-label="Add a comment"
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm btn-square"
            aria-label="Send comment"
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
