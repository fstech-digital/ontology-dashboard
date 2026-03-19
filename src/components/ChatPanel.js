import { useState, useRef, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Icon from '../@core/components/icon'
import ChatMessage from './ChatMessage'
import ContextBar from './ContextBar'
import ModelSelector from './ModelSelector'
import SettingsModal from './SettingsModal'

const LS_MESSAGES = 'chat-messages'
const LS_MODEL = 'chat-model'
const LS_TOKENS = 'chat-tokens'

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export default function ChatPanel({ authHeaders }) {
  const [messages, setMessages] = useState(() => loadJSON(LS_MESSAGES, []))
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [model, setModel] = useState(() => localStorage.getItem(LS_MODEL) || 'sonnet')
  const [tokenUsage, setTokenUsage] = useState(() => loadJSON(LS_TOKENS, { input: 0, output: 0 }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Persist messages
  useEffect(() => {
    localStorage.setItem(LS_MESSAGES, JSON.stringify(messages))
  }, [messages])

  // Persist model
  useEffect(() => {
    localStorage.setItem(LS_MODEL, model)
  }, [model])

  // Persist token usage
  useEffect(() => {
    localStorage.setItem(LS_TOKENS, JSON.stringify(tokenUsage))
  }, [tokenUsage])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const clearConversation = () => {
    setMessages([])
    setTokenUsage({ input: 0, output: 0 })
    localStorage.removeItem(LS_MESSAGES)
    localStorage.removeItem(LS_TOKENS)
    inputRef.current?.focus()
  }

  const sendMessage = async (overrideText) => {
    const text = overrideText || input.trim()
    if (!text || streaming) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    if (!overrideText) setInput('')
    setStreaming(true)

    // Add empty assistant message
    const assistantMsg = { role: 'assistant', content: '', toolCalls: [] }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Erro: ${err.error || res.statusText}`
          }
          return updated
        })
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (currentEvent === 'token') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.content = (last.content || '') + data.text
                  updated[updated.length - 1] = last
                  return updated
                })
              } else if (currentEvent === 'tool_use_start') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.toolCalls = [...(last.toolCalls || []), {
                    id: data.id,
                    name: data.name,
                    input: data.input,
                    result: null,
                    status: 'running'
                  }]
                  updated[updated.length - 1] = last
                  return updated
                })
              } else if (currentEvent === 'tool_result') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.toolCalls = (last.toolCalls || []).map(tc =>
                    tc.id === data.id
                      ? { ...tc, result: data.result, status: 'done', input: data.input || tc.input }
                      : tc
                  )
                  updated[updated.length - 1] = last
                  return updated
                })
              } else if (currentEvent === 'usage') {
                setTokenUsage(prev => ({
                  input: prev.input + (data.input_tokens || 0),
                  output: prev.output + (data.output_tokens || 0)
                }))
              } else if (currentEvent === 'error') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.content = (last.content || '') + `\n\nErro: ${data.message}`
                  updated[updated.length - 1] = last
                  return updated
                })
              }
              currentEvent = ''
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Erro de conexao: ${err.message}`
        }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleHandoff = () => {
    if (streaming) return
    sendMessage('Create a handoff summary of this session. List decisions made and pending tasks.')
  }

  const handlePromptPrime = async () => {
    if (streaming || messages.length > 0) return
    try {
      const res = await fetch(`/api/files?op=read&path=prompt-prime.md`, {
        headers: authHeaders
      })
      if (!res.ok) {
        setMessages([{
          role: 'assistant',
          content: 'Erro: prompt-prime.md nao encontrado na raiz da ontologia.'
        }])
        return
      }
      const data = await res.json()
      const primeContent = data.content

      // Show friendly message to user, but send full prompt-prime to API
      const displayMsg = { role: 'user', content: 'Iniciando o Sistema...' }
      const apiMessages = [{ role: 'user', content: primeContent }]
      setMessages([displayMsg])
      setStreaming(true)

      const assistantMsg = { role: 'assistant', content: '', toolCalls: [] }
      setMessages([displayMsg, assistantMsg])

      const apiRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ messages: apiMessages, model })
      })

      if (!apiRes.ok) {
        const err = await apiRes.json().catch(() => ({ error: 'Request failed' }))
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: `Erro: ${err.error || apiRes.statusText}` }
          return updated
        })
        setStreaming(false)
        return
      }

      const reader = apiRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6))
              if (currentEvent === 'token') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.content = (last.content || '') + d.text
                  updated[updated.length - 1] = last
                  return updated
                })
              } else if (currentEvent === 'tool_use_start') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.toolCalls = [...(last.toolCalls || []), { id: d.id, name: d.name, input: d.input, result: null, status: 'running' }]
                  updated[updated.length - 1] = last
                  return updated
                })
              } else if (currentEvent === 'tool_result') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.toolCalls = (last.toolCalls || []).map(tc =>
                    tc.id === d.id ? { ...tc, result: d.result, status: 'done', input: d.input || tc.input } : tc
                  )
                  updated[updated.length - 1] = last
                  return updated
                })
              } else if (currentEvent === 'usage') {
                setTokenUsage(prev => ({
                  input: prev.input + (d.input_tokens || 0),
                  output: prev.output + (d.output_tokens || 0)
                }))
              } else if (currentEvent === 'error') {
                setMessages(prev => {
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.content = (last.content || '') + `\n\nErro: ${d.message}`
                  updated[updated.length - 1] = last
                  return updated
                })
              }
              currentEvent = ''
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        if (prev.length > 0) {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: `Erro de conexao: ${err.message}` }
          return updated
        }
        return [{ role: 'assistant', content: `Erro ao carregar prompt-prime.md: ${err.message}` }]
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%'
    }}>
      {/* Header */}
      <Box sx={{
        px: 2.5,
        py: 1.5,
        borderBottom: '1px solid rgba(70,75,87,0.60)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='tabler:message-chatbot' fontSize={20} style={{ color: '#a9afbc' }} />
          <Typography variant='h6' sx={{ fontSize: '0.95rem' }}>
            Assistant
          </Typography>
          {streaming && (
            <CircularProgress size={14} sx={{ color: '#61afef', ml: 1 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title='Prompt Prime (boot)' arrow>
            <span>
              <IconButton
                size='small'
                onClick={handlePromptPrime}
                disabled={streaming || messages.length > 0}
                sx={{
                  color: messages.length === 0 ? '#c678dd' : 'text.disabled',
                  '&:hover': { bgcolor: 'rgba(198,120,221,0.1)' }
                }}
              >
                <Icon icon='tabler:rocket' fontSize={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title='Handoff' arrow>
            <span>
              <IconButton
                size='small'
                onClick={handleHandoff}
                disabled={streaming || messages.length === 0}
                sx={{
                  color: messages.length > 0 ? '#e5c07b' : 'text.disabled',
                  '&:hover': { bgcolor: 'rgba(229,192,123,0.1)' }
                }}
              >
                <Icon icon='tabler:transfer-out' fontSize={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title='Resetar conversa' arrow>
            <span>
              <IconButton
                size='small'
                onClick={clearConversation}
                disabled={streaming || messages.length === 0}
                sx={{
                  color: messages.length > 0 ? 'text.secondary' : 'text.disabled',
                  '&:hover': { bgcolor: 'rgba(169,175,188,0.08)' }
                }}
              >
                <Icon icon='tabler:refresh' fontSize={18} />
              </IconButton>
            </span>
          </Tooltip>
          <ModelSelector
            model={model}
            onModelChange={setModel}
            onOpenSettings={() => setSettingsOpen(true)}
            authHeaders={authHeaders}
          />
        </Box>
      </Box>

      {/* Context Bar */}
      <ContextBar
        model={model}
        inputTokens={tokenUsage.input}
        outputTokens={tokenUsage.output}
        authHeaders={authHeaders}
      />

      {/* Messages */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        py: 2,
        scrollbarColor: '#464b57 transparent',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: '#464b57', borderRadius: 2 }
      }}>
        {messages.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 1.5,
            color: 'text.disabled'
          }}>
            <Icon icon='tabler:message-chatbot' fontSize={40} />
            <Typography variant='body2'>Chat with your AI assistant</Typography>
            <Typography variant='caption' sx={{ color: 'text.disabled' }}>
              Ctrl+Enter to send
            </Typography>
          </Box>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            toolCalls={msg.toolCalls}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderTop: '1px solid rgba(70,75,87,0.60)',
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            multiline
            maxRows={6}
            fullWidth
            placeholder='Message...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
                bgcolor: 'rgba(0,0,0,0.12)',
                '& fieldset': { borderColor: 'rgba(70,75,87,0.50)' },
                '&:hover fieldset': { borderColor: 'rgba(70,75,87,0.80)' },
                '&.Mui-focused fieldset': { borderColor: '#61afef' }
              }
            }}
          />
          <IconButton
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            sx={{
              bgcolor: input.trim() ? '#61afef' : 'transparent',
              color: input.trim() ? '#1e2127' : 'text.disabled',
              '&:hover': { bgcolor: input.trim() ? '#74ade8' : 'transparent' },
              width: 40,
              height: 40
            }}
          >
            <Icon icon='tabler:send' fontSize={18} />
          </IconButton>
        </Box>
      </Box>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        authHeaders={authHeaders}
      />
    </Box>
  )
}
