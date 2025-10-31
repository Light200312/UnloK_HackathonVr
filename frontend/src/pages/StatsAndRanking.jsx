"use client";

import React, { useState, useEffect } from "react";
import { matrixAuthStore } from "../store/matrixStore";
import { useChallengeStore } from "../store/ChallengeStore";
import { UserAuth } from "../store/userAuthStore";
import { CardSpotlight } from "../components/ui/card-spotlight";
import "../index.css";

const rankTiers = [
  { points: 700, code: "S1", title: "Devine" },
  { points: 500, code: "A2", title: "Spirit" },
  { points: 350, code: "B3", title: "Sovereign" },
  { points: 200, code: "C4", title: "Saint" },
  { points: 100, code: "D5", title: "Master" },
  { points: 50,  code: "E6", title: "Awakened" },
  { points: 0,   code: "F7", title: "Sleeper" },
];

const CategoryDescription = {
  "Cognitive Growth": "Cognitive Growth refers to the development of mental capabilities like focus, problem solving, critical thinking, learning speed, and memory.",
  "Physical Wellness": "Physical Wellness involves maintaining a healthy body through strength, stamina, sleep, and overall health score.",
  "Emotional Intelligence": "Emotional Intelligence is the ability to understand, use, and manage emotions effectively.",
  "Social Character": "Social Character includes communication, leadership, conflict resolution, and integrity.",
  "Discipline & Productivity": "This reflects your ability to stay organized, complete tasks, and manage time.",
  "Growth Mindset": "A Growth Mindset believes in developing abilities through effort and learning.",
  "Purpose & Values": "Purpose & Values involve aligning your actions with meaningful goals and contribution.",
};

const StatsAndRanking = () => {
  const { calculateRank } = useChallengeStore();
  const { authUser } = UserAuth();
  const {
    matrices,
    fetchMatrices,
  } = matrixAuthStore();

  const [openMatrixIds, setOpenMatrixIds] = useState([]);

  useEffect(() => {
    if (authUser?._id) {
      calculateRank(authUser._id);
      fetchMatrices(authUser._id);
    }
  }, [authUser]);

  const toggleMatrix = (id) => {
    setOpenMatrixIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const points = parseInt(authUser?.points || 0);
  const matchedTier =
    rankTiers.find((tier) => points >= tier.points) || rankTiers.at(-1);
  const computedRank = matchedTier?.code || "N/A";
  const computedTitle = matchedTier?.title || "N/A";

  return (
    <div
      className="bg-background text-foreground min-h-screen p-2 pt-24 flex items-center justify-center font-bitcount"
      style={{
        backgroundImage: `url(./panelbg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      <div className="absolute inset-0 bg-black/20 dark:bg-black/50 z-0" />

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
        {/* Header */}
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-md sm:text-2xl font-bold bg-primary text-base px-4 py-2 rounded-t-lg font-bitcount"
          style={{
            // textShadow: "0 0 10px rgba(0, 191, 255, 1), 0 0 20px rgba(0, 191, 255, 0.6)",
            zIndex: 20,
          }}
        >
          [{authUser?.username?.toUpperCase() || "PROFILE"}]
        </div>

        {/* Profile Info */}
        <div className="sm:text-lg mt-8 flex flex-col items-center font-bitcount">
          <div className="mb-2"><strong>NAME:</strong> {authUser?.username?.toUpperCase() || "Unknown"}</div>
          <div className="mb-2"><strong>AGE:</strong> {authUser?.age || "Not Available"}</div>
          <div className="mb-2"><strong>POINTS:</strong> {isNaN(points) ? "N/A" : points}</div>
          <div className="mb-2"><strong>RANKING:</strong> {computedRank}</div>
          <div className="mb-2"><strong>TITLE:</strong> {computedTitle}</div>
          <div className="mb-2"><strong>BADGES:</strong> {computedTitle}</div>
        </div>

        {/* Matrix Cards */}
        <div className="mt-6">
          {(matrices?.length > 0 ? matrices : []).map((matrix) => (
            <div
              key={matrix?._id || Math.random()}
              className="mb-6 p-2 bg-muted/60 hover:bg-muted/80 border border-primary rounded-md"
              style={{ boxShadow: "inset 0 0 10px rgba(0, 191, 255, 0.3)" }}
            >
              <div className="flex justify-between items-center">
                <button
                  onClick={() => toggleMatrix(matrix._id)}
                  className="flex items-center sm:text-xl font-bold font-bitcount text-foreground"
                  // style={{ textShadow: "0 0 5px rgba(0, 191, 255, 0.8)" }}
                >
                  {matrix?.category || "Unnamed Category"}
                  <span className="ml-2 text-sm">
                    {openMatrixIds.includes(matrix._id) ? "▲" : "▼"}
                  </span>
                </button>
              </div>

              {openMatrixIds.includes(matrix._id) && (
                <>
                  <div className="text-sm text-muted-foreground mt-1 transition-all duration-300 ease-in-out font-bitcount">
                    {CategoryDescription[matrix.category] || "No description available."}
                  </div>
                  {(matrix?.metrics || []).map((metric, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 mb-1 mt-2 text-foreground font-bitcount"
                    >
                      <span>{metric?.name || "Unnamed"}: {metric?.value ?? "N/A"}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-muted-foreground text-sm italic font-bitcount">
          <strong>OVERALL EVALUATION:</strong> A user with unique skills awakened due to recent challenges. It's best to observe carefully.
        </div>
      </CardSpotlight>
    </div>
  );
};

export default StatsAndRanking;
