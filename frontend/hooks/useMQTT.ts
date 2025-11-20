import { useEffect, useState, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";

export interface MotorStatus {
  state:
    | "open"
    | "closed"
    | "opening"
    | "closing"
    | "stopped"
    | "partial"
    | "idle"
    | "error";
  message: string;
  timestamp: number;
  position?: {
    current_steps: number;
    total_steps: number;
    percentage: number;
    is_moving: boolean;
  };
}

interface UseMQTTReturn {
  isConnected: boolean;
  imageData: string | null;
  motorStatus: MotorStatus | null;
  error: string | null;
  controlMotor: (
    action: "open" | "close" | "stop" | "status",
    speed?: "fast" | "normal"
  ) => void;
}

export const useMQTT = (
  brokerUrl: string = "wss://test.mosquitto.org:8081"
): UseMQTTReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [motorStatus, setMotorStatus] = useState<MotorStatus | null>(null);
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

      // Subscribe to topics (only image and motor, no sensor data)
      client.subscribe("tippaphanun/5f29d93c/sensor/image", { qos: 1 });
      client.subscribe("tippaphanun/5f29d93c/motor/status", { qos: 1 });
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
          }
          return;
        }

        // Handle motor status
        if (topic === "tippaphanun/5f29d93c/motor/status") {
          console.log(`   Motor status received: ${message.toString()}`);
          const motorMsg = JSON.parse(message.toString()) as MotorStatus;
          setMotorStatus(motorMsg);
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

  const controlMotor = (
    action: "open" | "close" | "stop" | "status",
    speed: "fast" | "normal" = "fast"
  ) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.error("MQTT client not connected");
      setError("Cannot control motor: Not connected to MQTT broker");
      return;
    }

    const command = {
      action,
      speed,
    };

    client.publish(
      "tippaphanun/5f29d93c/motor/control",
      JSON.stringify(command),
      { qos: 1 },
      (err) => {
        if (err) {
          console.error("Failed to publish motor command:", err);
          setError(`Failed to send motor command: ${err.message}`);
        } else {
          console.log(`Motor command sent: ${action} (${speed})`);
        }
      }
    );
  };

  return {
    isConnected,
    imageData,
    motorStatus,
    error,
    controlMotor,
  };
};
