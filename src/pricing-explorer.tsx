import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ModelDetail } from "./components";
import { Model } from "./lib/types";
import { formatPrice, estimateCost } from "./lib/formatters";
import { getCapabilityAccessories } from "./lib/accessories";

type PriceFilter =
  | "all"
  | "free"
  | "non-free"
  | "under-1"
  | "under-2"
  | "under-5"
  | "under-15"
  | "over-1"
  | "over-2"
  | "over-5"
  | "over-15";

const PRICE_FILTERS: { id: PriceFilter; label: string }[] = [
  { id: "all", label: "All Prices" },
  { id: "free", label: "Free output" },
  { id: "non-free", label: "Paid output" },
  { id: "under-1", label: "Under $1/M output" },
  { id: "under-2", label: "Under $2/M output" },
  { id: "under-5", label: "Under $5/M output" },
  { id: "under-15", label: "Under $15/M output" },
  { id: "over-1", label: "Over $1/M output" },
  { id: "over-2", label: "Over $2/M output" },
  { id: "over-5", label: "Over $5/M output" },
  { id: "over-15", label: "Over $15/M output" },
];

export default function PricingExplorer() {
  const { data, isLoading } = useModelsData();
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [searchText, setSearchText] = useState("");

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];

    // Only include models with output pricing
    let models = data.models.filter((m) => m.cost?.output !== undefined);

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.id.toLowerCase().includes(search) ||
          m.providerName.toLowerCase().includes(search),
      );
    }

    // Apply price filter based on output price
    switch (priceFilter) {
      case "free":
        models = models.filter((m) => m.cost?.output === 0);
        break;
      case "non-free":
        models = models.filter((m) => m.cost?.output !== undefined && m.cost.output > 0);
        break;
      case "under-1":
        models = models.filter((m) => m.cost && m.cost.output <= 1);
        break;
      case "under-2":
        models = models.filter((m) => m.cost && m.cost.output <= 2);
        break;
      case "under-5":
        models = models.filter((m) => m.cost && m.cost.output <= 5);
        break;
      case "under-15":
        models = models.filter((m) => m.cost && m.cost.output <= 15);
        break;
      case "over-1":
        models = models.filter((m) => m.cost && m.cost.output > 1);
        break;
      case "over-2":
        models = models.filter((m) => m.cost && m.cost.output > 2);
        break;
      case "over-5":
        models = models.filter((m) => m.cost && m.cost.output > 5);
        break;
      case "over-15":
        models = models.filter((m) => m.cost && m.cost.output > 15);
        break;
    }

    // Sort by output price (ascending - cheapest first)
    models = [...models].sort((a, b) => {
      const priceA = a.cost?.output ?? Infinity;
      const priceB = b.cost?.output ?? Infinity;
      return priceA - priceB;
    });

    return models;
  }, [data?.models, priceFilter, searchText]);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
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

      <List.Section title={`${filteredModels.length} models`}>
        {filteredModels.map((model) => (
          <PricingListItem key={`${model.providerId}-${model.id}`} model={model} />
        ))}
      </List.Section>
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
