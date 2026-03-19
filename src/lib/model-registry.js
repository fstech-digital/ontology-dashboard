/**
 * Model Registry — SSoT for all LLM providers, models, and capabilities.
 * Used by chat.js (router), providers.js (status), ModelSelector (UI), ContextBar (context window).
 */

const providers = {
  anthropic: {
    name: 'Anthropic',
    icon: 'simple-icons:anthropic',
    color: '#d4a27f',
    envKey: 'DASHBOARD_ANTHROPIC_KEY',
    envFallback: 'ANTHROPIC_API_KEY',
    models: [
      { id: 'sonnet', modelId: 'claude-sonnet-4-6', label: 'Sonnet 4.6', context: 200000, tools: true, badge: 'Latest' },
      { id: 'opus', modelId: 'claude-opus-4-6', label: 'Opus 4.6', context: 200000, tools: true },
      { id: 'haiku', modelId: 'claude-haiku-4-5', label: 'Haiku 4.5', context: 200000, tools: true }
    ]
  },
  google: {
    name: 'Google',
    icon: 'simple-icons:google',
    color: '#4285f4',
    envKey: 'DASHBOARD_GOOGLE_KEY',
    models: [
      { id: 'gemini-3-flash', modelId: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', context: 1048576, tools: true, badge: 'New' },
      { id: 'gemini-3.1-pro', modelId: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', context: 1048576, tools: true, badge: 'New' },
      { id: 'gemini-flash', modelId: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', context: 1048576, tools: true, badge: 'Recomendado' },
      { id: 'gemini-pro', modelId: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', context: 1048576, tools: true }
    ]
  },
  openai: {
    name: 'OpenAI',
    icon: 'simple-icons:openai',
    color: '#10a37f',
    envKey: 'DASHBOARD_OPENAI_KEY',
    models: [
      { id: 'gpt-5.2', modelId: 'gpt-5.2', label: 'GPT-5.2', context: 400000, tools: true, badge: 'Latest' },
      { id: 'gpt-4.1', modelId: 'gpt-4.1', label: 'GPT-4.1', context: 1000000, tools: true },
      { id: 'o4-mini', modelId: 'o4-mini', label: 'o4-mini', context: 200000, tools: true }
    ]
  },
  moonshot: {
    name: 'Moonshot',
    icon: 'tabler:moon-stars',
    color: '#6c5ce7',
    envKey: 'DASHBOARD_MOONSHOT_KEY',
    models: [
      { id: 'kimi-k2.5', modelId: 'kimi-k2.5', label: 'Kimi K2.5', context: 262144, tools: true }
    ]
  },
  xai: {
    name: 'xAI',
    icon: 'simple-icons:x',
    color: '#ffffff',
    envKey: 'DASHBOARD_XAI_KEY',
    models: [
      { id: 'grok-4', modelId: 'grok-4', label: 'Grok 4', context: 256000, tools: true, badge: 'Latest' },
      { id: 'grok-3', modelId: 'grok-3', label: 'Grok 3', context: 131072, tools: true }
    ]
  },
  inception: {
    name: 'Inception',
    icon: 'tabler:bolt',
    color: '#00d4aa',
    envKey: 'DASHBOARD_INCEPTION_KEY',
    models: [
      { id: 'mercury-2', modelId: 'mercury-2', label: 'Mercury 2', context: 130000, tools: true, badge: 'Fast' },
      { id: 'mercury', modelId: 'mercury', label: 'Mercury', context: 128000, tools: true }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    icon: 'tabler:router',
    color: '#6c72cb',
    envKey: 'DASHBOARD_OPENROUTER_KEY',
    models: [
      { id: 'or-deepseek-r1', modelId: 'deepseek/deepseek-r1', label: 'DeepSeek R1', context: 163840, tools: true, badge: 'Popular' },
      { id: 'or-deepseek-v3', modelId: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3', context: 163840, tools: true },
      { id: 'or-llama-4-maverick', modelId: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick', context: 1048576, tools: true },
      { id: 'or-mistral-large', modelId: 'mistralai/mistral-large-2411', label: 'Mistral Large', context: 128000, tools: true },
      { id: 'or-qwen3-235b', modelId: 'qwen/qwen3-235b-a22b', label: 'Qwen3 235B', context: 131072, tools: true }
    ]
  }
}

/** Get the API key for a provider from env */
function getApiKey(providerId) {
  const p = providers[providerId]
  if (!p) return null
  return process.env[p.envKey] || (p.envFallback ? process.env[p.envFallback] : null) || null
}

/** Check if a provider has a configured key (boolean only, never expose) */
function hasApiKey(providerId) {
  return !!getApiKey(providerId)
}

/** Find model config by short id (e.g. 'sonnet', 'gpt-4o', 'gemini-flash') */
function findModel(modelId) {
  for (const [providerId, provider] of Object.entries(providers)) {
    const model = provider.models.find(m => m.id === modelId)
    if (model) return { providerId, provider, model }
  }
  return null
}

/** Get all providers with hasKey status (for frontend) */
function getProvidersStatus() {
  return Object.entries(providers).map(([id, p]) => ({
    id,
    name: p.name,
    icon: p.icon,
    color: p.color,
    hasKey: hasApiKey(id),
    models: p.models.map(m => ({
      id: m.id,
      label: m.label,
      context: m.context,
      tools: m.tools,
      badge: m.badge || null
    }))
  }))
}

module.exports = { providers, getApiKey, hasApiKey, findModel, getProvidersStatus }
