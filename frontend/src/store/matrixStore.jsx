import { create } from "zustand";
import { toast } from "react-hot-toast";
import axios from "axios";
import { url } from "../URL";
import { persist } from "zustand/middleware";

export const matrixAuthStore = create(
  persist(
    (set, get) => ({
      matrices: null,

      fetchMatrices: async (userId) => {
        if (!userId) return toast.error("User ID missing");
        try {
          const res = await axios.get(`${url}/matrices/${userId}`);
          set({ matrices: res.data });
          // toast.success("matrix fetched")
          console.log(res.data)
          // console.log(userId)
        } catch (err) {
          toast.error("Failed to fetch matrices");
          console.error("❌ fetchMatrices error:", err.message);
        }
      },

      updateMetric: async (userId, matrixId, name, value) => {
        try {
          await axios.put(`${url}/matrices/update`, {
            matrixId,
            metricName: name,
            newValue: value,
          });
          if (userId) get().fetchMatrices(userId);
        } catch (err) {
          toast.error("Update failed");
        }
      },

      addCustom: async (userId, matrixId, name) => {
        try {
          await axios.post(`${url}/matrices/add-custom`, {
            matrixId,
            metricName: name,
          });
          if (userId) get().fetchMatrices(userId);
        } catch (err) {
          toast.error("Failed to add metric");
        }
      },

      addCustomToGeneral: async (data) => {
        let { userId, username, matrices, category } = data;
        // Ensure matrices is an array of trimmed non-empty strings
        if (typeof matrices === "string") {
          matrices = matrices
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        }
        console.log(data)
        console.log(matrices)


        if (!matrices.length) {
          toast.error("No valid metrics provided");
          return;
        }
        try {
          await axios.post(`${url}/matrices/add-to-general`, {
            username,
            matrices,
            category,
          });
          if (userId) get().fetchMatrices(userId);
        } catch (err) {
            console.error(`error: ${err}`)
          toast.error("Failed to add custom matrix" +err);
        }
      },
      deleteMatrix: async (matrixID,userId) => {
  try {
    await axios.delete(`${url}/matrices/matrix-delete`, {
      data: { matrixId: matrixID }, // ✅ Put inside "data"
    });
    toast.success("Matrix Deleted Successfully");
      if (userId) get().fetchMatrices(userId);
  } catch (error) {
    toast.error("Matrix Delete failed");
    console.error("Matrix Delete failed:", error.message);
  }
      }

    }),
    {
      name: "matrix-storage",
      getStorage: () => localStorage,
    }
  )
);
