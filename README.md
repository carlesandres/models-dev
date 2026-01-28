# Models.dev

Explore AI model specifications, pricing, and capabilities from [models.dev](https://models.dev) - a comprehensive open-source database of AI models.

## Commands

### Search Models
Search across all AI models by name, provider, or capability. Filter by capabilities like reasoning, vision, audio, tool calling, and more.

### Browse Providers
Explore AI providers (OpenAI, Anthropic, Google, etc.) and drill down into their model offerings.

### Find by Capability
Start from a capability (reasoning, vision, audio, etc.) and find all models that support it.

### Compare Models
Select 2-4 models to compare side-by-side. See pricing, context windows, capabilities, and more in a comparison table.

### Pricing Explorer
Compare model pricing across providers. Filter by price range and explore models organized by pricing tier (Free, Budget, Standard, Premium).

## Features

- Fast, cached access to model data using stale-while-revalidate strategy
- Provider logos for visual identification
- Detailed model information including:
  - Pricing (input/output/cache pricing)
  - Context window and token limits
  - Capabilities (reasoning, tool calling, vision, audio, etc.)
  - Knowledge cutoff dates
  - Open weights status
- Copy model IDs and full model info as JSON
- Quick access to provider documentation

## Data Source

This extension fetches data from the [models.dev API](https://models.dev/api.json), a community-maintained database of AI model specifications.
