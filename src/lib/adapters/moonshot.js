const openaiAdapter = require('./openai')

/**
 * Moonshot (Kimi) adapter — reuses OpenAI adapter with custom baseURL.
 * Kimi K2.5 supports tool/function calling via OpenAI-compatible API.
 */
async function stream(opts) {
  return openaiAdapter.stream({
    ...opts,
    baseURL: 'https://api.moonshot.ai/v1'
  })
}

module.exports = { stream }
