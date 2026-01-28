import { Detail, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { Model } from "../lib/types";
import { formatPrice, formatContextWindow, formatModalities, formatKnowledgeCutoff } from "../lib/formatters";

interface ModelDetailProps {
  model: Model;
}

export function ModelDetail({ model }: ModelDetailProps) {
  const capabilities: string[] = [];
  if (model.reasoning) capabilities.push("Reasoning");
  if (model.tool_call) capabilities.push("Tool Calling");
  if (model.structured_output) capabilities.push("Structured Output");
  if (model.attachment) capabilities.push("Attachments");
  if (model.modalities.input.includes("image")) capabilities.push("Vision");
  if (model.modalities.input.includes("audio")) capabilities.push("Audio Input");
  if (model.modalities.output.includes("audio")) capabilities.push("Audio Output");
  if (model.modalities.input.includes("video")) capabilities.push("Video");
  if (model.modalities.input.includes("pdf")) capabilities.push("PDF");

  const markdown = `
# ${model.name}

${model.status ? `> **Status**: ${model.status.charAt(0).toUpperCase() + model.status.slice(1)}` : ""}

## Capabilities

${capabilities.length > 0 ? capabilities.map((c) => `- ${c}`).join("\n") : "- Text generation"}

## Modalities

**Input**: ${formatModalities(model.modalities.input)}

**Output**: ${formatModalities(model.modalities.output)}

${
  model.cost
    ? `
## Pricing

| Type | Price (per 1M tokens) |
|------|----------------------|
| Input | ${formatPrice(model.cost.input)} |
| Output | ${formatPrice(model.cost.output)} |${model.cost.cache_read !== undefined ? `\n| Cache Read | ${formatPrice(model.cost.cache_read)} |` : ""}${model.cost.cache_write !== undefined ? `\n| Cache Write | ${formatPrice(model.cost.cache_write)} |` : ""}${model.cost.reasoning !== undefined ? `\n| Reasoning | ${formatPrice(model.cost.reasoning)} |` : ""}
`
    : ""
}

${
  model.limit
    ? `
## Token Limits

| Type | Limit |
|------|-------|
| Context Window | ${formatContextWindow(model.limit.context)} |${model.limit.input !== undefined ? `\n| Max Input | ${formatContextWindow(model.limit.input)} |` : ""}${model.limit.output !== undefined ? `\n| Max Output | ${formatContextWindow(model.limit.output)} |` : ""}
`
    : ""
}
`;

  const modelJson = JSON.stringify(
    {
      id: model.id,
      name: model.name,
      provider: model.providerName,
      capabilities: {
        reasoning: model.reasoning,
        tool_call: model.tool_call,
        structured_output: model.structured_output,
      },
      modalities: model.modalities,
      cost: model.cost,
      limit: model.limit,
      knowledge: model.knowledge,
      open_weights: model.open_weights,
    },
    null,
    2,
  );

  return (
    <Detail
      markdown={markdown}
      navigationTitle={model.name}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Provider"
            text={model.providerName}
            icon={{ source: model.providerLogo, fallback: Icon.Globe }}
          />
          <Detail.Metadata.Label title="Model ID" text={model.id} />

          {model.family && <Detail.Metadata.Label title="Family" text={model.family} />}

          <Detail.Metadata.Separator />

          {model.limit?.context && (
            <Detail.Metadata.Label
              title="Context Window"
              text={formatContextWindow(model.limit.context)}
              icon={Icon.MemoryChip}
            />
          )}

          {model.knowledge && (
            <Detail.Metadata.Label
              title="Knowledge Cutoff"
              text={formatKnowledgeCutoff(model.knowledge)}
              icon={Icon.Calendar}
            />
          )}

          {model.release_date && <Detail.Metadata.Label title="Released" text={model.release_date} icon={Icon.Clock} />}

          <Detail.Metadata.Separator />

          <Detail.Metadata.TagList title="Features">
            {model.reasoning && <Detail.Metadata.TagList.Item text="Reasoning" color={Color.Yellow} />}
            {model.tool_call && <Detail.Metadata.TagList.Item text="Tools" color={Color.Blue} />}
            {model.structured_output && <Detail.Metadata.TagList.Item text="Structured" color={Color.Magenta} />}
            {model.modalities.input.includes("image") && (
              <Detail.Metadata.TagList.Item text="Vision" color={Color.Purple} />
            )}
            {(model.modalities.input.includes("audio") || model.modalities.output.includes("audio")) && (
              <Detail.Metadata.TagList.Item text="Audio" color={Color.Orange} />
            )}
            {model.open_weights && <Detail.Metadata.TagList.Item text="Open" color={Color.Green} />}
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Model ID"
            content={model.id}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy as JSON"
            content={modelJson}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action.OpenInBrowser
            title="Open Models.dev"
            url="https://models.dev"
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
        </ActionPanel>
      }
    />
  );
}
