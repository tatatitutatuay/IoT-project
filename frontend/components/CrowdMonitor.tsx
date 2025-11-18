import React from "react";
import { Users, TrendingUp, AlertCircle, UserCheck } from "lucide-react";

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
        return "text-emerald-300";
      case "medium":
        return "text-amber-300";
      case "high":
        return "text-rose-300";
      default:
        return "text-gray-400";
    }
  };

  const getDensityBg = (density: string) => {
    switch (density) {
      case "low":
        return "from-emerald-500 to-green-600";
      case "medium":
        return "from-amber-500 to-orange-600";
      case "high":
        return "from-rose-500 to-red-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getDensityLabel = (density: string) => {
    switch (density) {
      case "low":
        return "Optimal";
      case "medium":
        return "Moderate";
      case "high":
        return "High";
      default:
        return "Unknown";
    }
  };

  const getComfortStatus = (density: string) => {
    switch (density) {
      case "low":
        return { text: "Spacious & Comfortable", icon: "😊" };
      case "medium":
        return { text: "Acceptable Conditions", icon: "😐" };
      case "high":
        return { text: "Crowded Space", icon: "😰" };
      default:
        return { text: "Unknown", icon: "❓" };
    }
  };

  const comfort = getComfortStatus(crowdDensity);

  return (
    <div className="relative overflow-hidden text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl shadow-purple-500/40 p-8 border border-white/20">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/15 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
              <Users className="w-10 h-10 drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Space Occupancy
              </h2>
              <p className="text-sm text-white/80 mt-1 font-medium">
                Real-time monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Current Occupancy */}
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold opacity-90 uppercase tracking-wide">
                Current Occupancy
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black tracking-tighter">
                {crowdCount}
              </p>
              <span className="text-2xl font-bold opacity-70">
                / {maxPeople}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-2 font-semibold">
              People detected
            </p>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold opacity-90 uppercase tracking-wide">
                Occupancy Rate
              </span>
            </div>
            <p
              className={`text-6xl font-black tracking-tighter ${getDensityColor(
                crowdDensity
              )}`}
            >
              {densityPercentage}%
            </p>
            <p className="text-xs text-white/70 mt-2 font-semibold">
              Of maximum capacity
            </p>
          </div>

          {/* Comfort Level */}
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold opacity-90 uppercase tracking-wide">
                Comfort Level
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{comfort.icon}</span>
              <p className="text-2xl font-black leading-tight">
                {comfort.text}
              </p>
            </div>
            <p className="text-xs text-white/70 mt-2 font-semibold">
              {densityPercentage < 50
                ? "Plenty of space"
                : densityPercentage < 80
                ? "Getting busy"
                : "Near capacity"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
