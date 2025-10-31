import express from "express";
import {
  generateAichallenge,
  fetchChallenges,
  markChallengeComplete,
  deleteChallengeBatch,
  CalculateRankOfUser,
} from "../controllers/ChallengeBatchControler.js";

const router = express.Router();

/**
 * @route   POST /api/challenges/create
 * @desc    Generate (or refresh) AI challenges for a user and type (daily, weekly, monthly)
 * @body    { userId, type }
 */
router.post("/create", generateAichallenge);

/**
 * @route   GET /api/challenges/:userId/:challengeType
 * @desc    Fetch active challenge batch for a specific user and type
 */
router.get("/:userId/:challengeType", fetchChallenges);

/**
 * @route   POST /api/challenges/complete
 * @desc    Mark a specific sub-challenge as completed in the user's batch
 * @body    { userId, batchType, challengeIndex }
 */
router.post("/complete", markChallengeComplete);

/**
 * @route   DELETE /api/challenges/:userId/:challengeType
 * @desc    Delete an expired or unwanted challenge batch
 */
router.delete("/:userId/:challengeType", deleteChallengeBatch);

/**
 * @route   GET /api/challenges/get-rank/:userId
 * @desc    Calculate and update user’s rank & title based on points
 */
router.get("/get-rank/:userId", CalculateRankOfUser);

export default router;
