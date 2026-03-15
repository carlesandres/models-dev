import { List, Icon, Action } from "@raycast/api";
import type { ActionPanel } from "@raycast/api";
import { useMemo, memo } from "react";
import { Model } from "../lib/types";
import { formatPriceFixed } from "../lib/formatters";
import { ModelActions } from "./ModelActions";
import { STATUS_COLORS } from "../lib/constants";
import { getCapabilityAccessories } from "../lib/accessories";

type ActionPanelChildren = Parameters<typeof ActionPanel>[0]["children"];

interface ModelListItemProps {
  model: Model;
  onAddToComparison?: (model: Model) => void;
  canAddToComparison?: boolean;
  primaryAction?: ActionPanelChildren;
  extraActions?: ActionPanelChildren;
}

export const ModelListItem = memo(function ModelListItem({
  model,
  onAddToComparison,
  canAddToComparison,
  primaryAction,
  extraActions,
}: ModelListItemProps) {
  const accessories = useMemo(() => {
    const acc: List.Item.Accessory[] = [];

    // Status indicator (alpha, beta, deprecated)
    if (model.status) {
      acc.push({
        tag: {
          value: model.status,
          color: STATUS_COLORS[model.status],
        },
      });
    }

    // Capability icons
    acc.push(...getCapabilityAccessories(model));

    // Pricing (input / output)
    if (model.cost?.input !== undefined) {
      acc.push({
        text: formatPriceFixed(model.cost.input),
        tooltip: "Input price per 1M tokens",
      });
    }
    if (model.cost?.output !== undefined) {
      acc.push({
        text: formatPriceFixed(model.cost.output),
        tooltip: "Output price per 1M tokens",
      });
    }

    return acc;
  }, [model.status, model.cost?.input, model.cost?.output]);

  // Build keywords for search
  const keywords = useMemo(
    () =>
      [
        model.providerId,
        model.providerName,
        model.family ?? "",
        `${model.name} ${model.providerName}`,
        model.reasoning ? "reasoning" : "",
        model.tool_call ? "tool calling function" : "",
        model.modalities.input.includes("image") ? "vision image" : "",
        model.modalities.input.includes("audio") ? "audio" : "",
        model.modalities.input.includes("video") ? "video" : "",
        model.modalities.input.includes("pdf") ? "pdf" : "",
        model.open_weights ? "open weights" : "",
      ].filter(Boolean),
    [
      model.providerId,
      model.providerName,
      model.family,
      model.name,
      model.reasoning,
      model.tool_call,
      model.modalities.input,
      model.open_weights,
    ],
  );

  const defaultPrimaryAction = useMemo(() => {
    if (!onAddToComparison) return undefined;

    if (canAddToComparison === false) {
      return <Action.CopyToClipboard title="Copy Model ID" content={model.id} />;
    }

    return <Action title="Add to Comparison" icon={Icon.PlusCircle} onAction={() => onAddToComparison(model)} />;
  }, [onAddToComparison, canAddToComparison, model.id]);

  const resolvedPrimaryAction = primaryAction ?? defaultPrimaryAction;

  return (
    <List.Item
      title={model.name}
      subtitle={model.providerName}
      icon={{ source: model.providerLogo, fallback: Icon.Globe }}
      accessories={accessories}
      keywords={keywords}
      actions={
        <ModelActions
          model={model}
          onAddToComparison={onAddToComparison}
          canAddToComparison={canAddToComparison}
          primaryAction={resolvedPrimaryAction}
          extraActions={extraActions}
        />
      }
    />
  );
});
