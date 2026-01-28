import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { Provider, Model } from "../lib/types";
import { filterByProvider } from "../lib/filters";

interface ProviderListItemProps {
  provider: Provider;
  models: Model[];
  onSelect: (providerId: string) => void;
}

export function ProviderListItem({ provider, models, onSelect }: ProviderListItemProps) {
  const providerModels = filterByProvider(models, provider.id);

  // Count capabilities
  const hasReasoning = providerModels.some((m) => m.reasoning);
  const hasVision = providerModels.some((m) => m.modalities.input.includes("image"));
  const hasAudio = providerModels.some(
    (m) => m.modalities.input.includes("audio") || m.modalities.output.includes("audio"),
  );
  const hasToolCall = providerModels.some((m) => m.tool_call);

  const accessories: List.Item.Accessory[] = [];

  // Capability indicators
  if (hasReasoning) {
    accessories.push({ icon: Icon.LightBulb, tooltip: "Has reasoning models" });
  }
  if (hasVision) {
    accessories.push({ icon: Icon.Image, tooltip: "Has vision models" });
  }
  if (hasAudio) {
    accessories.push({ icon: Icon.Microphone, tooltip: "Has audio models" });
  }
  if (hasToolCall) {
    accessories.push({ icon: Icon.Hammer, tooltip: "Has tool-calling models" });
  }

  // Model count
  accessories.push({
    text: `${provider.modelCount} model${provider.modelCount !== 1 ? "s" : ""}`,
  });

  return (
    <List.Item
      title={provider.name}
      icon={{ source: provider.logo, fallback: Icon.Globe }}
      accessories={accessories}
      keywords={[provider.id]}
      actions={
        <ActionPanel>
          <Action title="View Models" icon={Icon.List} onAction={() => onSelect(provider.id)} />
          <Action.OpenInBrowser
            title="Open Documentation"
            url={provider.doc}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.CopyToClipboard
            title="Copy Provider ID"
            content={provider.id}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}
