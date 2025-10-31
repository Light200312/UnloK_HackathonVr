import axios from "axios";
import ChallengeBatch from "../models/ChallengeBatch.js"; // ✅ New model
import Matrix from "../models/Matrix.js";
import User from "../models/User.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const rankTiers = [
  { points: 0, code: "F7", title: "Sleeper" },
  { points: 50, code: "E6", title: "Awakened" },
  { points: 100, code: "D5", title: "Master" },
  { points: 200, code: "C4", title: "Saint" },
  { points: 350, code: "B3", title: "Sovereign" },
  { points: 500, code: "A2", title: "Spirit" },
  { points: 700, code: "S1", title: "Devine" },
];

// Utility
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

export const generateAichallenge = async (req, res) => {
  const { userId, type } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const matrices = await Matrix.find({ userId, type: "general" });
    if (!matrices || matrices.length === 0)
      return res.status(404).json({ error: "No matrices found for user" });

    // 🎯 Pick ONE submetric per matrix
    const selectedChallenges = matrices
      .map((matrix) => {
        if (!matrix.metrics?.length) return null;
        const randomMetric =
          matrix.metrics[Math.floor(Math.random() * matrix.metrics.length)];
        return {
          metricCategory: matrix.category,
          subMetric: randomMetric.name,
        };
      })
      .filter(Boolean);

    // 🧠 AI prompt
    const aiPrompt = `
You are an AI assistant that creates personal growth challenges.
For each area below, create ONE actionable, specific, and realistic challenge.

Each must include:
- title (string)
- description (string)
- searchTitle (string)
- resource: { type (video, podcast, article, book, task, reflection), name (string) }

Rules:
- Output VALID JSON array only (no explanations)
- One challenge per area below
- Avoid repetition or vague ideas.

Areas:
${selectedChallenges
  .map((c, i) => `${i + 1}. ${c.metricCategory} - ${c.subMetric}`)
  .join("\n")}
`;

    console.log("🧠 Sending prompt for", selectedChallenges.length, "challenges");

    const aiRes = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.8,
    });

    let aiContent = aiRes?.choices?.[0]?.message?.content?.trim();
    if (!aiContent) throw new Error("Empty AI response");

    // 🧹 Extract JSON safely
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    let jsonString = jsonMatch[0]
      .replace(/\/\/.*$/gm, "")
      .replace(/,\s*([\]}])/g, "$1");

    let aiOutput;
    try {
      aiOutput = JSON.parse(jsonString);
      if (!Array.isArray(aiOutput)) throw new Error("Parsed content is not an array");
    } catch (err) {
      console.error("❌ Failed to parse AI JSON:", jsonString);
      throw new Error("Malformed AI JSON");
    }

    // 🧭 Build URLs
    const normalizeType = (t) => {
      const map = {
        youtube: "video",
        video: "video",
        yt: "video",
        podcast: "podcast",
        article: "article",
        blog: "article",
        book: "book",
        task: "task",
        reflection: "reflection",
      };
      return map[t?.toLowerCase()?.trim()] || "task";
    };

    const buildUrl = (type, query) => {
      const q = encodeURIComponent(query);
      switch (type) {
        case "video":
          return `https://www.youtube.com/results?search_query=${q}+guide`;
        case "book":
          return `https://www.google.com/search?q=${q}+book+site%3Alibgen.is+OR+site%3Azlibrary.to`;
        case "podcast":
          return `https://www.google.com/search?q=${q}+podcast`;
        case "article":
          return `https://www.google.com/search?q=${q}+how+to`;
        default:
          return `https://www.google.com/search?q=how+to+${q}`;
      }
    };

    // ✅ Format challenges with category & submetric
    const formattedChallenges = aiOutput.map((c, i) => {
      const normalizedType = normalizeType(c.resource?.type);
      const searchQuery = c.searchTitle || c.title;
      return {
        ...c,
        metricCategory: selectedChallenges[i]?.metricCategory || "General",
        subMetric: selectedChallenges[i]?.subMetric || "N/A",
        completed: false,
        completedAt: null,
        resource: {
          type: normalizedType,
          name: c.resource?.name || `Search: ${c.title}`,
          url: buildUrl(normalizedType, searchQuery),
        },
      };
    });

    // 🕒 Expiration & Value
    const expirationHours =
      type === "monthly" ? 720 : type === "weekly" ? 168 : 24;
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    const value = type === "monthly" ? 20 : type === "weekly" ? 15 : 5;

    // ✅ Save with correct field name: `challenges`
    const challengeBatch = {
      userId,
      type,
      value,
      totalValue: Math.max(1, formattedChallenges.length * value),
      expiresAt,
      challenges: formattedChallenges,
    };

    const savedBatch = await ChallengeBatch.create(challengeBatch);

    res.status(201).json({
      message: `✅ ${formattedChallenges.length} ${type} challenges generated`,
      data: savedBatch,
    });
  } catch (error) {
    console.error("❌ Error generating AI challenge:", error.message);
    res.status(500).json({
      error: "Failed to generate AI challenge",
      details: error.message,
    });
  }
};

