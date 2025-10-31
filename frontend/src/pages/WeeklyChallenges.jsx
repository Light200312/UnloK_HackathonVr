import React, { useState, useEffect } from "react";
import { useChallengeBatchStore } from "../store/ChallengeBatch";
import { usePostStore } from "../store/PostStore";
import { UserAuth } from "../store/userAuthStore";
import { CardSpotlight } from "../components/ui/card-spotlight";
import toast from "react-hot-toast";

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

  // 🧩 Fetch weekly challenges on load
  useEffect(() => {
    if (!safeChallenges.length && userId) {
      fetchChallenges(userId, "weekly");
    }
  }, [userId, safeChallenges.length]);

  // 🧩 Handle image upload
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          image: reader.result,
          imagePreview: URL.createObjectURL(file),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // 🧩 Submit solution handler
  const handleSubmit = async (index) => {
    const c = safeChallenges[index];
    const entry = formData[index];

    if (!entry?.textSummary && !entry?.image) {
      toast.error("⚠️ Please add your Solution");
      return;
    }

    await submitSolution({
      userId,
      batchType: "weekly",
      challengeIndex: index,
      textSummary: entry.textSummary,
      image: entry.image,
    });

    // Reset after successful submission
    setFormData((prev) => ({
      ...prev,
      [index]: { textSummary: "", image: null, imagePreview: null },
    }));
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
                className="flex flex-col border-2 border-primary rounded-md px-4 py-3 bg-muted transition hover:bg-muted/80"
                style={{
                  boxShadow: "inset 0 0 10px rgba(0, 191, 255, 0.3)",
                }}
              >
                <div className="sm:flex items-start justify-between">
                  <div
                    className="sm:text-lg font-medium text-white"
                    style={{ textShadow: "0 0 3px rgba(0, 191, 255, 0.8)" }}
                  >
                    {c.title}
                  </div>

                  <button
                    onClick={() =>
                      setOpenDescIndex(openDescIndex === i ? null : i)
                    }
                    className="text-sm text-blue-300 hover:underline"
                  >
                    {openDescIndex === i ? "Hide" : "Details"}
                  </button>
                </div>

                {/* 🔷 Expanded Challenge Details */}
                {openDescIndex === i && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-300 ml-1">
                      {c.description}
                    </p>

                    {/* ✅ Text Summary Input */}
                    <textarea
                      placeholder="Write your solution summary..."
                      value={formData[i]?.textSummary || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [i]: {
                            ...prev[i],
                            textSummary: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-base-300 border border-primary text-white rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    {/* ✅ Image Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, i)}
                        className="text-sm text-gray-300"
                      />
                      {formData[i]?.imagePreview && (
                        <img
                          src={formData[i].imagePreview}
                          alt="preview"
                          className="w-20 h-20 rounded-md object-cover border border-primary"
                        />
                      )}
                    </div>

                    {/* ✅ Submit Button */}
                    <button
                      disabled={submitting || c.submitted}
                      onClick={() => handleSubmit(i)}
                      className={`mt-2 px-3 py-1 text-sm font-semibold rounded-md text-white transition ${
                        submitting
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-primary hover:scale-105"
                      }`}
                    >
                      {c.submitted
                        ? "✅ Submitted"
                        : submitting
                        ? "Uploading..."
                        : "Submit Solution 🚀"}
                    </button>
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
