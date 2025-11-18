"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface SensorChartProps {
  title: string;
  data: number | null;
  unit: string;
  color: string;
  maxDataPoints?: number;
}

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
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
      glow: "shadow-emerald-500/20",
    },
    warning: {
      bg: "bg-amber-500",
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/10",
      glow: "shadow-amber-500/20",
    },
    critical: {
      bg: "bg-rose-500",
      border: "border-rose-500/30",
      iconBg: "bg-rose-500/10",
      glow: "shadow-rose-500/20",
    },
  };

  const config = statusConfigs[status];

  return (
    <div
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl ${config.glow} p-4 border-2 ${config.border} transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${config.iconBg} shadow-lg`}>
            <Icon className={`w-5 h-5 ${config.bg.replace("bg-", "text-")}`} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${config.bg} shadow-lg animate-pulse`}
        ></div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-gray-900 dark:text-white">
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
          {unit && (
            <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
              {unit}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// Sensor Chart Component
export const SensorChart: React.FC<SensorChartProps> = ({
  title,
  data,
  unit,
  color,
  maxDataPoints = 20,
}) => {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const prevDataRef = useRef<number | null>(null);

  useEffect(() => {
    if (data === null || data === prevDataRef.current) return;

    prevDataRef.current = data;
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    const newDataPoint = { timestamp: timeString, value: data };

    queueMicrotask(() => {
      setChartData((prevChartData) => {
        const newData = [...prevChartData, newDataPoint];
        return newData.slice(-maxDataPoints);
      });
    });
  }, [data, maxDataPoints]);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl shadow-purple-500/10 dark:shadow-purple-500/5 p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10 transition-all duration-300">
      <h3 className="text-base font-black text-gray-800 dark:text-gray-100 mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            fontSize={10}
            fontWeight={600}
            tickFormatter={(value) => value.split(":").slice(0, 2).join(":")}
          />
          <YAxis stroke="#9CA3AF" fontSize={10} fontWeight={600} unit={unit} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "2px solid #374151",
              borderRadius: "1rem",
              color: "#F9FAFB",
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          />
          <Legend wrapperStyle={{ fontWeight: 600 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
