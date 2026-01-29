import { useState, useEffect } from "react";
import { API_URL, transformApiResponse, getCachedData, setCachedData } from "../lib/api";
import { ModelsData, RawApiResponse } from "../lib/types";

/**
 * Hook to fetch models data from models.dev
 * Caches transformed data to disk for instant subsequent loads.
 */
export function useModelsData() {
  const [data, setData] = useState<ModelsData | undefined>(() => {
    // Synchronously check cache on initial render
    return getCachedData() ?? undefined;
  });
  const [isLoading, setIsLoading] = useState(!data);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(API_URL);
        const raw: RawApiResponse = await response.json();
        const transformed = transformApiResponse(raw);
        setCachedData(transformed);
        setData(transformed);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, isLoading };
}
