const { buildSystemPrompt } = require('../../lib/ares-context')
const { toolDefinitions, executeTool } = require('../../lib/ares-tools')
const { checkAuth } = require('../../lib/auth')
const { logMessage } = require('../../lib/chat-storage')
const { findModel, getApiKey } = require('../../lib/model-registry')
const { getAdapter } = require('../../lib/adapters')

export const config = {
  api: { bodyParser: true }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { messages = [], model = 'sonnet' } = req.body

  const match = findModel(model)
  if (!match) {
    return res.status(400).json({ error: `Unknown model: ${model}` })
  }

  const { providerId, model: modelConfig } = match
  const apiKey = getApiKey(providerId)
  if (!apiKey) {
    return res.status(500).json({ error: `API key not configured for ${match.provider.name}. Set it in Settings.` })
  }

  const adapter = getAdapter(providerId)
  if (!adapter) {
    return res.status(500).json({ error: `Adapter nao encontrado: ${providerId}` })
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const systemPrompt = buildSystemPrompt()
    const recentMessages = messages.slice(-20)

    const lastMsg = recentMessages[recentMessages.length - 1]
    if (lastMsg?.role === 'user') {
      logMessage('user', typeof lastMsg.content === 'string' ? lastMsg.content : '[tool results]')
    }

    await adapter.stream({
      apiKey,
      modelId: modelConfig.modelId,
      systemPrompt,
      messages: recentMessages,
      tools: modelConfig.tools ? toolDefinitions : null,
      executeTool: (name, input) => {
        const result = executeTool(name, input)
        logMessage('tool', result.slice(0, 500), { tool: name, input })
        return result
      },
      send
    })

    send('done', {})
  } catch (err) {
    console.error('Chat API error:', err)
    send('error', { message: err.message || 'Internal error' })
  } finally {
    res.end()
  }
}
