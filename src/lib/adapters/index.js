/**
 * Adapter router — maps provider ID to the correct adapter module.
 */
const adapters = {
  anthropic: require('./anthropic'),
  openai: require('./openai'),
  google: require('./google'),
  moonshot: require('./moonshot'),
  xai: require('./xai'),
  inception: require('./inception'),
  openrouter: require('./openrouter')
}

function getAdapter(providerId) {
  return adapters[providerId] || null
}

module.exports = { getAdapter }
