# models.dev Changelog

## [Initial Version] - {PR_MERGE_DATE}

### Added

- **Search Models**: Search across all AI models by name, provider, or capability with filtering options
- **Browse Providers**: Explore AI providers (OpenAI, Anthropic, Google, etc.) and their model offerings
- **Find by Capability**: Discover models by specific capabilities (reasoning, vision, audio, tool calling, etc.)
- **Compare Models**: Select 2-4 models for side-by-side comparison of specs, pricing, and capabilities
- **Pricing Explorer**: Compare model pricing across providers with tier-based filtering

### Features

- Fast cached access to model data using stale-while-revalidate strategy
- Provider logos for visual identification
- Detailed model information including pricing, context windows, and capabilities
- Copy model IDs and full model info as JSON
- Quick access to provider documentation
