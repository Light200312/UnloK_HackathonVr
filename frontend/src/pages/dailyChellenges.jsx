import { useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { useChallengeBatchStore } from "../store/ChallengeBatch";
import { usePostStore } from "../store/PostStore";
import { UserAuth } from "../store/userAuthStore";
import { CardSpotlight } from "../components/ui/card-spotlight";
import toast from "react-hot-toast";
import { Camera, UploadCloud, Video, X } from "lucide-react"; // Added UploadCloud and X

const ChallengeComponent = () => {
  const { authUser } = UserAuth();
  const userId = authUser?._id;

  const {
    generateChallenges,
    fetchChallenges,
    challenges,
    loading,
  } = useChallengeBatchStore();

  const { submitSolution, submitting } = usePostStore();

  const [openDescIndex, setOpenDescIndex] = useState(0);
  const [formData, setFormData] = useState({});

  // Ref for hidden file input (still needed for click-to-upload)
  const fileInputRefs = useRef([]);

  const safeChallenges = Array.isArray(challenges)
    ? challenges
    : challenges?.data?.challenges || challenges?.challenges || [];

  useEffect(() => {
    if (!safeChallenges.length && userId) {
      // Assuming "daily" is the default batch type
      fetchChallenges(userId, "daily");
    }
  }, [userId, safeChallenges.length]);

  // Helper to update form data
  const updateFormData = (index, updates) => {
    setFormData((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        ...updates,
      },
    }));
  };

  // ✅ Handle image upload (preview & base64 conversion)
  const handleImageUpload = (e, index, fileOverride = null) => {
    const file = fileOverride || e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("File must be an image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData(index, {
        image: reader.result,
        imagePreview: URL.createObjectURL(file),
        fileName: file.name, // Store file name for display
      });
    };
    reader.readAsDataURL(file);
  };

  // ✅ Handle drag over event
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ✅ Handle drop event
  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    // 💡 Add check: Do not allow drop if submitted
    if (safeChallenges[index]?.submitted) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(null, index, files[0]);
    }
  };

  // ✅ Handle solution submission
  const handleSubmit = async (index) => {
    const c = safeChallenges[index];
    const entry = formData[index];
    if (!entry?.textSummary && !entry?.image) {
        toast.error("⚠️ Please add your Solution Summary or a Photo.");
        return;
    }
    if (!userId) {
      toast.error("Authentication required to submit.");
      return;
    }

    await submitSolution({
      userId,
      batchType: "daily",
      challengeIndex: index,
      textSummary: entry.textSummary || "",
      image: entry.image,
    });

    // Clear form for this challenge upon success (handled by store logic)
  };

  // Function to handle the click on the "Add Photo" button
  const handleAddPhotoClick = (index) => {
    // 💡 Add check: Do not allow click if submitted
    if (safeChallenges[index]?.submitted) return;
    fileInputRefs.current[index]?.click();
  };

  // Function to remove the image
  const handleRemoveImage = (index) => {
    updateFormData(index, { image: null, imagePreview: null, fileName: null });
    // Reset file input value to allow re-upload of the same file
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
  };


  return (
    <div
      // data-theme="forest"
      className="min-h-screen pt-24 p-2 flex items-center justify-center bg-background text-foreground"
      style={{
        backgroundImage: `url(./challengebg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      <div className="absolute inset-0 bg-black/20 z-0"></div>

      <CardSpotlight
        className="w-full max-w-2xl p-6 border-4 border-primary rounded-lg z-10"
        style={{
          boxShadow: "0 0 15px rgba(0, 191, 255, 0.7)",
          backgroundColor: "rgba(10, 10, 35, 0.7)",
          backdropFilter: "blur(10px)",
        }}
        color="#0A0A23"
        radius={350}
      >
        <div className="relative z-10">
          <div
            className="absolute -top-18 left-1/2 transform -translate-x-1/2 text-lg sm:text-3xl font-bold bg-primary px-4 py-2 rounded-t-lg "
          >
            Daily Quests
          </div>

          <div className="text-center my-4">
            <span
              onClick={() => {
                if (safeChallenges.length === 0)
                  generateChallenges(userId, "daily");
              }}
              className="text-sm border rounded-md p-1 hover:bg-muted hover:scale-105 transition text-white cursor-pointer"
            >
              New Quests
            </span>
          </div>

          {loading && (
            <p className="text-center text-muted-foreground">Loading...</p>
          )}

          <ul className="space-y-4 mt-4">
            {safeChallenges.map((c, i) => (
              <li
                key={i}
                className="flex flex-col border-2 border-primary rounded-md px-4 py-3 transition"
                style={{
                  boxShadow: "inset 0 0 10px rgba(0, 191, 255, 0.3)",
                  // 💡 Increased transparency for the LI background
                  backgroundColor: openDescIndex === i ? "rgba(20, 20, 50, 0.6)" : "rgba(20, 20, 50, 0.3)",
                  backdropFilter: "blur(5px)",
                }}
              >
                {/* --- Challenge Header (Always Visible) --- */}
                <div
                  className="flex flex-col cursor-pointer"
                  onClick={() => setOpenDescIndex(openDescIndex === i ? null : i)}
                >
                  {/* Title & Metric/SubMetric - CONSOLIDATED HEADING */}
                  <div className="text-base sm:text-lg font-bold text-white mb-1">
                    {c.metricCategory || "Category"} / {c.subMetric || "Metric"}
                  </div>
                  {/* Targeting */}
                  <div className="text-xs text-gray-400 mb-2">
                    **Challenge:** {c.title || "Daily Quest"}
                  </div>
                </div>

                {/* --- Challenge Details & Solution (Conditionally Rendered) --- */}
                {openDescIndex === i && (
                  <div className="mt-3 pt-3 border-t border-primary/50 space-y-4">

                    {/* Challenge Description */}
                    <div className="text-sm font-semibold text-white">Goal:</div>
                    <p className="text-xs text-gray-300 ml-1 mb-3">
                      {c.description}
                    </p>

                    {/* Your Solution Summary */}
                    <div className="text-sm font-semibold text-white">Your Solution Summary:</div>

                    {/* Text Summary Input */}
                    <textarea
                      placeholder={c.submitted ? "Solution submitted." : "Describe your solution..."}
                      value={formData[i]?.textSummary || ""}
                      onChange={(e) =>
                        updateFormData(i, { textSummary: e.target.value })
                      }
                      // 💡 Added disabled property
                      disabled={c.submitted}
                      className={`w-full h-20 bg-base-300 border rounded-md p-2 text-sm focus:outline-none focus:ring-1 
                        ${c.submitted 
                          ? "border-gray-600 text-gray-400 cursor-not-allowed" 
                          : "border-primary/70 text-white focus:ring-primary"}
                      `}
                    />

                    {/* Media Submission Area (Drag & Drop) */}
                    <div className="text-sm font-semibold text-white">Proof of Completion:</div>
                    <div
                      // 💡 Conditionally handle click for upload
                      onClick={() => !c.submitted && handleAddPhotoClick(i)}
                      onDragOver={handleDragOver}
                      // 💡 Conditionally handle drop
                      onDrop={(e) => !c.submitted && handleDrop(e, i)}
                      className={`border-2 border-dashed rounded-lg p-4 text-center relative group transition
                        ${c.submitted
                          ? "border-gray-600 cursor-not-allowed bg-gray-800/50"
                          : "border-primary/70 cursor-pointer hover:bg-base-300/50"}
                      `}
                    >
                        {formData[i]?.imagePreview ? (
                            <div className="relative w-full h-32">
                                <img
                                    src={formData[i].imagePreview}
                                    alt="preview"
                                    className="w-full h-full rounded-md object-cover border border-primary/50"
                                />
                                {/* 💡 Added check for c.submitted to the remove button */}
                                {!c.submitted && (
                                  <button
                                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                                      className="absolute top-1 right-1 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                      <X size={16} />
                                  </button>
                                )}
                                <p className="text-xs text-gray-300 mt-1 truncate">{formData[i].fileName}</p>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-6 h-6 mx-auto text-primary/80 mb-1" />
                                <p className="text-xs text-gray-400">
                                  {c.submitted 
                                    ? "Photo submitted with solution." 
                                    : "Drag & Drop Image or Click to Upload"
                                  }
                                </p>
                            </>
                        )}
                    </div>


                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={(el) => (fileInputRefs.current[i] = el)}
                      onChange={(e) => handleImageUpload(e, i)}
                      className="hidden"
                      // 💡 Added disabled property
                      disabled={c.submitted}
                    />


                    {/* Submit Button - Moved to the bottom right for better flow */}
                    <div className="flex justify-end pt-2">
                      <button
                        disabled={submitting || c.submitted}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmit(i);
                        }}
                        className={`mt-2 px-4 py-2 text-sm font-semibold rounded-md text-white transition ${
                          submitting || c.submitted
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-primary hover:scale-[1.02] shadow-lg shadow-primary/50"
                        }`}
                      >
                        {c.submitted ? "✅ Submitted" : submitting ? "Uploading..." : "Submit Solution 🚀"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardSpotlight>
    </div>
  );
};

export default ChallengeComponent;