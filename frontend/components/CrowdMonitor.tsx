import React from "react";
import { Users, TrendingUp, AlertCircle } from "lucide-react";

interface CrowdMonitorProps {
  crowdCount: number;
  crowdDensity: "low" | "medium" | "high";
  maxPeople?: number;
}

export const CrowdMonitor: React.FC<CrowdMonitorProps> = ({
  crowdCount,
  crowdDensity,
  maxPeople = 30,
}) => {
  const densityPercentage = Math.round((crowdCount / maxPeople) * 100);
  const getDensityColor = (density: string) => {
    switch (density) {
      case "low":
        return "text-emerald-400";
      case "medium":
        return "text-amber-400";
      case "high":
        return "text-rose-400";
      default:
        return "text-gray-400";
    }
  };

  const getDensityBg = (density: string) => {
    switch (density) {
      case "low":
        return "bg-emerald-500";
      case "medium":
        return "bg-amber-500";
      case "high":
        return "bg-rose-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="relative overflow-hidden text-white bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl shadow-indigo-500/30 p-8 border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <Users className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black">Crowd Occupancy</h2>
          </div>
          <div
            className={`px-5 py-2.5 rounded-xl ${getDensityBg(
              crowdDensity
            )} bg-opacity-90 backdrop-blur-md border-2 border-white/30 shadow-lg`}
          >
            <span className="font-black uppercase text-sm tracking-wider">
              {crowdDensity} Density
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6" />
              <span className="text-sm font-semibold opacity-90">
                People Count
              </span>
            </div>
            <p className="text-5xl font-black">{crowdCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm font-semibold opacity-90">
                Density Level
              </span>
            </div>
            <p
              className={`text-5xl font-black ${getDensityColor(crowdDensity)}`}
            >
              {densityPercentage}%
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-6 h-6" />
              <span className="text-sm font-semibold opacity-90">
                Comfort Status
              </span>
            </div>
            <p className="text-3xl font-black">
              {crowdDensity === "low"
                ? "Comfortable"
                : crowdDensity === "medium"
                ? "Moderate"
                : "Crowded"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
