import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ModelDetail } from "./components";
import { Model } from "./lib/types";
import { sortByPrice, filterByMaxPrice } from "./lib/filters";
import { formatPrice, formatContextWindow, getPricingTier, estimateCost } from "./lib/formatters";
import { PRICING_TIER_COLORS } from "./lib/constants";

type PriceFilter = "all" | "free" | "under-1" | "under-5" | "under-15";

const PRICE_FILTERS: { id: PriceFilter; label: string; maxPrice?: number }[] = [
  { id: "all", label: "All Prices" },
  { id: "free", label: "Free", maxPrice: 0 },
  { id: "under-1", label: "Under $1/M", maxPrice: 1 },
  { id: "under-5", label: "Under $5/M", maxPrice: 5 },
  { id: "under-15", label: "Under $15/M", maxPrice: 15 },
];

export default function PricingExplorer() {
  const { data, isLoading } = useModelsData();
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];

    // Only include models with pricing
    let models = data.models.filter((m) => m.cost?.input !== undefined);

    // Apply price filter
    const filter = PRICE_FILTERS.find((f) => f.id === priceFilter);
    if (filter?.maxPrice !== undefined) {
      if (filter.maxPrice === 0) {
        models = models.filter((m) => m.cost?.input === 0);
      } else {
        models = filterByMaxPrice(models, filter.maxPrice);
      }
    }

    // Sort by price (ascending - cheapest first)
    models = sortByPrice(models, true);

    return models;
  }, [data?.models, priceFilter]);

  // Group by pricing tier for visual organization
  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {
      free: [],
      budget: [],
      standard: [],
      premium: [],
    };

    for (const model of filteredModels) {
      const tier = getPricingTier(model.cost?.input);
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
        <List.Section title="Free" subtitle={`${groupedModels.free.length} models`}>
          {groupedModels.free.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}

      {groupedModels.budget.length > 0 && (
        <List.Section title="Budget (< $1/M)" subtitle={`${groupedModels.budget.length} models`}>
          {groupedModels.budget.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}

      {groupedModels.standard.length > 0 && (
        <List.Section title="Standard ($1-10/M)" subtitle={`${groupedModels.standard.length} models`}>
          {groupedModels.standard.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}

      {groupedModels.premium.length > 0 && (
        <List.Section title="Premium (> $10/M)" subtitle={`${groupedModels.premium.length} models`}>
          {groupedModels.premium.map((model) => (
            <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function PricingListItem({ model }: { model: Model }) {
  const tier = getPricingTier(model.cost?.input);
  const tierColor = PRICING_TIER_COLORS[tier];

  const accessories: List.Item.Accessory[] = [
    {
      tag: { value: formatPrice(model.cost?.input), color: tierColor },
      tooltip: "Input price",
    },
    {
      text: formatPrice(model.cost?.output),
      tooltip: "Output price",
    },
  ];

  if (model.cost?.cache_read !== undefined) {
    accessories.push({
      text: `Cache: ${formatPrice(model.cost.cache_read)}`,
      tooltip: "Cache read price",
    });
  }

  if (model.limit?.context) {
    accessories.push({
      text: formatContextWindow(model.limit.context),
      tooltip: "Context window",
    });
  }

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
