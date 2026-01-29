import { List, Icon } from "@raycast/api";
import { Model } from "../lib/types";
import { formatPriceFixed } from "../lib/formatters";
import { ModelActions } from "./ModelActions";
import { STATUS_COLORS } from "../lib/constants";
import { getCapabilityAccessories } from "../lib/accessories";

interface ModelListItemProps {
  model: Model;
  onAddToComparison?: (model: Model) => void;
}

export function ModelListItem({ model, onAddToComparison }: ModelListItemProps) {
  const accessories: List.Item.Accessory[] = [];

  // Status indicator (alpha, beta, deprecated)
  if (model.status) {
    accessories.push({
      tag: {
        value: model.status,
        color: STATUS_COLORS[model.status],
      },
    });
  }

  // Capability icons
  accessories.push(...getCapabilityAccessories(model));

  // Pricing (input / output)
  if (model.cost?.input !== undefined) {
    accessories.push({
      text: formatPriceFixed(model.cost.input),
      tooltip: "Input price per 1M tokens",
    });
  }
  if (model.cost?.output !== undefined) {
    accessories.push({
      text: formatPriceFixed(model.cost.output),
      tooltip: "Output price per 1M tokens",
    });
  }

  // Build keywords for search
  const keywords = [
    model.providerId,
    model.providerName,
    model.family ?? "",
    model.reasoning ? "reasoning" : "",
    model.tool_call ? "tool calling function" : "",
    model.modalities.input.includes("image") ? "vision image" : "",
    model.modalities.input.includes("audio") ? "audio" : "",
    model.open_weights ? "open weights" : "",
  ].filter(Boolean);

  return (
    <List.Item
      title={model.name}
      subtitle={model.providerName}
      icon={{ source: model.providerLogo, fallback: Icon.Globe }}
      accessories={accessories}
      keywords={keywords}
      actions={<ModelActions model={model} onAddToComparison={onAddToComparison} />}
    />
  );
}
