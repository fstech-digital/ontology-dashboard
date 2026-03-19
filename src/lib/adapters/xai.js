const openaiAdapter = require('./openai')

/**
 * xAI (Grok) adapter — reuses OpenAI adapter with custom baseURL.
 * Grok supports tool-use via OpenAI-compatible API.
 */
async function stream(opts) {
  return openaiAdapter.stream({
    ...opts,
    baseURL: 'https://api.x.ai/v1'
  })
}

module.exports = { stream }
