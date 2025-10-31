import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";
import { url } from "../URL";
import { persist } from "zustand/middleware";

export const useChallengeBatchStore = create(
  persist(
    (set, get) => ({
      // --- State ---
      challenges: [],
      weekchallenges: [],
      monthchallenges: [],
      loading: false,
      rank: null,
      titles: "NaN",
      points: null,
      badges: null,

      // --- Actions ---
      generateChallenges: async (userId, type) => {
        try {
          set({ loading: true });
          const res = await axios.post(`${url}/challengeBatch/create`, {
            userId,
            type,
          });

          const challengeArray = res.data?.data?.challenges || [];
          if (type === "daily") set({ challenges: challengeArray });
          if (type === "weekly")
            set({ weekchallenges: res.data?.data?.weekchallenges || [] });
          if (type === "monthly")
            set({ monthchallenges: res.data?.data?.monthchallenges || [] });

          toast.success("Challenges generated");
        } catch (err) {
          toast.error("Challenge generation failed");
          console.error("❌ generateChallenges:", err.message);
          if (type === "daily") set({ challenges: [] });
          if (type === "weekly") set({ weekchallenges: [] });
          if (type === "monthly") set({ monthchallenges: [] });
        } finally {
          set({ loading: false });
        }
      },

      fetchChallenges: async (userId, challengeType = "daily") => {
        try {
          set({ loading: true });
          const res = await axios.get(
            `${url}/challengeBatch/${userId}/${challengeType}`
          );

          if (challengeType === "daily")
            set({ challenges: res.data?.challenges });
          if (challengeType === "weekly")
            set({ weekchallenges: res.data?.challenges });
          if (challengeType === "monthly")
            set({ monthchallenges: res.data?.challenges });
        } catch (err) {
          toast.error("Failed to fetch challenges");
          console.error("❌ fetchChallenges:", err.message);
        } finally {
          set({ loading: false });
        }
      },

      completeChallenge: async ({ userId, category, challengeIndex }) => {
        try {
          console.log("challengeIndex : ",challengeIndex)
          await axios.post(`${url}/challengeBatch/complete`, {
            userId,
            category,
            challengeIndex,
          });
          toast.success("Challenge completed!");
          return true;
        } catch (err) {
          console.log("challengeIndex : ",challengeIndex)

          toast.error("Failed to complete challenge");
          console.error("❌ completeChallenge:", err.message);
        }
      },

      delete_challenge: async (challengeId, userId) => {
        try {
          await axios.delete(`${url}/challengeBatch/${userId}/${challengeId}`);
          toast.success("Challenge Deleted!!");
        } catch (err) {
          toast.error("Failed to delete challenge");
          console.error("❌ delete failed:", err.message);
        }
      },

      calculateRank: async (userId) => {
        try {
          const res = await axios.get(`${url}/challengeBatch/get-rank/${userId}`);
          set({
            rank: res.data?.rank,
            titles: res.data?.titles,
            badges: res.data?.badges,
          });
        } catch (err) {
          toast.error("Rank calculation failed");
          console.error("❌ calculateRank:", err.message);
        }
      },
    }),
    {
      name: "challenge-storage",
      getStorage: () => localStorage,
      // ✅ Exclude challenge arrays from persistence
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              !["challenges", "weekchallenges", "monthchallenges"].includes(key)
          )
        ),
    }
  )
);
