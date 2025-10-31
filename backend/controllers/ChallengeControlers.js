import axios from "axios"; // ✅ Required for checking URLs
import Challenge from "../models/challenge.js"
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



// 👇 Add this helper function to check if a URL is valid and reachable
const isValidUrl = async (url) => {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status >= 200 && response.status < 400;
  } catch (err) {
    return false;
  }
};

// import Challenge from '../models/challengeModel.js';

export const generateAichallenge = async (req, res) => {
  const { userId, type } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const matrices = await Matrix.find({ userId, type: "general" });

    function shuffle(array) {
      return array.sort(() => Math.random() - 0.5);
    }

    const selectedChallenges = matrices.map((matrix) => {
      const subMetrics = shuffle(matrix.metrics);
      const metric = subMetrics[0];
      return {
        metricCategory: matrix.category,
        subMetric: metric.name,
      };
    });

    // Prompt — AI won't give URLs
    const aiPrompt = `You are a creative assistant AI helping users build better habits. 
Your goal is to create fresh, varied, and engaging "${type}" challenges for personal growth.

Task: For each of the following self-improvement areas and sub-metrics, generate a unique, actionable, and easy-to-complete challenge.

Rules:
- Avoid repetition or overly generic suggestions.
- Each challenge must feel distinct.
- Mix up challenge tone and activity type.
- create searchTitle(a string),which on searched provides sites(depending on resource type) that help in completing the challenges.
- DO NOT include comments, extra text, or markdown.
- Output only a valid JSON array.

Here are the self-improvement metrics:
${selectedChallenges.map((c, i) => `${i + 1}. ${c.metricCategory} - ${c.subMetric}`).join('\n')}

Return ONLY a valid JSON array of objects with:
- title (string)
- searchTitle (string)
- description (string)
- resource: { type (video, podcast, article, book, task, reflection), name (string) }
`;

    const aiRes = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.8,
    });

    const aiContent = aiRes.choices[0].message.content.trim();

    // Extract JSON
    const jsonMatch = aiContent.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "JSON not found in AI response" });
    }

    // Clean JSON
    let jsonString = jsonMatch[0]
      .replace(/\/\/.*$/gm, "") // remove comments
      .replace(/,\s*([\]}])/g, "$1"); // remove trailing commas

    let aiOutput;
    try {
      aiOutput = JSON.parse(jsonString);
    } catch (err) {
      console.error("❌ Failed to parse cleaned JSON:", jsonString);
      return res.status(500).json({ error: "Malformed AI JSON after cleanup" });
    }

    // Generate search URLs based on type & title
    aiOutput = aiOutput.map(c => {
      const typeMap = {
        youtube: 'video',
        video: 'video',
        yt: 'video',
        podcast: 'podcast',
        article: 'article',
        blog: 'article',
        book: 'book',
        task: 'task',
        reflection: 'reflection'
      };

      let normalizedType = typeMap[(c.resource?.type || '').toLowerCase().trim()] || 'task';
      const searchTitle = encodeURIComponent(c.searchTitle.trim()) 

      let url = '';
      switch (normalizedType) {
        case 'video':
          url = `https://www.youtube.com/results?search_query=${searchTitle}+guide`;
          break;
        case 'book':
          url = `https://www.google.com/search?q=${searchTitle}+book+site%3Alibgen.is+OR+site%3Azlibrary.to`;
          break;
        case 'podcast':
          url = `https://www.google.com/search?q=${searchTitle}+podcast`;
          break;
        case 'article':
          url = `https://www.google.com/search?q=${searchTitle}+how+to`;
          break;
        default:
          url = `https://www.google.com/search?q=how+to+${searchTitle}`;
      }

      c.resource = {
        type: normalizedType,
        name: c.resource?.name || `Search: ${c.title}`,
        url
      };

      return c;
    });

    // Save to DB
    const savedChallenges = await Promise.all(aiOutput.map(async (c, index) => {
      const ref = selectedChallenges[index];

      const alreadyExists = await Challenge.findOne({
        userId,
        title: new RegExp(`^${c.title}$`, "i"),
      });
      if (alreadyExists) return null;

      const expirationHours = type === "monthly" ? 720 : type === "weekly" ? 168 : 24;
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
      const challengeValue = type === "monthly" ? 20 : type === "weekly" ? 15 : 5;

      return Challenge.create({
        userId,
        title: c.title,
        description: c.description,
        type,
        metricCategory: ref.metricCategory,
        subMetric: ref.subMetric,
        resource: c.resource,
        expiresAt,
        value: challengeValue,
      });
    }));

    res.status(201).json(savedChallenges.filter(c => c !== null));
  } catch (error) {
    console.error("❌ Error generating AI challenge:", error.message);
    res.status(500).json({ error: "Failed to generate AI challenge" });
  }
};




