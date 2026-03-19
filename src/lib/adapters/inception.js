const openaiAdapter = require('./openai')

/**
 * Inception (Mercury) adapter — reuses OpenAI adapter with custom baseURL.
 * Mercury dLLM uses OpenAI-compatible API at api.inceptionlabs.ai.
 */
async function stream(opts) {
  return openaiAdapter.stream({
    ...opts,
    baseURL: 'https://api.inceptionlabs.ai/v1'
  })
}

module.exports = { stream }
