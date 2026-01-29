import { List, Icon, useNavigation } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { ProviderListItem, ModelListItem } from "./components";
import { filterByProvider } from "./lib/filters";

function ProviderModels({ providerId, providerName }: { providerId: string; providerName: string }) {
  const { data, isLoading } = useModelsData();
  const [searchText, setSearchText] = useState("");

  const models = useMemo(() => {
    let filtered = data?.models ? filterByProvider(data.models, providerId) : [];
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
  }, [data?.models, providerId, searchText]);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
      navigationTitle={providerName}
      searchBarPlaceholder={`Search ${providerName} models...`}
    >
      <List.EmptyView title="No Models" description={`No models found for ${providerName}`} icon={Icon.XMarkCircle} />
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
