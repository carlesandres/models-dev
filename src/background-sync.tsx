import { fetchModelsData } from "./lib/api";

export default async function BackgroundSync() {
  try {
    await fetchModelsData();
  } catch {}
}
