import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { useChallengeBatchStore } from "../store/ChallengeBatch";
import { usePostStore } from "../store/PostStore";
import { UserAuth } from "../store/userAuthStore";
import { CardSpotlight } from "../components/ui/card-spotlight";
import toast from "react-hot-toast";
import { UploadCloud, X } from "lucide-react"; // Added UploadCloud and X

const WeeklyChallenges = () => {
  const { authUser } = UserAuth();
  const userId = authUser?._id;

  const {
    generateChallenges,
    fetchChallenges,
    weekchallenges,
    loading,
  } = useChallengeBatchStore();

  const { submitSolution, submitting } = usePostStore();

  const safeChallenges = Array.isArray(weekchallenges)
    ? weekchallenges
    : weekchallenges?.data?.weekchallenges || weekchallenges?.weekchallenges || [];

  const [openDescIndex, setOpenDescIndex] = useState(null);
  const [formData, setFormData] = useState({});

  // Ref for hidden file input (New: Required for non-drag-and-drop click)
  const fileInputRefs = useRef([]);

  // Helper to update form data (New: Consolidated logic)
  const updateFormData = (index, updates) => {
    setFormData((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        ...updates,
      },
    }));
  };

  // 🧩 Fetch weekly challenges on load
  useEffect(() => {
    if (!safeChallenges.length && userId) {
      fetchChallenges(userId, "weekly");
    }
  }, [userId, safeChallenges.length]);

  // ✅ Handle image upload (Preview & base64 conversion - Updated logic)
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

  // ✅ Handle drag over event (New)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ✅ Handle drop event (New)
  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent drop if submitted
    if (safeChallenges[index]?.submitted) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(null, index, files[0]);
    }
  };

  // Function to handle the click on the upload area (New)
  const handleAddPhotoClick = (index) => {
    // Prevent click if submitted
    if (safeChallenges[index]?.submitted) return;
    fileInputRefs.current[index]?.click();
  };

  // Function to remove the image (New)
  const handleRemoveImage = (index) => {
    updateFormData(index, { image: null, imagePreview: null, fileName: null });
    // Reset file input value to allow re-upload of the same file
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
  };

  // 🧩 Submit solution handler
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
      batchType: "weekly",
      challengeIndex: index,
      textSummary: entry.textSummary || "", // Ensure it's a string
      image: entry.image,
    });

    // Note: If the store updates the challenge status (c.submitted = true), 
    // the form will automatically be disabled/cleared on re-render.
  };

  return (
    <div
      data-theme="halloween"
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
          {/* 🔷 Header */}
          <div className="absolute -top-18 left-1/2 transform -translate-x-1/2 text-lg sm:text-3xl font-bold bg-primary px-4 py-2 rounded-t-lg text-white">
            Weekly Quests
          </div>

          {/* 🔷 Generate New Weekly Challenges */}
          <div className="text-center my-4">
            <span
              onClick={() => {
                if (safeChallenges.length === 0)
                  generateChallenges(userId, "weekly");
              }}
              className="text-sm border rounded-md p-1 hover:bg-muted hover:scale-105 transition text-white cursor-pointer"
              style={{ textShadow: "0 0 5px rgba(0, 191, 255, 0.8)" }}
            >
              New Quests
            </span>
          </div>

          {loading && (
            <p className="text-center text-muted-foreground">Loading...</p>
          )}

          {/* 🔷 Challenge List */}
          <ul className="space-y-4 mt-4">
            {safeChallenges.map((c, i) => (
              <li
                key={i}
                className="flex flex-col border-2 border-primary rounded-md px-4 py-3 transition"
                style={{
                  boxShadow: "inset 0 0 10px rgba(0, 191, 255, 0.3)",
                  backgroundColor: openDescIndex === i ? "rgba(20, 20, 50, 0.6)" : "rgba(20, 20, 50, 0.3)",
                  backdropFilter: "blur(5px)",
                }}
              >
                {/* Challenge Header */}
                <div
                  className="flex flex-col cursor-pointer"
                  onClick={() => setOpenDescIndex(openDescIndex === i ? null : i)}
                >
                    <div className="text-base sm:text-lg font-bold text-white mb-1">
                      {c.metricCategory || "Category"} / {c.subMetric || "Metric"}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      **Challenge:** {c.title || "Weekly Quest"}
                    </div>
                </div>

                {/* 🔷 Expanded Challenge Details */}
                {openDescIndex === i && (
                  <div className="mt-3 pt-3 border-t border-primary/50 space-y-4">

                    <div className="text-sm font-semibold text-white">Goal:</div>
                    <p className="text-xs text-gray-300 ml-1 mb-3">
                      {c.description}
                    </p>

                    <div className="text-sm font-semibold text-white">Your Solution Summary:</div>
                    {/* ✅ Text Summary Input - Added disabled logic and dynamic styling */}
                    <textarea
                      placeholder={c.submitted ? "Solution submitted." : "Write your solution summary..."}
                      value={formData[i]?.textSummary || ""}
                      onChange={(e) =>
                        updateFormData(i, { textSummary: e.target.value })
                      }
                      disabled={c.submitted}
                      className={`w-full h-20 bg-base-300 border rounded-md p-2 text-sm focus:outline-none focus:ring-1
                        ${c.submitted
                          ? "border-gray-600 text-gray-400 cursor-not-allowed"
                          : "border-primary/70 text-white focus:ring-primary"}
                      `}
                    />

                    <div className="text-sm font-semibold text-white">Proof of Completion:</div>
                    {/* ✅ Media Submission Area (Drag & Drop) - Added drag/drop, file name, remove button */}
                    <div
                      onClick={() => handleAddPhotoClick(i)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, i)}
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
                      disabled={c.submitted} // Disabled on submission
                    />

                    {/* ✅ Submit Button */}
                    <div className="flex justify-end pt-2">
                        <button
                          disabled={submitting || c.submitted}
                          onClick={() => handleSubmit(i)}
                          className={`mt-2 px-4 py-2 text-sm font-semibold rounded-md text-white transition ${
                            submitting || c.submitted
                              ? "bg-gray-600 cursor-not-allowed"
                              : "bg-primary hover:scale-[1.02] shadow-lg shadow-primary/50"
                          }`}
                        >
                          {c.submitted
                            ? "✅ Submitted"
                            : submitting
                            ? "Uploading..."
                            : "Submit Solution 🚀"}
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

export default WeeklyChallenges;