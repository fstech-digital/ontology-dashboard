const OpenAI = require('openai').default

/**
 * OpenAI adapter — streams GPT responses via SSE.
 * Supports tool-use loop (max 10 iterations).
 */

function convertTools(tools) {
  if (!tools || !tools.length) return undefined
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema
    }
  }))
}

async function stream({ apiKey, modelId, systemPrompt, messages, tools, executeTool, send, baseURL }) {
  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  const openaiTools = convertTools(tools)

  let currentMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ]

  for (let iteration = 0; iteration < 10; iteration++) {
    const opts = {
      model: modelId,
      max_completion_tokens: 4096,
      messages: currentMessages,
      stream: true,
      stream_options: { include_usage: true }
    }
    if (openaiTools) opts.tools = openaiTools

    const response = await client.chat.completions.create(opts)

    let fullContent = ''
    let reasoningContent = ''
    let toolCalls = []
    let currentToolIndex = -1
    let usageData = null

    for await (const chunk of response) {
      const choice = chunk.choices?.[0]
      if (!choice) {
        if (chunk.usage) usageData = chunk.usage
        continue
      }

      const delta = choice.delta
      if (delta?.content) {
        fullContent += delta.content
        send('token', { text: delta.content })
      }

      // Capture reasoning/thinking content (used by Kimi K2.5, o4-mini, etc.)
      if (delta?.reasoning_content) {
        reasoningContent += delta.reasoning_content
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.index !== undefined && tc.index !== currentToolIndex) {
            currentToolIndex = tc.index
            toolCalls[currentToolIndex] = {
              id: tc.id || toolCalls[currentToolIndex]?.id || `call_${currentToolIndex}`,
              name: tc.function?.name || '',
              arguments: ''
            }
            if (tc.id && tc.function?.name) {
              send('tool_use_start', { id: tc.id, name: tc.function.name })
            }
          }
          if (tc.function?.arguments) {
            toolCalls[currentToolIndex].arguments += tc.function.arguments
          }
        }
      }

      if (chunk.usage) usageData = chunk.usage
    }

    if (usageData) {
      send('usage', {
        input_tokens: usageData.prompt_tokens || 0,
        output_tokens: usageData.completion_tokens || 0
      })
    }

    // Handle tool calls
    const pendingTools = toolCalls.filter(tc => tc && tc.name)
    if (pendingTools.length > 0) {
      const assistantMsg = { role: 'assistant', content: fullContent || null, tool_calls: [] }
      if (reasoningContent) assistantMsg.reasoning_content = reasoningContent
      const toolResultMsgs = []

      for (const tc of pendingTools) {
        let input = {}
        try { input = JSON.parse(tc.arguments) } catch {}

        assistantMsg.tool_calls.push({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments }
        })

        send('tool_use_start', { id: tc.id, name: tc.name, input })
        const result = executeTool(tc.name, input)
        send('tool_result', { id: tc.id, name: tc.name, result: result.slice(0, 5000) })

        toolResultMsgs.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result
        })
      }

      currentMessages = [...currentMessages, assistantMsg, ...toolResultMsgs]
    } else {
      break
    }
  }
}

module.exports = { stream }
