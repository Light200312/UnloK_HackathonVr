import React, { useState } from "react";
import { CheckCircle, Image as ImageIcon } from "lucide-react";

export default function PostCard({ post, onVerify }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="bg-[#0b0f14] border border-emerald-500/40 rounded-2xl shadow-[0_0_20px_rgba(0,255,180,0.1)] p-6 text-gray-200 mb-6 transition-all hover:shadow-[0_0_25px_rgba(0,255,180,0.3)] hover:border-emerald-400/70">
      
      {/* 🧠 Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {post.userId?.username || "Unknown User"}
          </h2>
          <p className="text-sm text-gray-400">{post.userId?.rank || "Novice"}</p>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* 🏁 Challenges List */}
      <ul className="space-y-3 mt-4">
        {post.challenges.map((ch, i) => (
          <li
            key={i}
            onClick={() =>
              setExpandedIndex(expandedIndex === i ? null : i)
            }
            className={`border border-emerald-500/40 rounded-xl p-4 cursor-pointer 
                        bg-gradient-to-b from-[#0f151a] to-[#050708]
                        transition-all duration-300 
                        ${
                          expandedIndex === i
                            ? "shadow-[0_0_15px_rgba(0,255,180,0.4)] border-emerald-400"
                            : "hover:shadow-[0_0_10px_rgba(0,255,180,0.2)]"
                        }`}
          >
            {/* Challenge Top Bar */}
            <div className="text-xs uppercase text-emerald-400 tracking-wider mb-2">
              {ch.metricCategory || "UNKNOWN"} • {ch.subMetric || "N/A"}
            </div>
            <div className="flex  justify-between items-center">
              <h3 className="font-semibold text-white text-sm sm:text-base">
                {ch.title}
              </h3>
          

             
            </div>
            <div className=" text-gray-100 ">
              {ch.description}
            </div>
            <div className="flex justify-between w-full"> 
              <span>My Solution:</span> 
              <button className="text-xs text-emerald-400 hover:text-white transition">
                {expandedIndex === i ? "Hide" : "View"}
              </button>
            </div>

            {/* Expanded Content */}
            {expandedIndex === i && (
              <div className="mt-3 border-t border-gray-800 pt-3 space-y-3 animate-fadeIn">
                {/* Proof Text */}
                {ch.proofText && (
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {ch.proofText}
                  </p>
                )}

                {/* Proof Image */}
                {ch.proofImage && (
                  <div className="rounded-xl overflow-hidden border border-gray-700">
                    <img
                      src={ch.proofImage}
                      alt="proof"
                      className="w-full max-h-64 object-cover hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center gap-2">
                  <div>{ch.verifyCount}/7</div>
                  <button
                    onClick={() => onVerify && onVerify(ch, post._id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-sm transition-all"
                  >
                    <CheckCircle size={14} /> Verify
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
