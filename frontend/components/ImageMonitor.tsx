"use client";

import React, { useState, useEffect } from "react";
import { Camera, Image as ImageIcon, Download, RefreshCw } from "lucide-react";

interface ImageMonitorProps {
  imageData: string | null;
  isConnected: boolean;
}

export const ImageMonitor: React.FC<ImageMonitorProps> = ({
  imageData,
  isConnected,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const lastUpdated = imageData ? new Date() : null;

  const handleDownload = () => {
    if (!imageData) return;

    const link = document.createElement("a");
    link.href = imageData;
    link.download = `sensor-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getImageSrc = () => {
    if (!imageData) return null;

    // Check if it's already a data URL
    if (imageData.startsWith("data:image")) {
      return imageData;
    }

    // If it's base64 without prefix, add it
    if (!imageData.startsWith("http")) {
      return `data:image/jpeg;base64,${imageData}`;
    }

    return imageData;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="bg-white/80 h-full dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 p-8 border border-gray-200/50 dark:border-gray-700/50 flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Live Camera Feed
            </h2>
            {lastUpdated && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-md ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            ></div>
            {isConnected ? "Connected" : "Disconnected"}
          </div>

          {imageSrc && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              title="Download image"
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-xl overflow-hidden border-2 border-gray-300/50 dark:border-gray-600/50 shadow-inner">
        {imageSrc && !imageError ? (
          <div className="relative aspect-[16/10] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Sensor camera feed"
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImageDimensions({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              }}
            />
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
        ) : (
          <div className="aspect-[16/10] w-full flex flex-col items-center justify-center gap-3 py-8">
            <div className="p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-full">
              {imageError ? (
                <RefreshCw className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                {imageError
                  ? "Failed to load image"
                  : isConnected
                  ? "Waiting for camera feed..."
                  : "Connect to MQTT to view camera"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Topic: tippaphanun/5f29d93c/sensor/image
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
