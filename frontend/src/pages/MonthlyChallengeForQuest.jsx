
import React, { useState, useEffect } from "react";
import { matrixAuthStore } from "../store/matrixStore";
import { useChallengeBatchStore } from "../store/ChallengeBatch";

import { UserAuth } from "../store/userAuthStore";
import { CardSpotlight } from "../components/ui/card-spotlight"; // Adjusted path

const WeeklyChallenges = () => {
      const { authUser } = UserAuth();
      const userId = authUser?._id;
      const {
        generateChallenges,
        fetchChallenges,
        completeChallenge,
        calculateRank,
       monthchallenges,
        rank,
        loading,
        delete_challenge,
      } = useChallengeBatchStore();
    
      const [openDescIndex, setOpenDescIndex] = useState(null);
    
const safeChallenges = Array.isArray(monthchallenges) ? monthchallenges : (monthchallenges?.data?.monthchallenges || monthchallenges?.monthchallenges || []);

      useEffect(() => {
        if (userId) {
          fetchChallenges(userId, "monthly");
          // calculateRank(userId);
        }
      }, [userId]);
  return (
  
   
         <CardSpotlight
           className="w-full max-w-2xl p-6 border-4 border-primary rounded-lg z-10"
           style={{
             // ✅ Optional: more theme-aware, but still neon styled
             boxShadow: "0 0 15px rgba(0, 191, 255, 0.7)",
             backgroundColor: "rgba(10, 10, 35, 0.7)",
             backdropFilter: "blur(10px)",
           }}
           color="#0A0A23"
           radius={350}
         >
           <div className="relative z-10">
             {/* Neon Header */}
             <div className="absolute -top-18 left-1/2 transform -translate-x-1/2 text-lg sm:text-3xl font-bold bg-primary px-4 py-2 rounded-t-lg text-white"
               style={{
                //  textShadow: "0 0 5px rgba(0, 191, 255, 1), 0 0 5px rgba(0, 191, 255, 0.4)",
                 zIndex: 20,
               }}
             >
               Monthly Quests
             </div>
   
             {/* Generate Button */}
             <div className="text-center my-4">
               <span
                 onClick={() =>{ if(monthchallenges.length===0) generateChallenges(userId,"monthly")}}
                 className="text-sm border rounded-md p-1 hover:bg-muted hover:scale-105 transition text-white cursor-pointer"
                 style={{ textShadow: "0 0 5px rgba(0, 191, 255, 0.8)" }}
               >
                 New Quests
               </span>
             </div>
   
             {loading && <p className="text-center text-muted-foreground">Loading...</p>}
   
             <ul className="space-y-4 mt-4">
               {safeChallenges.map((c, i) => {
                 const isCompleted = c.completed || false;
                 return (
                   <li
                     key={i}
                     className="flex flex-col border-2 border-primary rounded-md px-4 py-3 bg-muted transition hover:bg-muted/80"
                     style={{
                       boxShadow: "inset 0 0 10px rgba(0, 191, 255, 0.3)",
                     }}
                   >
                     <div className="sm:flex items-start justify-between">
                       <div
                         className="sm:text-lg font-medium text-white"
                         style={{ textShadow: "0 0 3px rgba(0, 191, 255, 0.8)" }}
                       >
                         {c.title}
                       </div>
   
                       <div className="flex items-center gap-2 mt-2 sm:mt-0">
                         <button
                           onClick={() =>
                             setOpenDescIndex(openDescIndex === i ? null : i)
                           }
                           className="text-sm text-blue-300 hover:underline"
                           style={{
                             textShadow: "0 0 3px rgba(0, 191, 255, 0.6)",
                           }}
                         >
                           {openDescIndex === i ? "Hide" : "Details"}
                         </button>
   
                         <select
                           value={isCompleted ? "Completed" : "Pending"}
                           onChange={async (e) => {
                             if (e.target.value === "Completed" && !isCompleted) {
                               await completeChallenge({
                                 userId,
                                 category: c.metricCategory,
                                 metric: c.subMetric,
                                 cId: c._id,
                               });
   
                               await fetchChallenges(userId, "daily");
                             }
                           }}
                           className="bg-background text-white border border-primary bg-base-300 rounded-md p-1"
                           disabled={isCompleted}
                         >
                           <option value="Pending">Pending</option>
                           <option value="Completed">Completed</option>
                         </select>
                       </div>
                     </div>
   
                     {openDescIndex === i && (
                       <div className="text-sm text-muted-foreground mt-2 ml-7">
                         <p>{c.description}</p>
                         {c.resource?.url && (
                           <a
                             href={c.resource.url}
                             target="_blank"
                             rel="noreferrer"
                             className="block mt-1 text-blue-400 underline"
                             style={{
                               textShadow: "0 0 2px rgba(0, 191, 255, 0.4)",
                             }}
                           >
                             🔗 {c.resource.name}
                           </a>
                         )}
                       </div>
                     )}
                   </li>
                 );
               })}
             </ul>
   
             {/* Optional rank footer */}
             {/* <div className="text-center mt-6">
               <p className="text-md font-semibold text-white">
                 🧬 Your Current Rank:{" "}
                 <span className="text-purple-600">{rank?.rank}</span>
               </p>
             </div> */}
           </div>
         </CardSpotlight>
  )
}

export default WeeklyChallenges
