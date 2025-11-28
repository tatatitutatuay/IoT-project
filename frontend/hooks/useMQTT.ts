import { useEffect, useState, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";

interface UseMQTTReturn {
  isConnected: boolean;
  imageData: string | null;
  error: string | null;
  door_open: number | null;
}

export const useMQTT = (
  brokerUrl: string = "ws://raspberrypi.local:9001"
): UseMQTTReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [door_open, setDoorOpen] = useState<number | null>(null);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    // Connect to MQTT broker
    const client = mqtt.connect(brokerUrl, {
      clientId: `dashboard_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      setIsConnected(true);
      setError(null);

      // Subscribe to image and data topics
      client.subscribe("tippaphanun/5f29d93c/sensor/image", { qos: 1 });
      client.subscribe("tippaphanun/5f29d93c/sensor/data", { qos: 1 });
    });

    client.on("message", (topic, message) => {
      try {
        // Handle image data separately (binary)
        if (topic === "tippaphanun/5f29d93c/sensor/image") {
          // console.log(`   Image received, size: ${message.length} bytes`);

          try {
            // Try to parse as JSON first
            const payload = JSON.parse(message.toString());
            if (payload.image) {
              setImageData(payload.image);
            }
          } catch {
            // If not JSON, it's raw binary JPEG data - convert to base64
            const base64Image = message.toString("base64");
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;
            setImageData(dataUrl);
          }
          return;
        }

        // Handle sensor data for door_open only
        if (topic === "tippaphanun/5f29d93c/sensor/data") {
          console.log("   Sensor data message received");
          try {
            const payload = JSON.parse(message.toString());
            if (payload.type === "door_open") {
              setDoorOpen(payload.value);
            }
          } catch (parseErr) {
            console.error("Failed to parse sensor data:", parseErr);
          }
          return;
        }

        console.log(`   ⚠️  Unknown topic: ${topic}`);
      } catch (err) {
        console.error("❌ Error parsing message:", err);
        console.error("   Raw message:", message.toString());
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err);
      setError(err.message);
    });

    client.on("offline", () => {
      setIsConnected(false);
      setError("MQTT broker offline");
    });

    client.on("disconnect", () => {
      setIsConnected(false);
    });

    clientRef.current = client;

    return () => {
      if (client) {
        client.end();
      }
    };
  }, [brokerUrl]);

  return {
    isConnected,
    imageData,
    error,
    door_open,
  };
};
