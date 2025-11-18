"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useMQTT } from "@/hooks/useMQTT";
import { SensorCard } from "@/components/SensorCard";
import { CrowdMonitor } from "@/components/CrowdMonitor";
import { SensorChart } from "@/components/SensorChart";
import { ImageMonitor } from "@/components/ImageMonitor";
import {
  Thermometer,
  Droplets,
  Wind,
  Volume2,
  Sun,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const { isConnected, sensorData, imageData, error } = useMQTT();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getAqiStatus = (
    value: number | null
  ): "normal" | "warning" | "critical" => {
    if (value === null) return "normal";
    if (value <= 2) return "normal"; // Excellent or Good
    if (value === 3) return "warning"; // Moderate
    return "critical"; // Poor or Unhealthy
  };

  const getTvocStatus = (
    value: number | null
  ): "normal" | "warning" | "critical" => {
    if (value === null) return "normal";
    if (value < 500) return "normal";
    if (value < 1500) return "warning";
    return "critical";
  };

  const getEco2Status = (
    value: number | null
  ): "normal" | "warning" | "critical" => {
    if (value === null) return "normal";
    if (value < 1000) return "normal";
    if (value < 1500) return "warning";
    return "critical";
  };

  const getCrowdDensity = (count: number | null): "low" | "medium" | "high" => {
    if (count === null || count < 10) return "low";
    if (count < 20) return "medium";
    return "high";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 relative">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl"></div>

          <div className="flex flex-row gap-4">
            <div className="relative w-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 p-8 border border-gray-200/50 dark:border-gray-700/50 flex flex-col">
              <div className="flex flex-col items-start gap-1 flex-1">
                {/* Title Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
                        Smart Campus Monitor
                      </h1>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-semibold mt-0.5">
                        IoT Environmental Intelligence System
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Info Section */}
                <div className="flex flex-row-reverse gap-2">
                  {/* Connection Status */}
                  {isConnected ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105">
                      <div className="relative">
                        <Wifi className="w-4 h-4 text-white animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <span className="text-white font-bold text-xs block">
                          Connected
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 rounded-lg shadow-lg shadow-rose-500/30 transition-all duration-300">
                      <WifiOff className="w-4 h-4 text-white" />
                      <div>
                        <span className="text-white font-bold text-xs block">
                          Disconnected
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Time Display */}
                  {currentTime && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                      <Activity className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                        {new Date(currentTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-400 rounded-lg shadow-md backdrop-blur-sm">
                  <p className="text-amber-900 dark:text-amber-200 text-sm font-semibold flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    {error}
                  </p>
                </div>
              )}
              <Image
                src="/pic1.svg"
                alt="Campus Monitor"
                width={560}
                height={300}
                className="relative mt-12"
              />
            </div>
            {/* Image Monitor */}
            <div className="w-1/2">
              <ImageMonitor imageData={imageData} isConnected={isConnected} />
            </div>
          </div>
        </div>

        {/* Crowd Monitor */}
        <div className="mb-5">
          <CrowdMonitor
            crowdCount={sensorData.peopleCount ?? 0}
            crowdDensity={getCrowdDensity(sensorData.peopleCount)}
          />
        </div>

        {/* Environmental Sensors - Grouped */}
        <div className="space-y-5 mb-5">
          {/* Group 1: Climate & Environment Sensors */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-blue-500" />
              Climate & Environment Sensors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SensorCard
                title="Temperature"
                value={sensorData.temperature ?? "--"}
                unit="°C"
                icon={Thermometer}
                status={
                  sensorData.temperature !== null
                    ? sensorData.temperature < 20
                      ? "warning"
                      : sensorData.temperature > 28
                      ? "critical"
                      : "normal"
                    : "normal"
                }
                description="Ambient temperature"
              />
              <SensorCard
                title="Humidity"
                value={sensorData.humidity ?? "--"}
                unit="%"
                icon={Droplets}
                status={
                  sensorData.humidity !== null
                    ? sensorData.humidity < 30
                      ? "warning"
                      : sensorData.humidity > 70
                      ? "warning"
                      : "normal"
                    : "normal"
                }
                description="Relative humidity"
              />
              <SensorCard
                title="Sound Detected"
                value={
                  sensorData.sound !== null
                    ? sensorData.sound === 1
                      ? "YES"
                      : "NO"
                    : "--"
                }
                unit=""
                icon={Volume2}
                status={
                  sensorData.sound !== null
                    ? sensorData.sound === 1
                      ? "warning"
                      : "normal"
                    : "normal"
                }
                description={
                  sensorData.sound === 1 ? "Sound detected" : "No sound"
                }
              />
              <SensorCard
                title="Light Intensity"
                value={sensorData.ldr ?? "--"}
                unit="lux"
                icon={Sun}
                status={
                  sensorData.ldr !== null
                    ? sensorData.ldr < 200
                      ? "warning"
                      : "normal"
                    : "normal"
                }
                description="Ambient light"
              />
            </div>
          </div>

          {/* Group 2: Air Quality Sensors */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Wind className="w-5 h-5 text-purple-500" />
              Air Quality Sensors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SensorCard
                title="Air Quality Index (AQI)"
                value={
                  sensorData.aqi !== null
                    ? sensorData.aqi === 1
                      ? "Excellent"
                      : sensorData.aqi === 2
                      ? "Good"
                      : sensorData.aqi === 3
                      ? "Moderate"
                      : sensorData.aqi === 4
                      ? "Poor"
                      : "Unhealthy"
                    : "--"
                }
                unit=""
                icon={Wind}
                status={getAqiStatus(sensorData.aqi)}
                description={
                  sensorData.aqi !== null
                    ? `Level ${sensorData.aqi}`
                    : "No data"
                }
              />
              <SensorCard
                title="Total Volatile Organic Compounds"
                value={sensorData.tvoc ?? "--"}
                unit="ppb"
                icon={Wind}
                status={getTvocStatus(sensorData.tvoc)}
                description={
                  sensorData.tvoc !== null
                    ? sensorData.tvoc < 250
                      ? "Excellent"
                      : sensorData.tvoc < 500
                      ? "Good"
                      : sensorData.tvoc < 1500
                      ? "Moderate"
                      : sensorData.tvoc < 3000
                      ? "Poor"
                      : "Unhealthy"
                    : "No data"
                }
              />
              <SensorCard
                title="Equivalent CO2 (eCO2)"
                value={sensorData.eco2 ?? "--"}
                unit="ppm"
                icon={Wind}
                status={getEco2Status(sensorData.eco2)}
                description={
                  sensorData.eco2 !== null
                    ? sensorData.eco2 < 600
                      ? "Excellent"
                      : sensorData.eco2 < 1000
                      ? "Good"
                      : sensorData.eco2 < 1500
                      ? "Moderate"
                      : sensorData.eco2 < 2000
                      ? "Poor"
                      : "Unhealthy"
                    : "No data"
                }
              />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <SensorChart
            title="Temperature History"
            data={sensorData.temperature}
            unit="°C"
            color="#ef4444"
          />
          <SensorChart
            title="Humidity History"
            data={sensorData.humidity}
            unit="%"
            color="#3b82f6"
          />
          <SensorChart
            title="AQI History"
            data={sensorData.aqi}
            unit=""
            color="#8b5cf6"
          />
          <SensorChart
            title="TVOC History"
            data={sensorData.tvoc}
            unit="ppb"
            color="#10b981"
          />
          <SensorChart
            title="eCO2 History"
            data={sensorData.eco2}
            unit="ppm"
            color="#f59e0b"
          />
          <SensorChart
            title="Sound Detection History"
            data={sensorData.sound}
            unit=""
            color="#ec4899"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
          <p className="text-gray-600 dark:text-gray-400 font-semibold text-xs mb-2">
            Smart Campus IoT Project - Real-time Monitoring Dashboard
          </p>
          {currentTime && (
            <p className="text-gray-500 dark:text-gray-500 text-[10px] font-medium bg-gray-100/50 dark:bg-gray-800/50 rounded-full px-3 py-1 inline-block backdrop-blur-sm">
              Last updated: {currentTime}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
