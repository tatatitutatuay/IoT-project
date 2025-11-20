"use client";

import { DoorOpen, DoorClosed, StopCircle, Info } from "lucide-react";
import { MotorStatus } from "@/hooks/useMQTT";

interface MotorControlProps {
  motorStatus: MotorStatus | null;
  onControl: (
    action: "open" | "close" | "stop" | "status",
    speed?: "fast" | "normal"
  ) => void;
  isConnected: boolean;
}

export default function MotorControl({
  motorStatus,
  onControl,
  isConnected,
}: MotorControlProps) {
  const getStatusColor = () => {
    if (!motorStatus) return "bg-gray-500";

    switch (motorStatus.state) {
      case "open":
        return "bg-green-500";
      case "closed":
        return "bg-blue-500";
      case "opening":
      case "closing":
        return "bg-yellow-500 animate-pulse";
      case "stopped":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = () => {
    if (!motorStatus) return <DoorClosed className="w-5 h-5" />;

    switch (motorStatus.state) {
      case "open":
      case "opening":
        return <DoorOpen className="w-5 h-5" />;
      case "closed":
      case "closing":
        return <DoorClosed className="w-5 h-5" />;
      case "stopped":
        return <StopCircle className="w-5 h-5" />;
      default:
        return <DoorClosed className="w-5 h-5" />;
    }
  };

  const getPositionPercentage = () => {
    if (!motorStatus?.position) return 0;
    return motorStatus.position.percentage;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DoorOpen className="w-6 h-6 text-blue-600" />
          Motor Control
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs font-medium text-gray-600 uppercase">
            {motorStatus?.state || "Unknown"}
          </span>
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700">
              {motorStatus?.message || "Waiting for status..."}
            </p>
            {motorStatus?.position && (
              <p className="text-xs text-gray-600 mt-1">
                Position: {motorStatus.position.current_steps} /{" "}
                {motorStatus.position.total_steps} steps
              </p>
            )}
          </div>
        </div>

        {/* Position Progress Bar */}
        {motorStatus?.position && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                motorStatus.position.is_moving
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
                  : "bg-gradient-to-r from-blue-600 to-purple-600"
              }`}
              style={{ width: `${getPositionPercentage()}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => onControl("open", "fast")}
          disabled={!isConnected || motorStatus?.state === "opening"}
          className="flex flex-col items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-colors"
        >
          <DoorOpen className="w-5 h-5" />
          <span className="text-xs font-semibold">Open</span>
        </button>

        <button
          onClick={() => onControl("stop")}
          disabled={!isConnected || !motorStatus?.position?.is_moving}
          className="flex flex-col items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-colors"
        >
          <StopCircle className="w-5 h-5" />
          <span className="text-xs font-semibold">Stop</span>
        </button>

        <button
          onClick={() => onControl("close", "fast")}
          disabled={!isConnected || motorStatus?.state === "closing"}
          className="flex flex-col items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-colors"
        >
          <DoorClosed className="w-5 h-5" />
          <span className="text-xs font-semibold">Close</span>
        </button>
      </div>

      {/* Status Request Button */}
      <button
        onClick={() => onControl("status")}
        disabled={!isConnected}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 rounded-lg p-2 text-sm transition-colors"
      >
        <Info className="w-4 h-4" />
        <span>Request Status</span>
      </button>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 text-center">
            ⚠️ Not connected to MQTT broker
          </p>
        </div>
      )}
    </div>
  );
}
