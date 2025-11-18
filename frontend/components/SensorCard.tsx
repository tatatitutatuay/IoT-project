import React from "react";
import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: "normal" | "warning" | "critical";
  description?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  status = "normal",
  description,
}) => {
  const statusConfigs = {
    normal: {
      bg: "bg-emerald-500",
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-600/10",
    },
    warning: {
      bg: "bg-amber-500",
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      glow: "shadow-amber-500/20",
      gradientFrom: "from-amber-500/20",
      gradientTo: "to-amber-600/10",
    },
    critical: {
      bg: "bg-rose-500",
      border: "border-rose-500/30",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      glow: "shadow-rose-500/20",
      gradientFrom: "from-rose-500/20",
      gradientTo: "to-rose-600/10",
    },
  };

  const config = statusConfigs[status];

  return (
    <div
      className={`relative overflow-hidden bg-white/80 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl shadow-md ${config.glow} p-6 border-2 ${config.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 group`}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      ></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-3.5 rounded-2xl ${config.iconBg} shadow-lg backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className={`w-7 h-7 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div
            className={`w-3.5 h-3.5 rounded-full ${config.bg} shadow-lg animate-pulse`}
          ></div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {typeof value === "number" ? value.toFixed(1) : value}
            </span>
            {unit && (
              <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.iconBg} ${config.iconColor} border ${config.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.bg}`}></span>
              {status === "normal"
                ? "Normal"
                : status === "warning"
                ? "Warning"
                : "Critical"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
