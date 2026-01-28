import { List, Icon, useNavigation } from "@raycast/api";
import { useModelsData } from "./hooks/useModelsData";
import { ProviderListItem, ModelListItem } from "./components";
import { filterByProvider } from "./lib/filters";

function ProviderModels({ providerId, providerName }: { providerId: string; providerName: string }) {
  const { data, isLoading } = useModelsData();
  const models = data?.models ? filterByProvider(data.models, providerId) : [];

  return (
    <List
      isLoading={isLoading}
      navigationTitle={providerName}
      searchBarPlaceholder={`Search ${providerName} models...`}
    >
      <List.EmptyView title="No Models" description={`No models found for ${providerName}`} icon={Icon.XMarkCircle} />
      {models.map((model) => (
        <ModelListItem key={model.id} model={model} showProvider={false} />
      ))}
    </List>
  );
}

export default function BrowseProviders() {
  const { data, isLoading } = useModelsData();
  const { push } = useNavigation();

  const handleSelectProvider = (providerId: string) => {
    const provider = data?.providers.find((p) => p.id === providerId);
    if (provider) {
      push(<ProviderModels providerId={providerId} providerName={provider.name} />);
    }
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search providers...">
      <List.EmptyView
        title="No Providers Found"
        description="No providers match your search"
        icon={Icon.MagnifyingGlass}
      />
      {data?.providers.map((provider) => (
        <ProviderListItem key={provider.id} provider={provider} models={data.models} onSelect={handleSelectProvider} />
      ))}
    </List>
  );
}
