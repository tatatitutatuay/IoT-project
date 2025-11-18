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
  const statusColors = {
    normal: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
  };

  const borderColors = {
    normal: "border-green-500/20",
    warning: "border-yellow-500/20",
    critical: "border-red-500/20",
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 ${borderColors[status]} transition-all hover:shadow-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-full ${statusColors[status]} bg-opacity-10`}
          >
            <Icon className={`w-6 h-6`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
          {unit && (
            <span className="text-xl text-gray-500 dark:text-gray-400">
              {unit}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
