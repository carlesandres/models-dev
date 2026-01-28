import { List, Icon } from "@raycast/api";
import { Model } from "../lib/types";
import { formatPrice, formatContextWindow } from "../lib/formatters";
import { ModelActions } from "./ModelActions";
import { CAPABILITIES, STATUS_COLORS } from "../lib/constants";

interface ModelListItemProps {
  model: Model;
  showProvider?: boolean;
  onAddToComparison?: (model: Model) => void;
}

export function ModelListItem({ model, showProvider = true, onAddToComparison }: ModelListItemProps) {
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
  if (model.reasoning) {
    accessories.push({
      icon: { source: Icon.LightBulb, tintColor: CAPABILITIES.reasoning.color },
      tooltip: "Reasoning",
    });
  }
  if (model.modalities.input.includes("image")) {
    accessories.push({
      icon: { source: Icon.Image, tintColor: CAPABILITIES.vision.color },
      tooltip: "Vision",
    });
  }
  if (model.modalities.input.includes("audio") || model.modalities.output.includes("audio")) {
    accessories.push({
      icon: { source: Icon.Microphone, tintColor: CAPABILITIES.audio.color },
      tooltip: "Audio",
    });
  }
  if (model.tool_call) {
    accessories.push({
      icon: { source: Icon.Hammer, tintColor: CAPABILITIES.tool_call.color },
      tooltip: "Tool Calling",
    });
  }

  // Context window
  if (model.limit?.context) {
    accessories.push({
      text: formatContextWindow(model.limit.context),
      tooltip: "Context window",
    });
  }

  // Price
  if (model.cost?.input !== undefined) {
    accessories.push({
      text: formatPrice(model.cost.input),
      tooltip: "Input price per million tokens",
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
      subtitle={showProvider ? model.providerName : model.family}
      icon={{ source: model.providerLogo, fallback: Icon.Globe }}
      accessories={accessories}
      keywords={keywords}
      actions={<ModelActions model={model} onAddToComparison={onAddToComparison} />}
    />
  );
}
