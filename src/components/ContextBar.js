import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const MODEL_DEFAULTS = {
  sonnet: { label: 'Sonnet 4', context: 200000 },
  opus: { label: 'Opus 4', context: 200000 }
}

function getColor(pct) {
  if (pct < 50) return '#C8ED78'  // green
  if (pct < 60) return '#FFD666'  // yellow
  if (pct < 70) return '#FFA54C'  // orange
  return '#FF6B6B'                // red
}

function getLabel(pct) {
  if (pct < 50) return 'tranquilo'
  if (pct < 60) return 'metade'
  if (pct < 70) return 'handoff recomendado'
  return 'handoff obrigatorio'
}

function formatContext(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`
  return `${(n / 1000).toFixed(0)}K`
}

export default function ContextBar({ model, inputTokens, outputTokens, authHeaders }) {
  const [modelInfo, setModelInfo] = useState(MODEL_DEFAULTS[model] || { label: model, context: 200000 })

  useEffect(() => {
    // Try to fetch real model info from providers API
    async function fetchInfo() {
      try {
        const res = await fetch('/api/providers', { headers: authHeaders })
        if (!res.ok) return
        const providers = await res.json()
        for (const p of providers) {
          const m = p.models.find(m => m.id === model)
          if (m) {
            setModelInfo({ label: m.label, context: m.context })
            return
          }
        }
      } catch {}
      // Fallback
      setModelInfo(MODEL_DEFAULTS[model] || { label: model, context: 200000 })
    }
    fetchInfo()
  }, [model, authHeaders])

  const total = inputTokens + outputTokens
  const contextWindow = modelInfo.context
  const pct = Math.min(Math.round((total / contextWindow) * 100), 100)
  const color = getColor(pct)
  const label = getLabel(pct)

  const blocks = 20
  const filled = Math.round((pct / 100) * blocks)
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(blocks - filled)

  if (total === 0) return null

  return (
    <Box sx={{
      px: 2.5,
      py: 0.5,
      borderBottom: '1px solid rgba(200,210,230,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      flexShrink: 0
    }}>
      <Typography sx={{
        fontFamily: '"Fira Code", monospace',
        fontSize: '0.7rem',
        color: 'text.secondary',
        whiteSpace: 'nowrap'
      }}>
        [{modelInfo.label}]
      </Typography>
      <Typography sx={{
        fontFamily: '"Fira Code", monospace',
        fontSize: '0.7rem',
        color,
        letterSpacing: '0.05em'
      }}>
        {bar}
      </Typography>
      <Typography sx={{
        fontFamily: '"Fira Code", monospace',
        fontSize: '0.7rem',
        color,
        whiteSpace: 'nowrap'
      }}>
        {pct}% {label}
      </Typography>
      <Typography sx={{
        fontFamily: '"Fira Code", monospace',
        fontSize: '0.6rem',
        color: 'text.disabled',
        whiteSpace: 'nowrap',
        ml: 'auto'
      }}>
        {(total / 1000).toFixed(1)}K / {formatContext(contextWindow)}
      </Typography>
    </Box>
  )
}
