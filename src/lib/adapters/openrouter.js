const openaiAdapter = require('./openai')

/**
 * OpenRouter adapter — reuses OpenAI adapter with custom baseURL.
 * Single API key, access to hundreds of models.
 * OpenAI-compatible API at https://openrouter.ai/api/v1
 */
async function stream(opts) {
  return openaiAdapter.stream({
    ...opts,
    baseURL: 'https://openrouter.ai/api/v1'
  })
}

module.exports = { stream }
