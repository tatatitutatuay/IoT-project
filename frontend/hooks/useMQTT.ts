import { useEffect, useState, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";

export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  aqi: number | null;
  tvoc: number | null;
  eco2: number | null;
  sound: number | null;
  ldr: number | null;
  peopleCount: number | null;
}

export interface SensorMessage {
  type: "sound" | "light" | "temp" | "humid" | "aqi" | "tvoc" | "eco2" | "people_count";
  value: number;
}

interface UseMQTTReturn {
  isConnected: boolean;
  sensorData: SensorData;
  imageData: string | null;
  error: string | null;
}

export const useMQTT = (
  brokerUrl: string = "wss://test.mosquitto.org:8081"
): UseMQTTReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: null,
    humidity: null,
    aqi: null,
    tvoc: null,
    eco2: null,
    sound: null,
    ldr: null,
    peopleCount: null,
  });
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

      // Subscribe to topics
      client.subscribe("tippaphanun/5f29d93c/sensor/data", { qos: 1 });
      client.subscribe("tippaphanun/5f29d93c/sensor/image", { qos: 1 });
    });

    client.on("message", (topic, message) => {
      try {
        // Handle image data separately (binary)
        if (topic === "tippaphanun/5f29d93c/sensor/image") {
          console.log(`   Image received, size: ${message.length} bytes`);

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
            console.log(`   Image converted to base64 data URL`);
          }
          return;
        }

        const payload = JSON.parse(message.toString()) as SensorMessage;

        // Log all incoming MQTT messages

        switch (topic) {
          case "tippaphanun/5f29d93c/sensor/data": {
            const sensorMsg = payload as SensorMessage;

            setSensorData((prev) => {
              const updated = { ...prev };

              switch (sensorMsg.type) {
                case "temp":
                  updated.temperature = sensorMsg.value;
                  break;
                case "humid":
                  updated.humidity = sensorMsg.value;
                  break;
                case "aqi":
                  updated.aqi = sensorMsg.value;
                  break;
                case "tvoc":
                  updated.tvoc = sensorMsg.value;
                  break;
                case "eco2":
                  updated.eco2 = sensorMsg.value;
                  break;
                case "sound":
                  updated.sound = sensorMsg.value;
                  break;
                case "light":
                  updated.ldr = sensorMsg.value;
                  break;
                case "people_count":
                  updated.peopleCount = sensorMsg.value;
                  break;
              }

              return updated;
            });
            break;
          }
          default:
            console.log(`   ⚠️  Unknown topic: ${topic}`);
        }
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
    sensorData,
    imageData,
    error,
  };
};
