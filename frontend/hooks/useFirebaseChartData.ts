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

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  dateObj: Date;
}

interface FirestoreDoc {
  value: number;
  type: string;
  created_at: {
    seconds: number;
    nanoseconds: number;
  };
}

export const useFirebaseChartData = (
  sensorType: string,
  maxPoints: number = 20
) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get recent data from Firebase
    const chartQuery = query(
      collection(db, "data"),
      orderBy("created_at", "desc"),
      limit(100) // Get 100 recent documents
    );

    // Listen for data updates
    const unsubscribe = onSnapshot(
      chartQuery,
      (snapshot) => {
        const points: ChartDataPoint[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as FirestoreDoc;
          
          // Only get data for this sensor type
          if (data.type === sensorType) {
            const date = new Date(data.created_at.seconds * 1000);
            points.push({
              timestamp: date.toLocaleTimeString(),
              value: data.value,
              dateObj: date,
            });
          }
        });

        // Take first 20 points and reverse (oldest first)
        setChartData(points.slice(0, maxPoints).reverse());
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sensorType, maxPoints]);

  return {
    chartData,
    isLoading,
    error,
  };
};
