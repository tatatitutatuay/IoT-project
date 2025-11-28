"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  sound: number | null;
  ldr: number | null;
  peopleCount: number | null;
  door_open: number | null;
}

interface FirestoreDoc {
  value: number;
  type: string;
  created_at: {
    seconds: number;
    nanoseconds: number;
  };
}

export const useFirebaseSensors = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: null,
    humidity: null,
    sound: null,
    ldr: null,
    peopleCount: null,
    door_open: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create a query to get the latest data documents
    const dataQuery = query(
      collection(db, "data"),
      orderBy("created_at", "desc"),
      limit(50) // Get last 50 documents to have recent data for each type
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      dataQuery,
      (snapshot) => {
        const latestValues: { [key: string]: number } = {};

        // Process documents to get the latest value for each type
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as FirestoreDoc;
          const type = data.type;

          // Only update if we haven't seen this type yet (since ordered by desc)
          if (!latestValues[type]) {
            latestValues[type] = data.value;
          }
        });

        // Map Firebase types to our SensorData interface
        setSensorData({
          temperature: latestValues["temp"] ?? null,
          humidity: latestValues["humid"] ?? null,
          sound: latestValues["sound"] ?? null,
          ldr: latestValues["light"] ?? null,
          peopleCount: latestValues["people_count"] ?? null,
          door_open: latestValues["door_open"] ?? null,
        });

        setIsLoading(false);
        setError(null);
        console.log("📊 Firebase sensor data updated:", latestValues);
      },
      (err) => {
        console.error("❌ Firebase Error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return {
    sensorData,
    error,
    isLoading,
  };
};
