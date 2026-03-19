# Contributing

Thanks for your interest in contributing to Ontology Dashboard!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ontology-dashboard.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and add your Anthropic API key
5. Run the dev server: `npm run dev`
6. Open http://localhost:3333

## Architecture Overview

```
src/
├── pages/
│   ├── index.js          # Main dashboard page
│   ├── login.js           # Auth page
│   └── api/               # Backend routes
│       ├── chat.js        # SSE streaming (routes to adapters)
│       ├── ontology.js    # Data aggregation
│       ├── files.js       # File operations
│       └── commit.js      # Git commit + write-back
├── components/
│   ├── ChatPanel.js       # Multi-LLM chat with tool use
│   ├── FileTree.js        # File browser with inline editor
│   ├── ModelSelector.js   # LLM provider/model picker
│   └── sections/          # Dashboard content sections
├── layouts/
│   └── ThreeColumnLayout.js  # Zed-like 3-column layout
└── lib/
    ├── adapters/           # LLM provider adapters
    │   ├── anthropic.js    # Claude (native SDK)
    │   ├── openai.js       # GPT + OpenAI-compatible APIs
    │   ├── google.js       # Gemini
    │   └── ...             # Moonshot, xAI, Inception, OpenRouter
    ├── model-registry.js   # SSoT for all models
    ├── config.js           # Config loader (singleton)
    └── parsers.js          # Ontology file parsers
```

## Key Design Decisions

- **Config-driven**: `dashboard.config.json` defines sections, parsers, tools, and layout. No code changes needed for new instances.
- **Adapter pattern**: Each LLM provider is a ~50-100 LOC module that normalizes responses to a common SSE format.
- **Zero database**: All data lives in the filesystem (Markdown, JSONL, JSON).
- **Theme system**: `theme.config.json` controls all colors, typography, and spacing.

## Adding a New LLM Provider

1. Create `src/lib/adapters/your-provider.js` exporting `stream({ apiKey, modelId, systemPrompt, messages, tools, executeTool, send })`
2. Register it in `src/lib/adapters/index.js`
3. Add the provider and its models to `src/lib/model-registry.js`
4. Add the env key name to `.env.example`

## Adding a New Dashboard Section

1. Create `src/components/sections/YourSection.js`
2. Register it in `src/lib/section-registry.js`
3. Add it to `dashboard.config.json` sections array
4. If it needs parsed data, add a parser in `src/lib/parsers.js`

## Code Style

- No TypeScript (intentional — keeps the codebase accessible)
- Minimal abstractions — prefer explicit code over clever patterns
- MUI components with inline `sx` props
- CommonJS for backend (`require`), ESM for frontend (`import`)

## Pull Requests

- Keep PRs focused on a single change
- Include a screenshot for UI changes
- Test with at least one LLM provider (Anthropic recommended)
- Update `dashboard.config.json` if you add new sections/parsers
