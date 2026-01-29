import { List, Color, Detail, Icon, ActionPanel, Action, useNavigation, showToast, Toast } from "@raycast/api";
import { useState, useMemo } from "react";
import { useModelsData } from "./hooks/useModelsData";
import { Model } from "./lib/types";
import { formatPrice, formatContextWindow } from "./lib/formatters";

function ComparisonView({ models }: { models: Model[] }) {
  // Build comparison markdown table
  const headers = ["", ...models.map((m) => m.name)];
  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

  const rows = [
    ["**Provider**", ...models.map((m) => m.providerName)],
    ["**Context**", ...models.map((m) => formatContextWindow(m.limit?.context))],
    ["**Input Price**", ...models.map((m) => formatPrice(m.cost?.input))],
    ["**Output Price**", ...models.map((m) => formatPrice(m.cost?.output))],
    ["**Reasoning**", ...models.map((m) => (m.reasoning ? "Yes" : "No"))],
    ["**Tool Calling**", ...models.map((m) => (m.tool_call ? "Yes" : "No"))],
    ["**Vision**", ...models.map((m) => (m.modalities.input.includes("image") ? "Yes" : "No"))],
    [
      "**Audio**",
      ...models.map((m) =>
        m.modalities.input.includes("audio") || m.modalities.output.includes("audio") ? "Yes" : "No",
      ),
    ],
    ["**Structured Output**", ...models.map((m) => (m.structured_output ? "Yes" : "No"))],
    ["**Open Weights**", ...models.map((m) => (m.open_weights ? "Yes" : "No"))],
    ["**Knowledge Cutoff**", ...models.map((m) => m.knowledge ?? "Unknown")],
  ];

  const tableRows = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  const markdown = `# Model Comparison\n\n${headerRow}\n${separatorRow}\n${tableRows}`;

  // Build markdown for copy
  const copyMarkdown = `# Model Comparison\n\n${headerRow}\n${separatorRow}\n${tableRows}`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Model Comparison"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy as Markdown"
            content={copyMarkdown}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function CompareModels() {
  const { data, isLoading } = useModelsData();
  const { push } = useNavigation();
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const [searchText, setSearchText] = useState("");

  const selectedIds = useMemo(() => new Set(selectedModels.map((m) => `${m.providerId}-${m.id}`)), [selectedModels]);

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];
    let models = data.models.filter((m) => !selectedIds.has(`${m.providerId}-${m.id}`));
    if (searchText) {
      const search = searchText.toLowerCase();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.id.toLowerCase().includes(search) ||
          m.providerName.toLowerCase().includes(search) ||
          (m.family && m.family.toLowerCase().includes(search)),
      );
    }
    return models;
  }, [data?.models, selectedIds, searchText]);

  const handleToggleModel = (model: Model) => {
    const modelKey = `${model.providerId}-${model.id}`;
    if (selectedIds.has(modelKey)) {
      setSelectedModels(selectedModels.filter((m) => `${m.providerId}-${m.id}` !== modelKey));
    } else {
      if (selectedModels.length >= 3) {
        showToast({
          style: Toast.Style.Failure,
          title: "Maximum 3 models",
          message: "Remove a model before adding another",
        });
        return;
      }
      setSelectedModels([...selectedModels, model]);
    }
  };

  const handleCompare = () => {
    if (selectedModels.length < 2) {
      showToast({
        style: Toast.Style.Failure,
        title: "Select at least 2 models",
        message: "Choose 2-4 models to compare",
      });
      return;
    }
    push(<ComparisonView models={selectedModels} />);
  };

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search models to compare..."
      searchBarAccessory={
        <List.Dropdown
          tooltip={`${selectedModels.length} selected`}
          value="info"
          onChange={(value) => {
            if (value !== "info") {
              setSelectedModels(selectedModels.filter((m) => `${m.providerId}-${m.id}` !== value));
            }
          }}
        >
          <List.Dropdown.Item title={`${selectedModels.length}/3 models selected`} value="info" />
          {selectedModels.map((m) => (
            <List.Dropdown.Item
              key={`${m.providerId}-${m.id}`}
              title={`${m.name} (${m.providerName})`}
              value={`${m.providerId}-${m.id}`}
              icon={Icon.XMarkCircle}
            />
          ))}
        </List.Dropdown>
      }
    >
      {selectedModels.length > 0 && (
        <List.Section title={`Selected (${selectedModels.length}/3)`}>
          {selectedModels.map((model) => (
            <List.Item
              key={`selected-${model.providerId}-${model.id}`}
              title={model.name}
              subtitle={model.providerName}
              icon={{ source: model.providerLogo, fallback: Icon.Globe }}
              accessories={[{ icon: { source: Icon.CheckCircle, tintColor: Color.Green }, tooltip: "Selected" }]}
              actions={
                <ActionPanel>
                  <Action
                    title="Remove from Comparison"
                    icon={Icon.MinusCircle}
                    onAction={() => handleToggleModel(model)}
                  />
                  {selectedModels.length >= 2 && (
                    <Action
                      title="Compare Selected Models"
                      icon={Icon.Switch}
                      onAction={handleCompare}
                      shortcut={{ modifiers: ["cmd"], key: "return" }}
                    />
                  )}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      <List.Section title={`${filteredModels.length} models`}>
        {filteredModels.map((model) => (
          <List.Item
            key={`${model.providerId}-${model.id}`}
            title={model.name}
            subtitle={model.providerName}
            icon={{ source: model.providerLogo, fallback: Icon.Globe }}
            accessories={
              [
                model.limit?.context
                  ? { text: formatContextWindow(model.limit.context), tooltip: "Context" }
                  : undefined,
                model.cost?.input !== undefined
                  ? { text: formatPrice(model.cost.input), tooltip: "Input price" }
                  : undefined,
              ].filter(Boolean) as List.Item.Accessory[]
            }
            keywords={[model.providerId, model.providerName, model.family ?? ""]}
            actions={
              <ActionPanel>
                <Action title="Add to Comparison" icon={Icon.PlusCircle} onAction={() => handleToggleModel(model)} />
                {selectedModels.length >= 2 && (
                  <Action
                    title="Compare Selected Models"
                    icon={Icon.Switch}
                    onAction={handleCompare}
                    shortcut={{ modifiers: ["cmd"], key: "return" }}
                  />
                )}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
