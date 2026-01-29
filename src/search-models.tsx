import { List, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ModelListItem } from "./components";
import { Capability, Model } from "./lib/types";
import { filterByCapability, sortByProviderThenName, filterOutDeprecated } from "./lib/filters";
import { ALL_CAPABILITIES, CAPABILITIES } from "./lib/constants";

export default function SearchModels() {
  const { data, isLoading } = useModelsData();
  const [capability, setCapability] = useState<Capability | "all">("all");
  const [searchText, setSearchText] = useState("");

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];

    let models: Model[] = data.models;

    // Filter out deprecated models
    models = filterOutDeprecated(models);

    // Filter by capability
    if (capability !== "all") {
      models = filterByCapability(models, capability);
    }

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.id.toLowerCase().includes(search) ||
          m.providerName.toLowerCase().includes(search) ||
          m.providerId.toLowerCase().includes(search) ||
          (m.family && m.family.toLowerCase().includes(search)),
      );
    }

    // Sort by provider, then model name
    models = sortByProviderThenName(models);

    return models;
  }, [data?.models, capability, searchText]);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search models by name, provider, or capability..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by Capability"
          value={capability}
          onChange={(value) => setCapability(value as Capability | "all")}
        >
          <List.Dropdown.Item title="All Capabilities" value="all" icon={Icon.List} />
          <List.Dropdown.Section title="Capabilities">
            {ALL_CAPABILITIES.map((cap) => (
              <List.Dropdown.Item key={cap} title={CAPABILITIES[cap].label} value={cap} icon={CAPABILITIES[cap].icon} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      <List.EmptyView
        title="No Models Found"
        description={
          capability !== "all"
            ? `No models found with ${CAPABILITIES[capability].label} capability`
            : "No models match your search"
        }
        icon={Icon.MagnifyingGlass}
      />
      <List.Section title={`${filteredModels.length} models`}>
        {filteredModels.map((model) => (
          <ModelListItem key={`${model.providerId}-${model.id}`} model={model} />
        ))}
      </List.Section>
    </List>
  );
}
