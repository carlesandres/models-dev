import { List, Icon, useNavigation } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ProviderListItem, ModelListItem } from "./components";
import { filterByCapability, filterByProvider } from "./lib/filters";
import { ALL_CAPABILITIES, CAPABILITIES } from "./lib/constants";
import { Capability } from "./lib/types";

function ProviderModels({ providerId, providerName }: { providerId: string; providerName: string }) {
  const { data, isLoading } = useModelsData();
  const [searchText, setSearchText] = useState("");
  const [capability, setCapability] = useState<Capability | "all">("all");

  const models = useMemo(() => {
    let filtered = data?.models ? filterByProvider(data.models, providerId) : [];
    if (capability !== "all") {
      filtered = filterByCapability(filtered, capability);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.id.toLowerCase().includes(search) ||
          (m.family && m.family.toLowerCase().includes(search)),
      );
    }
    return filtered;
  }, [data?.models, providerId, capability, searchText]);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
      navigationTitle={providerName}
      searchBarPlaceholder={`Search ${providerName} models...`}
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
        title="No Models"
        description={
          capability !== "all"
            ? `No ${providerName} models found with ${CAPABILITIES[capability].label} capability`
            : `No models found for ${providerName}`
        }
        icon={Icon.XMarkCircle}
      />
      <List.Section title={`${models.length} models`}>
        {models.map((model) => (
          <ModelListItem key={`${model.providerId}-${model.id}`} model={model} />
        ))}
      </List.Section>
    </List>
  );
}

export default function BrowseProviders() {
  const { data, isLoading } = useModelsData();
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");

  const filteredProviders = useMemo(() => {
    if (!data?.providers) return [];
    if (!searchText) return data.providers;
    const search = searchText.toLowerCase();
    return data.providers.filter((p) => p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search));
  }, [data?.providers, searchText]);

  const handleSelectProvider = (providerId: string) => {
    const provider = data?.providers.find((p) => p.id === providerId);
    if (provider) {
      push(<ProviderModels providerId={providerId} providerName={provider.name} />);
    }
  };

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search providers..."
    >
      <List.EmptyView
        title="No Providers Found"
        description="No providers match your search"
        icon={Icon.MagnifyingGlass}
      />
      <List.Section title={`${filteredProviders.length} providers`}>
        {filteredProviders.map((provider) => (
          <ProviderListItem
            key={provider.id}
            provider={provider}
            models={data?.models ?? []}
            onSelect={handleSelectProvider}
          />
        ))}
      </List.Section>
    </List>
  );
}
