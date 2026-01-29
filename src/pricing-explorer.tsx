import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ModelDetail } from "./components";
import { Model } from "./lib/types";
import { formatPrice, estimateCost } from "./lib/formatters";
import { getCapabilityAccessories } from "./lib/accessories";

type PriceFilter = "all" | "free" | "under-1" | "under-5" | "under-15";

const PRICE_FILTERS: { id: PriceFilter; label: string; maxPrice?: number }[] = [
  { id: "all", label: "All Prices" },
  { id: "free", label: "Free", maxPrice: 0 },
  { id: "under-1", label: "Under $1/M output", maxPrice: 1 },
  { id: "under-5", label: "Under $5/M output", maxPrice: 5 },
  { id: "under-15", label: "Under $15/M output", maxPrice: 15 },
];

export default function PricingExplorer() {
  const { data, isLoading } = useModelsData();
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];

    // Only include models with output pricing
    let models = data.models.filter((m) => m.cost?.output !== undefined);

    // Apply price filter based on output price
    const filter = PRICE_FILTERS.find((f) => f.id === priceFilter);
    if (filter?.maxPrice !== undefined) {
      if (filter.maxPrice === 0) {
        models = models.filter((m) => m.cost?.output === 0);
      } else {
        models = models.filter((m) => m.cost && m.cost.output <= filter.maxPrice);
      }
    }

    // Sort by output price (ascending - cheapest first)
    models = [...models].sort((a, b) => {
      const priceA = a.cost?.output ?? Infinity;
      const priceB = b.cost?.output ?? Infinity;
      return priceA - priceB;
    });

    return models;
  }, [data?.models, priceFilter]);

  // Group by output pricing tier for visual organization
  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {
      free: [],
      budget: [],
      standard: [],
      premium: [],
    };

    for (const model of filteredModels) {
      const outputPrice = model.cost?.output;
      let tier: string;
      if (outputPrice === undefined || outputPrice === 0) tier = "free";
      else if (outputPrice < 1) tier = "budget";
      else if (outputPrice < 10) tier = "standard";
      else tier = "premium";
      groups[tier].push(model);
    }

    return groups;
  }, [filteredModels]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search models by price..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by Price"
          value={priceFilter}
          onChange={(value) => setPriceFilter(value as PriceFilter)}
        >
          {PRICE_FILTERS.map((filter) => (
            <List.Dropdown.Item key={filter.id} title={filter.label} value={filter.id} />
          ))}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        title="No Models Found"
        description="No models match the selected price filter"
        icon={Icon.MagnifyingGlass}
      />

      {groupedModels.free.length > 0 && (
        <List.Section title="Free Output" subtitle={`${groupedModels.free.length} models`}>
          {groupedModels.free.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}

      {groupedModels.budget.length > 0 && (
        <List.Section title="Budget (< $1/M output)" subtitle={`${groupedModels.budget.length} models`}>
          {groupedModels.budget.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}

      {groupedModels.standard.length > 0 && (
        <List.Section title="Standard ($1-10/M output)" subtitle={`${groupedModels.standard.length} models`}>
          {groupedModels.standard.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}

      {groupedModels.premium.length > 0 && (
        <List.Section title="Premium (> $10/M output)" subtitle={`${groupedModels.premium.length} models`}>
          {groupedModels.premium.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function PricingListItem({ model }: { model: Model }) {
  const accessories: List.Item.Accessory[] = [
    // Capability icons first
    ...getCapabilityAccessories(model),
    {
      text: formatPrice(model.cost?.input),
      tooltip: "Input price",
    },
    {
      text: formatPrice(model.cost?.output),
      tooltip: "Output price",
    },
  ];

  return (
    <List.Item
      title={model.name}
      subtitle={model.providerName}
      icon={{ source: model.providerLogo, fallback: Icon.Globe }}
      accessories={accessories}
      keywords={[model.providerId, model.providerName, model.family ?? ""]}
      actions={
        <ActionPanel>
          <Action.Push title="View Details" icon={Icon.Eye} target={<ModelDetail model={model} />} />
          <Action.CopyToClipboard
            title="Copy Model ID"
            content={model.id}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <ActionPanel.Section title="Cost Estimates">
            <Action.CopyToClipboard
              title="Copy 1M Token Cost"
              content={`Input: ${formatPrice(model.cost?.input)}, Output: ${formatPrice(model.cost?.output)}`}
            />
            {model.cost?.input !== undefined && (
              <Action.CopyToClipboard
                title="Copy 100K Token Estimate"
                content={`100K tokens: Input ${estimateCost(100_000, model.cost.input)}, Output ${estimateCost(100_000, model.cost?.output ?? 0)}`}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
