import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";
import { url } from "../URL";
import { persist } from "zustand/middleware";
import { Badge } from "lucide-react";

export const useChallengeStore = create(
      persist((set, get) => ({
  challenges: [],
  weekchallenges: [],
  monthchallenges:[],
  loading: false,
  rank: null,
  titles: "NaN",
  points: null,
  badges: null,

  generateChallenges: async (userId, type ) => {
    try {
      set({ loading: true });
      const res = await axios.post(`${url}/challenge/create-challenges`, {
        userId,
        type,
      });
      if (type==="daily") set({ challenges: res.data });
      if (type==="weekly") set({ weekchallenges: res.data });
      if (type==="monthly") set({ monthchallenges: res.data });
      // toast.success("Challenges generated");
    } catch (err) {
      toast.error("Challenge generation failed");
      console.error("❌ generateChallenges:", err.message);
    } finally {
      set({ loading: false });
    }
  },

  fetchChallenges: async (userId, challengeType = "daily") => {
    try {
      set({ loading: true });
      const res = await axios.get(
        `${url}/challenge/get-challenges/${userId}/${challengeType}`
      );
        if (challengeType==="daily") set({ challenges: res.data });
      if (challengeType==="weekly") set({ weekchallenges: res.data });
      if (challengeType==="monthly") set({ monthchallenges: res.data });
    } catch (err) {
      toast.error("Failed to fetch challenges");
      console.error("❌ fetchChallenges:", err.message);
    } finally {
      set({ loading: false });
    }
  },

  completeChallenge: async ({ userId, category, metric,cId, points = 5 }) => {
    try {
      const res = await axios.put(`${url}/challenge/update-score`, {
        userId,
        category,
        metric,
        points,
      });

      // if (res) delete_challenge(cId)
      // await fetchChallenges(userId)
      // toast.success("Challenge completed! Metric updated.");
      return true;
    } catch (err) {
      toast.error("Failed to complete challenge");
      console.error("❌ completeChallenge:", err.message);
    }
  },
  delete_challenge:async(challengeId)=>{
    try {
        await axios.delete(`${url}/challenge/delete/${challengeId}`);
        toast.success("Challenge Deleted!!")
    } catch (error) {
          toast.error("Failed to delete challenge");
      console.error("❌ delete failed:", err.message);
    }

  },

  calculateRank: async (userId) => {
    try {
      const res = await axios.get(`${url}/challenge/get-rank/${userId}`);
      set({ rank: res.data?.rank });
      set({ titles: res.data?.titles });
      set({badges : res.data?.badges });
      // toast.success(`Rank: ${res.data.rank}`);
    } catch (err) {
      toast.error("Rank calculation failed");
      console.error("❌ calculateRank:", err.message);
    }
  },
}),
    {
      name: "challenge-storage",
      getStorage: () => localStorage,
    }));
