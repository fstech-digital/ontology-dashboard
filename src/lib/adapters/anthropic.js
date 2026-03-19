const Anthropic = require('@anthropic-ai/sdk').default

/**
 * Anthropic adapter — streams Claude responses via SSE.
 * Supports tool-use loop (max 10 iterations).
 */
async function stream({ apiKey, modelId, systemPrompt, messages, tools, executeTool, send }) {
  const client = new Anthropic({ apiKey })

  let currentMessages = messages.map(m => ({ role: m.role, content: m.content }))

  for (let iteration = 0; iteration < 10; iteration++) {
    const streamOpts = {
      model: modelId,
      max_tokens: 4096,
      system: systemPrompt,
      messages: currentMessages
    }
    if (tools && tools.length > 0) {
      streamOpts.tools = tools
    }

    const response = client.messages.stream(streamOpts)

    for await (const event of response) {
      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (block.type === 'tool_use') {
          send('tool_use_start', { id: block.id, name: block.name })
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta
        if (delta.type === 'text_delta') {
          send('token', { text: delta.text })
        }
      }
    }

    const finalMessage = await response.finalMessage()

    if (finalMessage.usage) {
      send('usage', {
        input_tokens: finalMessage.usage.input_tokens,
        output_tokens: finalMessage.usage.output_tokens
      })
    }

    if (finalMessage.stop_reason === 'tool_use') {
      const toolBlocks = finalMessage.content.filter(b => b.type === 'tool_use')
      const toolResults = []

      for (const tool of toolBlocks) {
        send('tool_use_start', { id: tool.id, name: tool.name, input: tool.input })
        const result = executeTool(tool.name, tool.input)
        send('tool_result', { id: tool.id, name: tool.name, result: result.slice(0, 5000) })

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: result
        })
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: finalMessage.content },
        { role: 'user', content: toolResults }
      ]
    } else {
      break
    }
  }
}

module.exports = { stream }
