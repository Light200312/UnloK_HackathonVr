import React, { useState } from "react";
import { useClanStore } from "../store/clanStore";
import { UserAuth } from "../store/userAuthStore";
import { motion } from "framer-motion";
import { Loader2, Shield, ImagePlus } from "lucide-react";

const CreateClan = () => {
  const { createClan, clansLoading } = useClanStore();
  const { authUser } = UserAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    bannerImage: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Please enter a clan name");
    await createClan({
      ...form,
      leaderId: authUser._id,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm({ ...form, bannerImage: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen pt-15 bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex flex-col items-center justify-center text-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#1e293b]/80 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-slate-700"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center space-x-2">
            <Shield size={36} className="text-cyan-400" />
            <h1 className="text-3xl font-bold">Create a Clan</h1>
          </div>
          <p className="text-slate-400 mt-2 text-center">
            Form your own clan, set your banner, and lead your team to glory!
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Clan Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-500 outline-none"
              placeholder="Enter clan name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-500 outline-none resize-none h-28"
              placeholder="Describe your clan’s purpose..."
            />
          </div>

          {/* BANNER UPLOAD */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Banner Image
            </label>
            <div className="relative w-full h-40 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
              {form.bannerImage ? (
                <img
                  src={form.bannerImage}
                  alt="Clan banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <ImagePlus size={28} />
                  <p className="text-sm mt-2">Upload a banner image</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={clansLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg flex justify-center items-center space-x-2"
          >
            {clansLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />{" "}
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Clan</span>
            )}
          </motion.button>
        </form>
      </motion.div>

      <p className="text-slate-500 text-sm mt-8">
        Already have a clan? Go to <span className="text-cyan-400">Clan Hub</span>
      </p>
    </div>
  );
};

export default CreateClan;
