# models.dev Raycast Extension - PRD

## Overview

A Raycast extension for exploring AI model specifications, pricing, and capabilities from [models.dev](https://models.dev). The extension provides fast, cached access to model information with multiple ways to search, filter, and compare models across providers.

## Data Source

- **API Endpoint**: `https://models.dev/api.json` - Single JSON containing all providers and models
- **Logo Endpoint**: `https://models.dev/logos/{provider}.svg` - Provider logos for visual identification
- **Data Refresh**: Stale-while-revalidate strategy - show cached data immediately, refresh in background

## Commands

### 1. Search Models (Primary Command)
**Command ID**: `search-models`
**Title**: "Search Models"
**Description**: "Search across all AI models by name, provider, or capability"

The main entry point. A searchable list of all models across all providers.

**Features**:
- Fuzzy search by model name and provider
- Accessories showing: provider name, context window, pricing tier indicator
- Quick actions: view details, copy model ID, open provider docs
- Dropdown filter for capabilities (reasoning, tool_call, multimodal, etc.)

**List Item Display**:
```
[Provider Logo] Model Name (Family)
              Provider | 128K context | $2.50/M input
```

### 2. Browse Providers
**Command ID**: `browse-providers`
**Title**: "Browse Providers"
**Description**: "Explore AI providers and their model offerings"

Browse providers first, then drill down into their models.

**Features**:
- List all providers with their logos
- Show model count per provider
- Accessories: number of models, supported modalities
- Push to filtered model list when selecting a provider

### 3. Compare Models
**Command ID**: `compare-models`
**Title**: "Compare Models"
**Description**: "Select models to compare side-by-side"

Multi-select models to see a comparison table.

**Features**:
- Search and multi-select models (up to 4)
- Detail view showing comparison table:
  - Pricing (input/output/cache)
  - Context window & limits
  - Capabilities matrix (reasoning, tool_call, etc.)
  - Modalities supported
- Actions to copy comparison as markdown

### 4. Find by Capability
**Command ID**: `find-by-capability`
**Title**: "Find by Capability"
**Description**: "Find models that support specific capabilities"

Start with capability selection, then show matching models.

**Features**:
- List of capabilities: reasoning, tool_call, multimodal (vision/audio), structured_output, open_weights
- Select one or more capabilities
- Push to filtered model list
- Accessories showing model count per capability

### 5. Pricing Explorer
**Command ID**: `pricing-explorer`
**Title**: "Pricing Explorer"
**Description**: "Compare model pricing across providers"

Focus specifically on pricing comparison.

**Features**:
- Models sorted by input price (cheapest first)
- Filter by price range
- Accessories: input price, output price, cache pricing if available
- Detail panel with full pricing breakdown
- Option to estimate cost for X tokens

---

## Architecture

### Directory Structure

```
src/
├── commands/
│   ├── search-models.tsx      # Main search command
│   ├── browse-providers.tsx   # Provider browser
│   ├── compare-models.tsx     # Model comparison
│   ├── find-by-capability.tsx # Capability-based search
│   └── pricing-explorer.tsx   # Pricing comparison
├── components/
│   ├── ModelListItem.tsx      # Reusable model list item
│   ├── ModelDetail.tsx        # Model detail panel
│   ├── ProviderListItem.tsx   # Reusable provider list item
│   ├── ComparisonView.tsx     # Side-by-side comparison
│   └── CapabilityBadge.tsx    # Capability indicator
├── hooks/
│   └── useModelsData.ts       # Main data fetching hook with caching
├── lib/
│   ├── api.ts                 # API fetching and types
│   ├── types.ts               # TypeScript interfaces
│   ├── filters.ts             # Filter/query utilities
│   ├── formatters.ts          # Price/number formatting
│   └── constants.ts           # Capability definitions, etc.
└── assets/
    └── (provider logos cached locally as fallback)
```

### Type Definitions

```typescript
// Provider type
interface Provider {
  id: string;
  name: string;
  doc: string;
  models: Record<string, Model>;
}

// Model type (simplified, no dev fields)
interface Model {
  id: string;
  name: string;
  family?: string;
  providerId: string;      // Denormalized for convenience
  providerName: string;    // Denormalized for convenience

  // Capabilities
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
  structured_output?: boolean;
  temperature?: boolean;

  // Metadata
  knowledge?: string;      // YYYY-MM format
  release_date?: string;
  open_weights?: boolean;
  status?: 'alpha' | 'beta' | 'deprecated';

  // Modalities
  modalities: {
    input: ('text' | 'image' | 'audio' | 'video' | 'pdf')[];
    output: ('text' | 'audio')[];
  };

  // Pricing (per million tokens, USD)
  cost?: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
    reasoning?: number;
  };

  // Limits
  limit?: {
    context: number;
    input?: number;
    output?: number;
  };
}

// Flattened model for list views
interface FlatModel extends Model {
  providerId: string;
  providerName: string;
  providerLogo: string;    // URL to logo
}
```

### Data Layer

```typescript
// hooks/useModelsData.ts
import { useFetch } from "@raycast/utils";

const API_URL = "https://models.dev/api.json";

export function useModelsData() {
  return useFetch<ApiResponse>(API_URL, {
    keepPreviousData: true,
    // Parse and flatten the response
    parseResponse: async (response) => {
      const data = await response.json();
      return transformApiResponse(data);
    },
  });
}

// Transform nested provider->models structure to flat list
function transformApiResponse(data: RawApiResponse): TransformedData {
  const providers: Provider[] = [];
  const models: FlatModel[] = [];

  for (const [providerId, provider] of Object.entries(data)) {
    providers.push({
      id: providerId,
      name: provider.name,
      doc: provider.doc,
      modelCount: Object.keys(provider.models).length,
    });

    for (const [modelId, model] of Object.entries(provider.models)) {
      models.push({
        ...model,
        id: modelId,
        providerId,
        providerName: provider.name,
        providerLogo: `https://models.dev/logos/${providerId}.svg`,
      });
    }
  }

  return { providers, models };
}
```

### Filter Utilities

```typescript
// lib/filters.ts

