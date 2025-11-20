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
    // Query all recent data (no composite index needed)
    // We'll filter by type client-side to avoid index requirement
    const chartQuery = query(
      collection(db, "data"),
      orderBy("created_at", "desc"),
      limit(maxPoints * 10) // Fetch more to ensure enough after filtering
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      chartQuery,
      (snapshot) => {
        const dataPoints: ChartDataPoint[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as FirestoreDoc;

          // Filter by sensor type client-side
          if (data.type === sensorType) {
            const date = new Date(data.created_at.seconds * 1000);

            dataPoints.push({
              timestamp: date.toLocaleTimeString(),
              value: data.value,
              dateObj: date,
            });
          }
        });

        // Take only the requested number of points and reverse
        const limitedPoints = dataPoints.slice(0, maxPoints).reverse();

        setChartData(limitedPoints);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`❌ Firebase Chart Error (${sensorType}):`, err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [sensorType, maxPoints]);

  return {
    chartData,
    isLoading,
    error,
  };
};
