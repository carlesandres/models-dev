# Models.dev

Browse AI model specifications, pricing, and capabilities from [models.dev](https://models.dev)—a community-maintained database of AI models across providers.

## Commands

### Search Models
Search all models by name, provider, or family. Filter by capability: reasoning, vision, audio, video, PDF, tool calling, structured output, or open weights.

### Browse Providers
List all providers and drill into their model offerings. View model counts and access provider documentation.

### Find by Capability
Select a capability category to see all models that support it. Categories include reasoning, tool calling, vision, audio, video, PDF, structured output, and open weights.

### Compare Models
Select up to three models for side-by-side comparison. View pricing, context windows, and capabilities in a table. Export comparisons as markdown.

### Pricing Explorer
Filter models by price tier (free, under $1/M, under $5/M, etc.) and sort by cost. Estimate costs for different token counts.

## Model Information

Each model includes:

- **Pricing** — Input, output, cache read/write, and reasoning costs (per million tokens)
- **Limits** — Context window, max input tokens, max output tokens
- **Capabilities** — Reasoning, tool calling, vision, audio, video, PDF, structured output
- **Metadata** — Knowledge cutoff, release date, open weights, status (alpha/beta/deprecated)

Actions available: copy model ID, copy provider/model ID, export as JSON, open on models.dev.

## Data Source

Data is fetched from the [models.dev API](https://models.dev/api.json).
