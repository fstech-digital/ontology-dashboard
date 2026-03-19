const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * Google Gemini adapter — streams responses via SSE.
 * Supports tool-use loop (max 10 iterations).
 * Uses @google/generative-ai SDK (different format from OpenAI).
 */

function convertTools(tools) {
  if (!tools || !tools.length) return undefined
  return [{
    functionDeclarations: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema
    }))
  }]
}

function convertMessages(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
}

async function stream({ apiKey, modelId, systemPrompt, messages, tools, executeTool, send }) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiTools = convertTools(tools)

  const modelOpts = { model: modelId }
  if (systemPrompt) modelOpts.systemInstruction = systemPrompt
  if (geminiTools) modelOpts.tools = geminiTools
  const model = genAI.getGenerativeModel(modelOpts)

  let history = convertMessages(messages.slice(0, -1))
  let lastMessage = messages[messages.length - 1]

  const chat = model.startChat({ history })

  for (let iteration = 0; iteration < 10; iteration++) {
    const result = await chat.sendMessageStream(lastMessage.content)

    let fullText = ''
    let functionCalls = []

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        fullText += text
        send('token', { text })
      }

      // Check for function calls in candidates
      const candidates = chunk.candidates || []
      for (const candidate of candidates) {
        for (const part of (candidate.content?.parts || [])) {
          if (part.functionCall) {
            functionCalls.push(part.functionCall)
          }
        }
      }
    }

    const response = await result.response
    if (response.usageMetadata) {
      send('usage', {
        input_tokens: response.usageMetadata.promptTokenCount || 0,
        output_tokens: response.usageMetadata.candidatesTokenCount || 0
      })
    }

    // Also check final response for function calls
    const finalParts = response.candidates?.[0]?.content?.parts || []
    for (const part of finalParts) {
      if (part.functionCall && !functionCalls.find(fc => fc.name === part.functionCall.name)) {
        functionCalls.push(part.functionCall)
      }
    }

    if (functionCalls.length > 0) {
      const toolResponses = []

      for (const fc of functionCalls) {
        const callId = `gemini_${fc.name}_${iteration}`
        send('tool_use_start', { id: callId, name: fc.name, input: fc.args })
        const result = executeTool(fc.name, fc.args || {})
        send('tool_result', { id: callId, name: fc.name, result: result.slice(0, 5000) })

        toolResponses.push({
          functionResponse: {
            name: fc.name,
            response: { result }
          }
        })
      }

      // Send tool results back to the chat — set as next message for the loop
      lastMessage = { content: toolResponses }
      // For Gemini, sendMessage accepts parts array directly
      // Override to send raw parts
      const toolResult = await chat.sendMessageStream(toolResponses)
      let toolText = ''
      let moreFunctionCalls = []

      for await (const chunk of toolResult.stream) {
        const text = chunk.text()
        if (text) {
          toolText += text
          send('token', { text })
        }
        const candidates = chunk.candidates || []
        for (const candidate of candidates) {
          for (const part of (candidate.content?.parts || [])) {
            if (part.functionCall) {
              moreFunctionCalls.push(part.functionCall)
            }
          }
        }
      }

      const toolResponse = await toolResult.response
      if (toolResponse.usageMetadata) {
        send('usage', {
          input_tokens: toolResponse.usageMetadata.promptTokenCount || 0,
          output_tokens: toolResponse.usageMetadata.candidatesTokenCount || 0
        })
      }

      if (moreFunctionCalls.length === 0) break
      // If more function calls, continue loop with those
      functionCalls = moreFunctionCalls
      continue
    } else {
      break
    }
  }
}

module.exports = { stream }