export type Capability =
  | 'reasoning'
  | 'tool_call'
  | 'vision'
  | 'audio'
  | 'structured_output'
  | 'open_weights';

export function filterByCapability(models: FlatModel[], capability: Capability): FlatModel[] {
  switch (capability) {
    case 'vision':
      return models.filter(m => m.modalities.input.includes('image'));
    case 'audio':
      return models.filter(m =>
        m.modalities.input.includes('audio') || m.modalities.output.includes('audio')
      );
    case 'reasoning':
      return models.filter(m => m.reasoning);
    case 'tool_call':
      return models.filter(m => m.tool_call);
    case 'structured_output':
      return models.filter(m => m.structured_output);
    case 'open_weights':
      return models.filter(m => m.open_weights);
    default:
      return models;
  }
}

export function filterByProvider(models: FlatModel[], providerId: string): FlatModel[] {
  return models.filter(m => m.providerId === providerId);
}

export function filterByPriceRange(
  models: FlatModel[],
  maxInputPrice: number
): FlatModel[] {
  return models.filter(m => m.cost && m.cost.input <= maxInputPrice);
}

export function sortByPrice(models: FlatModel[], ascending = true): FlatModel[] {
  return [...models].sort((a, b) => {
    const priceA = a.cost?.input ?? Infinity;
    const priceB = b.cost?.input ?? Infinity;
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

export function sortByContextWindow(models: FlatModel[], ascending = false): FlatModel[] {
  return [...models].sort((a, b) => {
    const ctxA = a.limit?.context ?? 0;
    const ctxB = b.limit?.context ?? 0;
    return ascending ? ctxA - ctxB : ctxB - ctxA;
  });
}
```

### Formatting Utilities

```typescript
// lib/formatters.ts

export function formatPrice(pricePerMillion: number): string {
  if (pricePerMillion === 0) return "Free";
  if (pricePerMillion < 0.01) return `$${pricePerMillion.toFixed(4)}/M`;
  if (pricePerMillion < 1) return `$${pricePerMillion.toFixed(2)}/M`;
  return `$${pricePerMillion.toFixed(2)}/M`;
}

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}

export function formatKnowledgeCutoff(date?: string): string {
  if (!date) return "Unknown";
  return date; // Already in YYYY-MM format
}

export function getPricingTier(inputPrice?: number): 'free' | 'budget' | 'standard' | 'premium' {
  if (!inputPrice || inputPrice === 0) return 'free';
  if (inputPrice < 1) return 'budget';
  if (inputPrice < 10) return 'standard';
  return 'premium';
}
```

---

## Component Designs

### ModelListItem

```typescript
// components/ModelListItem.tsx
import { List, Icon, Color } from "@raycast/api";
import { FlatModel } from "../lib/types";
import { formatPrice, formatContextWindow, getPricingTier } from "../lib/formatters";

interface Props {
  model: FlatModel;
  showProvider?: boolean;
}

export function ModelListItem({ model, showProvider = true }: Props) {
  const accessories: List.Item.Accessory[] = [];

  if (showProvider) {
    accessories.push({ text: model.providerName });
  }

  if (model.limit?.context) {
    accessories.push({
      text: formatContextWindow(model.limit.context),
      tooltip: "Context window"
    });
  }

  if (model.cost?.input !== undefined) {
    accessories.push({
      text: formatPrice(model.cost.input),
      tooltip: "Input price per million tokens"
    });
  }

  // Capability indicators
  const capabilities: List.Item.Accessory[] = [];
  if (model.reasoning) {
    capabilities.push({ icon: Icon.LightBulb, tooltip: "Reasoning" });
  }
  if (model.modalities.input.includes('image')) {
    capabilities.push({ icon: Icon.Image, tooltip: "Vision" });
  }
  if (model.tool_call) {
    capabilities.push({ icon: Icon.Hammer, tooltip: "Tool calling" });
  }

  return (
    <List.Item
      title={model.name}
      subtitle={model.family}
      icon={{ source: model.providerLogo, fallback: Icon.Globe }}
      accessories={[...capabilities, ...accessories]}
      keywords={[model.providerId, model.providerName, model.family ?? ""]}
      actions={<ModelActions model={model} />}
    />
  );
}
```

### ModelDetail

```typescript
// components/ModelDetail.tsx
import { Detail } from "@raycast/api";
import { FlatModel } from "../lib/types";

export function ModelDetail({ model }: { model: FlatModel }) {
  const markdown = `
# ${model.name}

${model.status ? `**Status**: ${model.status}` : ""}

## Capabilities
${model.reasoning ? "- Reasoning" : ""}
${model.tool_call ? "- Tool Calling" : ""}
${model.structured_output ? "- Structured Output" : ""}
${model.modalities.input.includes('image') ? "- Vision" : ""}
${model.modalities.input.includes('audio') ? "- Audio Input" : ""}
${model.modalities.output.includes('audio') ? "- Audio Output" : ""}

## Modalities
**Input**: ${model.modalities.input.join(", ")}
**Output**: ${model.modalities.output.join(", ")}
`;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Provider" text={model.providerName} />

          {model.limit?.context && (
            <Detail.Metadata.Label
              title="Context Window"
              text={formatContextWindow(model.limit.context)}
            />
          )}

          {model.cost && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label
                title="Input Price"
                text={formatPrice(model.cost.input)}
              />
              <Detail.Metadata.Label
                title="Output Price"
                text={formatPrice(model.cost.output)}
              />
              {model.cost.cache_read && (
                <Detail.Metadata.Label
                  title="Cache Read"
                  text={formatPrice(model.cost.cache_read)}
                />
              )}
            </>
          )}

          {model.knowledge && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label
                title="Knowledge Cutoff"
                text={model.knowledge}
              />
            </>
          )}

          {model.open_weights && (
            <Detail.Metadata.TagList title="Attributes">
              <Detail.Metadata.TagList.Item text="Open Weights" color={Color.Green} />
            </Detail.Metadata.TagList>
          )}
        </Detail.Metadata>
      }
    />
  );
}
```

---

## Actions

Each model list item should have these actions:

1. **View Details** (default) - Push to detail view
2. **Copy Model ID** - Copy the model ID to clipboard
3. **Copy as JSON** - Copy full model info as JSON
4. **Open Provider Docs** - Open provider documentation in browser
5. **Add to Comparison** - Add model to comparison selection (for compare command)

---

## Caching Strategy

Using Raycast's `useFetch` with stale-while-revalidate:

```typescript
export function useModelsData() {
  return useFetch<TransformedData>(API_URL, {
    // Show cached data immediately while revalidating
    keepPreviousData: true,

    // Transform the response
    parseResponse: async (response) => {
      const data = await response.json();
      return transformApiResponse(data);
    },
  });
}
```

The `useFetch` hook automatically:
- Persists data between command invocations
- Returns cached data first (stale)
- Revalidates in the background
- Updates UI when fresh data arrives

---

## Implementation Phases

### Phase 1: Foundation
- Set up types and API layer
- Implement `useModelsData` hook
- Create basic `search-models` command with list view
- Basic formatting utilities

### Phase 2: Core Commands
- `browse-providers` command
- `find-by-capability` command
- `ModelDetail` component
- Provider logos integration

### Phase 3: Advanced Features
- `compare-models` command with multi-select
- `pricing-explorer` command
- Sorting and advanced filtering
- Copy actions (JSON, markdown)

### Phase 4: Polish
- Empty states and error handling
- Loading states
- Keyboard shortcuts
- Final UI refinements

---

## package.json Commands Configuration

```json
{
  "commands": [
    {
      "name": "search-models",
      "title": "Search Models",
      "subtitle": "models.dev",
      "description": "Search across all AI models",
      "mode": "view"
    },
    {
      "name": "browse-providers",
      "title": "Browse Providers",
      "subtitle": "models.dev",
      "description": "Explore AI providers and their offerings",
      "mode": "view"
    },
    {
      "name": "find-by-capability",
      "title": "Find by Capability",
      "subtitle": "models.dev",
      "description": "Find models by their capabilities",
      "mode": "view"
    },
    {
      "name": "compare-models",
      "title": "Compare Models",
      "subtitle": "models.dev",
      "description": "Compare models side-by-side",
      "mode": "view"
    },
    {
      "name": "pricing-explorer",
      "title": "Pricing Explorer",
      "subtitle": "models.dev",
      "description": "Compare model pricing",
      "mode": "view"
    }
  ]
}
```

---

## Success Metrics

1. **Speed**: First contentful paint < 200ms (cached data)
2. **Completeness**: All models from API displayed correctly
3. **Usability**: Users can find desired model in < 3 actions
4. **Reliability**: Graceful handling of API failures with cached fallback
