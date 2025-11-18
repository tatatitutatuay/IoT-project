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
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Live Camera Feed
            </h2>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-md ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            ></div>
            {isConnected ? "Connected" : "Disconnected"}
          </div>

          {imageSrc && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              title="Download image"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-xl overflow-hidden border-2 border-gray-300/50 dark:border-gray-600/50 shadow-inner">
        {imageSrc && !imageError ? (
          <div className="relative aspect-video w-full">
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
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full flex flex-col items-center justify-center gap-4 py-12">
            <div className="p-6 bg-gray-200/50 dark:bg-gray-700/50 rounded-full">
              {imageError ? (
                <RefreshCw className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 font-semibold">
                {imageError
                  ? "Failed to load image"
                  : isConnected
                  ? "Waiting for camera feed..."
                  : "Connect to MQTT to view camera"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Topic: tippaphanun/5f29d93c/sensor/image
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            Resolution
          </p>
          <p className="text-lg font-black text-gray-800 dark:text-gray-100">
            {imageDimensions
              ? `${imageDimensions.width} × ${imageDimensions.height}`
              : "N/A"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
            Status
          </p>
          <p className="text-lg font-black text-gray-800 dark:text-gray-100">
            {imageSrc ? "Active" : "Idle"}
          </p>
        </div>
      </div>
    </div>
  );
};
