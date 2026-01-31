import { List, Icon, useNavigation } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ProviderListItem, ModelListSection } from "./components";
import { filterByCapability, filterByProvider, filterBySearchText } from "./lib/filters";
import { ALL_CAPABILITIES, CAPABILITIES } from "./lib/constants";
import { Capability } from "./lib/types";

function ProviderModels({ providerId, providerName }: { providerId: string; providerName: string }) {
  const { data, isLoading } = useModelsData();
  const [capability, setCapability] = useState<Capability | "all">("all");
  const [searchText, setSearchText] = useState("");

  const models = useMemo(() => {
    let filtered = data?.models ? filterByProvider(data.models, providerId) : [];
    if (capability !== "all") {
      filtered = filterByCapability(filtered, capability);
    }
    // Filter by search text
    filtered = filterBySearchText(filtered, searchText);
    return filtered;
  }, [data?.models, providerId, capability, searchText]);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      navigationTitle={providerName}
      searchBarPlaceholder={`Search ${providerName} models...`}
      onSearchTextChange={setSearchText}
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
      <ModelListSection models={models} title={`${models.length} models`} />
    </List>
  );
}

export default function BrowseProviders() {
  const { data, isLoading } = useModelsData();
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");

  const filteredProviders = useMemo(() => {
    if (!data?.providers) return [];
    if (!searchText.trim()) return data.providers;

    const query = searchText.toLowerCase().trim();
    return data.providers.filter(
      (provider) => provider.name.toLowerCase().includes(query) || provider.id.toLowerCase().includes(query),
    );
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
      searchBarPlaceholder="Search providers..."
      onSearchTextChange={setSearchText}
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
