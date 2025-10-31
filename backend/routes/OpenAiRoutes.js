import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import Matrix from "../models/Matrix.js";
import User from "../models/User.js";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// 🚀 Generate & Save User-Specific Matrices
router.post("/api/matrices", async (req, res) => {
  const { specificField, userId } = req.body;

  if (!userId || !specificField) {
    return res.status(400).json({ error: "Missing userId or field" });
  }

  const prompt = `
You are a smart assistant designed to help users track personal progress in various fields of self-development.

Your task: Given a specific field (e.g., bodybuilding, music training, studying), generate a structured list of measurable or observable metrics for progress tracking.

✅ Output Format: Strictly return a clean JSON object with the **main categories** as keys, and each value is a list of **trackable sub-metrics** (just like progress tracking fields). Do not include any explanations, markdown, or additional notes—just pure JSON.

🎯 Example Field: ${specificField}

Respond:
`;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = chatResponse.choices[0].message.content;
    const matrixJson = JSON.parse(content);

    const matrixDocs = await Promise.all(
      Object.entries(matrixJson).map(([category, metrics]) =>
        Matrix.create({
          category,
          metrics: metrics.map(name => ({ name })),
          userId,
        })
      )
    );

    // Link to user
    await User.findByIdAndUpdate(userId, {
      $push: { matrices: { $each: matrixDocs.map(m => m._id) } },
    });

    res.json({ success: true, matrices: matrixDocs });
  } catch (err) {
    console.error("❌ AI Error:", err.message);
    res.status(500).json({ error: "Failed to generate matrices" });
  }
});

// 📚 Recommend a Book or Audio Based on User Goal
router.post("/api/recommend", async (req, res) => {
  const { goal, interest, medium } = req.body;

  if (!goal || !interest || !medium) {
    return res.status(400).json({ error: "Missing recommendation parameters" });
  }

  const prompt = `
You're a helpful AI that recommends inspiring and effective ${medium.toLowerCase()}s to help people improve their ${goal}. 
Suggest one title related to "${interest}" that is engaging and beginner-friendly. 
Return the title, author, and a short reason why it's a good fit.

Respond in this JSON format:
{
  "title": "Book Title",
  "author": "Author Name",
  "reason": "Why it’s a good match"
}
`;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = chatResponse.choices[0].message.content;
    const book = JSON.parse(content);
    res.json(book);
  } catch (err) {
    console.error("❌ AI Error:", err.message);
    res.status(500).json({ error: "Failed to get recommendation" });
  }
});

export default router;
