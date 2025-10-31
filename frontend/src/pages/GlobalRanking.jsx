

import React, { useEffect } from "react";
import { UserAuth } from "../store/userAuthStore";
import { CardSpotlight } from "../components/ui/card-spotlight";

const GlobalRanking = () => {
  const { getGlobalRanking, ranking } = UserAuth();

  useEffect(() => {
    getGlobalRanking();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center pt-18 justify-center p-4 bg-background text-foreground"
      style={{
        backgroundImage: `url(./challengebg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 z-0" />

      <CardSpotlight
        className="w-full max-w-2xl p-6 border-4 border-primary rounded-lg z-10"
        style={{
          boxShadow: "0 0 15px rgba(0, 191, 255, 0.7)",
          backgroundColor: "rgba(10, 10, 35, 0.6)",
          backdropFilter: "blur(12px)",
        }}
        color="#0A0A23"
        radius={350}
      >
        {/* Neon Header */}
        <div
          className="absolute -top-4 sm:-top-8 left-1/2 transform -translate-x-1/2 text-md sm:text-2xl font-bold bg-primary px-2 py-1 sm:px-4 sm:py-2  rounded-t-lg"
          style={{
            // textShadow: "0 0 10px rgba(0, 191, 255, 1), 0 0 20px rgba(0, 191, 255, 0.6)",
            zIndex: 20,
          }}
        >
          [GLOBAL RANKINGS]
        </div>

        {/* Rankings */}
        <div className="mt-8 space-y-4 text-foreground">
          {ranking?.users?.length > 0 ? (
            ranking.users.map((user, index) => {
              const rankColor =
                user.rank === 1
                  ? "text-yellow-400"
                  : user.rank === 2
                  ? "text-red-300"
                  : user.rank === 3
                  ? "text-blue-300"
                  : "text-white";

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/60 hover:bg-muted/80 rounded-lg transition-colors border border-primary"
                  style={{
                    boxShadow: "inset 0 0 10px rgba(0, 191, 255, 0.3)",
                  }}
                >
                  <span className={`text-lg font-semibold   ${rankColor}`}>
                    #{user.rank} 
                  </span>
                  <span className={`flex-1 ml-4 truncate   ${rankColor}`}>{user.username}</span>
                  <span className="text-emerald-400 font-medium ml-4">
                    {user.points} pts
                  </span>
                  <span className="text-cyan-400 font-mono ml-4">
                    {user.rankCode}
                  </span>
                  <span className="text-purple-400 ml-4">
                    {user.rankTitle}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-muted-foreground text-center">
              No rankings available
            </div>
          )}
        </div>
      </CardSpotlight>
    </div>
  );
};

export default GlobalRanking;
