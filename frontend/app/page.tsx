"use client";

import { useState, useEffect } from "react";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                🏫 Smart Campus Monitor
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium">
                Real-time crowd density and environmental comfort tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 rounded-xl shadow-lg shadow-green-500/30 dark:shadow-green-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/40">
                  <Wifi className="w-5 h-5 text-white animate-pulse" />
                  <span className="text-white font-bold text-sm">
                    Connected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600 rounded-xl shadow-lg shadow-red-500/30 dark:shadow-red-500/20 transition-all duration-300">
                  <WifiOff className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-sm">
                    Disconnected
                  </span>
                </div>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-400 rounded-xl shadow-md backdrop-blur-sm">
              <p className="text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Crowd Monitor */}
        <div className="mb-8">
          <CrowdMonitor
            crowdCount={sensorData.peopleCount ?? 0}
            crowdDensity={getCrowdDensity(sensorData.peopleCount)}
          />
        </div>

        {/* Image Monitor */}
        <div className="mb-8">
          <ImageMonitor imageData={imageData} isConnected={isConnected} />
        </div>

        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            title="AQI (คุณภาพอากาศ)"
            value={
              sensorData.aqi !== null
                ? sensorData.aqi === 1
                  ? "ยอดเยี่ยม"
                  : sensorData.aqi === 2
                  ? "ดี"
                  : sensorData.aqi === 3
                  ? "ปานกลาง"
                  : sensorData.aqi === 4
                  ? "แย่"
                  : "เลวร้าย"
                : "--"
            }
            unit=""
            icon={Wind}
            status={getAqiStatus(sensorData.aqi)}
            description={
              sensorData.aqi !== null
                ? `ระดับ ${sensorData.aqi}`
                : "ไม่มีข้อมูล"
            }
          />
          <SensorCard
            title="TVOC (สารเคมีในอากาศ)"
            value={sensorData.tvoc ?? "--"}
            unit="ppb"
            icon={Wind}
            status={getTvocStatus(sensorData.tvoc)}
            description={
              sensorData.tvoc !== null
                ? sensorData.tvoc < 250
                  ? "ยอดเยี่ยม"
                  : sensorData.tvoc < 500
                  ? "ดี"
                  : sensorData.tvoc < 1500
                  ? "ปานกลาง"
                  : sensorData.tvoc < 3000
                  ? "แย่"
                  : "เลวร้าย"
                : "ไม่มีข้อมูล"
            }
          />
          <SensorCard
            title="eCO2 (ค่าคาร์บอนไดออกไซด์)"
            value={sensorData.eco2 ?? "--"}
            unit="ppm"
            icon={Wind}
            status={getEco2Status(sensorData.eco2)}
            description={
              sensorData.eco2 !== null
                ? sensorData.eco2 < 600
                  ? "ยอดเยี่ยม"
                  : sensorData.eco2 < 1000
                  ? "ดี"
                  : sensorData.eco2 < 1500
                  ? "ปานกลาง"
                  : sensorData.eco2 < 2000
                  ? "แย่"
                  : "เลวร้าย"
                : "ไม่มีข้อมูล"
            }
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
            description={sensorData.sound === 1 ? "Sound detected" : "No sound"}
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
        <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
          <p className="text-gray-600 dark:text-gray-400 font-semibold text-sm mb-2">
            Smart Campus IoT Project - Real-time Monitoring Dashboard
          </p>
          {currentTime && (
            <p className="text-gray-500 dark:text-gray-500 text-xs font-medium bg-gray-100/50 dark:bg-gray-800/50 rounded-full px-4 py-2 inline-block backdrop-blur-sm">
              Last updated: {currentTime}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
