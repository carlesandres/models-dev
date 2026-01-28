import { RawApiResponse, RawModel, Model, Provider, ModelsData, InputModality, OutputModality } from "./types";

export const API_URL = "https://models.dev/api.json";
export const LOGO_BASE_URL = "https://models.dev/logos";

export function getProviderLogoUrl(providerId: string): string {
  return `${LOGO_BASE_URL}/${providerId}.svg`;
}

export function transformApiResponse(data: RawApiResponse): ModelsData {
  const providers: Provider[] = [];
  const models: Model[] = [];

  for (const [providerId, rawProvider] of Object.entries(data)) {
    const modelEntries = Object.entries(rawProvider.models);

    providers.push({
      id: providerId,
      name: rawProvider.name,
      doc: rawProvider.doc,
      modelCount: modelEntries.length,
      logo: getProviderLogoUrl(providerId),
    });

    for (const [modelId, rawModel] of modelEntries) {
      models.push(transformModel(rawModel, modelId, providerId, rawProvider.name));
    }
  }

  // Sort providers alphabetically
  providers.sort((a, b) => a.name.localeCompare(b.name));

  // Sort models by provider name, then model name
  models.sort((a, b) => {
    const providerCompare = a.providerName.localeCompare(b.providerName);
    if (providerCompare !== 0) return providerCompare;
    return a.name.localeCompare(b.name);
  });

  return { providers, models };
}

function transformModel(raw: RawModel, modelId: string, providerId: string, providerName: string): Model {
  return {
    id: modelId,
    name: raw.name,
    family: raw.family,
    providerId,
    providerName,
    providerLogo: getProviderLogoUrl(providerId),

    // Capabilities (default to false if undefined)
    attachment: raw.attachment ?? false,
    reasoning: raw.reasoning ?? false,
    tool_call: raw.tool_call ?? false,
    structured_output: raw.structured_output ?? false,
    temperature: raw.temperature ?? false,

    // Metadata
    knowledge: raw.knowledge,
    release_date: raw.release_date,
    last_updated: raw.last_updated,
    open_weights: raw.open_weights ?? false,
    status: raw.status,

    // Modalities
    modalities: {
      input: (raw.modalities?.input ?? ["text"]) as InputModality[],
      output: (raw.modalities?.output ?? ["text"]) as OutputModality[],
    },

    // Pricing
    cost: raw.cost,

    // Limits
    limit: raw.limit,
  };
}
