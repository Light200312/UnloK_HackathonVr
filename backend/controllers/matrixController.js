import Matrix from "../models/Matrix.js";
import User from "../models/User.js";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// 🧠 Generate matrices dynamically from AI prompt
export const createMatricesFromAI = async (userId, specificField) => {
  const prompt = `
You are a smart assistant designed to help users track personal progress in various fields of self-development.

Your task: Given a specific field (e.g., bodybuilding, music training, studying), generate a structured list of measurable or observable metrics for progress tracking.

✅ Output Format: Strictly return a clean JSON object with the **main categories** as keys, and each value is a list of **trackable sub-metrics**.

🎯 Example Field: ${specificField}

Respond:
`;

  const response = await openai.chat.completions.create({
    model: "mistralai/mistral-7b-instruct",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;

  let matrixJson;
  try {
    matrixJson = JSON.parse(content);
  } catch (error) {
    console.error("❌ Failed to parse AI JSON:", content);
    throw new Error("AI returned invalid JSON format");
  }

  const matrices = await Promise.all(
    Object.entries(matrixJson).map(([category, metrics]) =>
      Matrix.create({
        category,
        type: "custom",
        metrics: metrics.map((name) => ({ name: name.trim() })),
        userId,
      })
    )
  );

  await User.findByIdAndUpdate(userId, {
    $push: { matrices: { $each: matrices.map((m) => m._id) } },
  });

  return matrices;
};

// ✅ Create matrices from user-provided data
export const createMatrices = async (req, res) => {
  const { userId, matrices } = req.body;

  try {
    const createdMatrices = await Promise.all(
      Object.entries(matrices).map(async ([category, metrics]) => {
        return await Matrix.create({
          category,
          metrics: metrics.map((m) => ({ name: m.trim() })),
          userId,
        });
      })
    );

    await User.findByIdAndUpdate(userId, {
      $push: { matrices: createdMatrices.map((m) => m._id) },
    });

    res.json(createdMatrices);
  } catch (err) {
    res.status(500).json({ error: "Failed to create matrices" });
  }
};

// ✅ Create default general stats
export const creategeneralstats = async (req) => {
  const { userId, matrices } = req.body;

  try {
    const createdMatrices = await Promise.all(
      Object.entries(matrices).map(async ([category, metrics]) => {
        return await Matrix.create({
          category,
          metrics: metrics.map((m) => ({ name: m.trim() })),
          userId,
        });
      })
    );

    await User.findByIdAndUpdate(userId, {
      $push: { matrices: createdMatrices.map((m) => m._id) },
    });

    return createdMatrices;
  } catch (err) {
    console.error("❌ Failed to create general stats:", err.message);
    return;
  }
};

// ✅ Get all matrices of a user
export const getUserMatrices = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate("matrices");
    res.json(user.matrices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch matrices" });
  }
};

// ✅ Get custom or general matrices based on type
export const getCustomMatrices = async (req, res) => {
  const { userId, customType } = req.params;
  try {
    const user = await User.findById(userId).populate({
      path: "matrices",
      match: { type: customType },
    });
    res.json(user.matrices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch custom matrices" });
  }
};

// ✅ Get only general matrices
export const getGeneralMatrix = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate({
      path: "matrices",
      match: { type: "general" },
    });

    res.json(user?.matrices || []);
  } catch (err) {
    console.error("❌ Error fetching general matrices:", err.message);
    res.status(500).json({ error: "Failed to fetch general matrices" });
  }
};

// ✅ Update matrix metric value
export const updateMatrixValue = async (req, res) => {
  const { matrixId, metricName, newValue } = req.body;

  try {
    const matrix = await Matrix.findById(matrixId);
    if (!matrix) return res.status(404).json({ error: "Matrix not found" });

    const metric = matrix.metrics.find((m) => m.name === metricName);
    if (metric) {
      metric.value = newValue;
      await matrix.save();
      res.json(matrix);
    } else {
      res.status(404).json({ error: "Metric not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update matrix" });
  }
};

// ✅ Add new metric to existing matrix
export const addCustomMetric = async (req, res) => {
  const { matrixId, metricName } = req.body;

  try {
    const cleanName = metricName.trim();
    if (!cleanName) return res.status(400).json({ error: "Metric name is empty" });

    const matrix = await Matrix.findById(matrixId);
    matrix.metrics.push({ name: cleanName, value: 0, custom: true });
    await matrix.save();
    res.json(matrix);
  } catch (err) {
    res.status(500).json({ error: "Failed to add custom metric" });
  }
};

// ✅ Add custom matrix under general type
export const AddCustomMatrixToGeneral = async (req, res) => {
  const { username, category, matrices } = req.body;

  if (!username || !category || !Array.isArray(matrices) || matrices.length === 0) {
    return res.status(400).json({ error: "Missing or invalid input fields" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newMatrix = await Matrix.create({
      type: "general",
      category: category.trim(),
      metrics: matrices.map((m) => ({ name: m.trim() })),
      userId: user._id,
    });

    user.matrices.push(newMatrix._id);
    await user.save();

    res.status(201).json({ message: "Custom matrix added", matrix: newMatrix });
  } catch (error) {
    console.error("❌ Error adding custom matrix:", error.message);
    res.status(500).json({ error: "Failed to add custom matrix" });
  }
};

// ✅ Delete matrix by ID
export const deleteMatrix = async (req, res) => {
  const { matrixId } = req.body;

  try {
    const result = await Matrix.deleteOne({ _id: matrixId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Matrix not found or already deleted" });
    }

    res.status(200).json({ message: "Matrix deleted successfully" });
  } catch (error) {
    console.error("❌ Matrix delete failed:", error.message);
    res.status(500).json({ error: "Matrix delete failed" });
  }
};