export const fetchChallenges = async (req, res) => {
  const { userId, challengeType } = req.params;

  try {
    const now = new Date();

    // Delete expired ones first
    await Challenge.deleteMany({
      userId,
      type: challengeType,
      expiresAt: { $lte: now }
    });

    // Fetch only the remaining (live) challenges
    const challenges = await Challenge.find({
      userId,
      type: challengeType,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });

    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
};




const getRankInfo = (points) => {
  return [...rankTiers].reverse().find((tier) => points >= tier.points) || rankTiers.at(-1);
};

export const CalculateRankOfUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Get user's matrix and calculate total points
    const matrices = await Matrix.find({ userId, type: "general" });

    const totalPoints = matrices.reduce(
      (sum, matrix) =>
        sum + matrix.metrics.reduce((s, metric) => s + (metric.value || 0), 0),
      0
    );

    // Get corresponding rank info
    const { code, title } = getRankInfo(totalPoints);

    // Update user
    await User.findByIdAndUpdate(userId, {
      points: totalPoints,
      rank: code,
      $addToSet: { titles: title },
    });

    res.json({
      success: true,
      userId: userId,
     points: totalPoints,
      rank: code,
    titles:  title,
    });
  } catch (error) {
    console.error("❌ Error calculating rank:", error.message);
    res.status(500).json({ error: "Rank calculation failed" });
  }
};





export const updateScoreOnChallengeComplete = async (req, res) => {
  const { userId, category, metric, points = 5 } = req.body;

  if (!userId || !category || !metric) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // midnight today

    // 🔍 Check if a challenge was already completed today for this metric
    const existing = await Challenge.findOne({
      userId,
      metricCategory: category,
      subMetric: metric,
      completed: true,
      completedAt: { $gte: today },
    });

    if (existing) {
      return res.status(409).json({ error: "Challenge already completed today" });
    }

    // 🎯 Proceed with updating matrix score
    const matrix = await Matrix.findOne({ userId, category });
    if (!matrix) return res.status(404).json({ error: "Matrix not found" });

    const targetMetric = matrix.metrics.find((m) => m.name === metric);
    if (!targetMetric) return res.status(404).json({ error: "Metric not found" });

    targetMetric.value = Math.min(100, targetMetric.value + points);
    await matrix.save();

    // ✅ Mark a new challenge as complete (or update latest one)
    await Challenge.findOneAndUpdate(
      {
        userId,
        metricCategory: category,
        subMetric: metric,
        completed: false,
      },
      {
        completed: true,
        completedAt: new Date(),
      }
    );

    res.status(200).json({
      message: "Challenge completed and metric updated",
      updatedMetric: targetMetric,
    });
  } catch (err) {
    console.error("❌ Error updating metric score:", err.message);
    res.status(500).json({ error: "Failed to update score" });
  }
};


// DELETE /api/challenges/:challengeId
export const deleteChallenge = async (req, res) => {
  const { challengeId } = req.params;

  try {
    const deleted = await Challenge.findByIdAndDelete(challengeId);

    if (!deleted) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    res.status(200).json({ message: "Challenge deleted successfully", deleted });
  } catch (error) {
    console.error("❌ Error deleting challenge:", error.message);
    res.status(500).json({ error: "Failed to delete challenge" });
  }
};
