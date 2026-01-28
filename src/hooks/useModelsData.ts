import { useFetch } from "@raycast/utils";
import { API_URL, transformApiResponse } from "../lib/api";
import { ModelsData, RawApiResponse } from "../lib/types";

/**
 * Hook to fetch and cache models data from models.dev
 *
 * Uses stale-while-revalidate strategy:
 * - Returns cached data immediately if available
 * - Revalidates in the background
 * - Updates UI when fresh data arrives
 */
export function useModelsData() {
  return useFetch<ModelsData>(API_URL, {
    // Keep showing previous data while loading new data
    keepPreviousData: true,

    // Transform the raw API response into our normalized structure
    parseResponse: async (response) => {
      const data: RawApiResponse = await response.json();
      return transformApiResponse(data);
    },
  });
}