// 🔹 Fetch challenges
export const fetchChallenges = async (req, res) => {
  const { userId, challengeType } = req.params;
  try {
    const now = new Date();
    await ChallengeBatch.deleteMany({ userId, type: challengeType, expiresAt: { $lte: now } });

    const batch = await ChallengeBatch.findOne({ userId, type: challengeType });
    if (!batch) return res.status(404).json({ error: "No challenges found" });

    res.status(200).json(batch);
  } catch (err) {
    console.error("❌ Error fetching challenges:", err.message);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
};

// 🔹 Mark challenge complete
// 🔹 Mark challenge complete + update matrix subMetric
export const markChallengeComplete = async (req, res) => {
  const { userId, category, challengeIndex } = req.body;

  try {
    // ✅ Step 1: Find challenge batch
    const batch = await ChallengeBatch.findOne({ userId, type: category });
    if (!batch) return res.status(404).json({ error: "Challenge batch not found" });

    // ✅ Step 2: Find the challenge inside batch
    const challenge = batch.challenges[challengeIndex];
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    if (challenge.completed)
      return res.status(409).json({ error: "Challenge already completed" });

    // ✅ Step 3: Get category and subMetric
    const { metricCategory, subMetric } = challenge;

    // ✅ Step 4: Find user's matching Matrix
    const matrix = await Matrix.findOne({ userId, category: metricCategory, type: "general" });
    if (!matrix) return res.status(404).json({ error: "Related Matrix not found" });

    // ✅ Step 5: Find target sub-metric in the matrix
    const targetMetric = matrix.metrics.find(m => m.name === subMetric);
    if (!targetMetric)
      return res.status(404).json({ error: `SubMetric "${subMetric}" not found in ${metricCategory}` });

    // ✅ Step 6: Update submetric value (add challenge value)
    const incrementMap = { daily: 5, weekly: 10, monthly: 20 };
const increment = incrementMap[category] || 0;

targetMetric.value = Math.min(100, targetMetric.value + increment);

    // ✅ Step 7: Mark challenge as complete
    challenge.completed = true;
    challenge.completedAt = new Date();

    // ✅ Step 8: Save both documents
    await Promise.all([batch.save(), matrix.save()]);

    // ✅ Step 9: Return updated data
    res.status(200).json({
      message: "Challenge completed successfully",
      updatedMetric: {
        category: metricCategory,
        subMetric: subMetric,
        newValue: targetMetric.value
      },
      batchProgress: `${batch.challenges.filter(c => c.completed).length}/${batch.challenges.length}`,
    });

  } catch (err) {
    console.error("❌ Error marking challenge complete:", err.message);
    res.status(500).json({ error: "Failed to complete challenge", details: err.message });
  }
};


// 🔹 Delete batch
export const deleteChallengeBatch = async (req, res) => {
  const { userId, challengeType } = req.params;
  try {
    const batch = await ChallengeBatch.findOne({ userId, type: challengeType });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    await Post.deleteMany({ userId, batchId: batch._id });
    await batch.deleteOne();

    res.status(200).json({ message: "🗑️ Batch and posts deleted" });
  } catch (err) {
    console.error("❌ Error deleting batch:", err.message);
    res.status(500).json({ error: "Failed to delete batch" });
  }
};
 
// 🔹 Rank calculation
const getRankInfo = (points) =>
  [...rankTiers].reverse().find((tier) => points >= tier.points) || rankTiers.at(-1);

export const CalculateRankOfUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const matrices = await Matrix.find({ userId, type: "general" });
    const totalPoints = matrices.reduce(
      (sum, matrix) =>
        sum + matrix.metrics.reduce((s, metric) => s + (metric.value || 0), 0),
      0
    );

    const { code, title } = getRankInfo(totalPoints);
    await User.findByIdAndUpdate(userId, {
      points: totalPoints,
      rank: code,
      $addToSet: { titles: title },
    });

    res.json({ success: true, userId, points: totalPoints, rank: code, titles: title });
  } catch (err) {
    console.error("❌ Error calculating rank:", err.message);
    res.status(500).json({ error: "Rank calculation failed" });
  }
};
