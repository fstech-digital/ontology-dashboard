import { useState, useEffect, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Icon from '../@core/components/icon'

export default function ModelSelector({ model, onModelChange, onOpenSettings, authHeaders }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [providers, setProviders] = useState([])
  const [search, setSearch] = useState('')
  const open = Boolean(anchorEl)

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers', { headers: authHeaders })
      if (res.ok) setProviders(await res.json())
    } catch {}
  }, [authHeaders])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  // Refetch when popover opens
  useEffect(() => {
    if (open) {
      fetchProviders()
      setSearch('')
    }
  }, [open, fetchProviders])

  // Keyboard shortcut: Ctrl+Alt+C
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'c') {
        e.preventDefault()
        // Toggle — use a dummy anchor at center of screen
        setAnchorEl(prev => prev ? null : document.body)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const currentModel = useMemo(() => {
    for (const p of providers) {
      const m = p.models.find(m => m.id === model)
      if (m) return { ...m, providerName: p.name, providerColor: p.color }
    }
    return { label: model, providerName: '' }
  }, [model, providers])

  const filtered = useMemo(() => {
    if (!search) return providers
    const q = search.toLowerCase()
    return providers
      .map(p => ({
        ...p,
        models: p.models.filter(m =>
          m.label.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
        )
      }))
      .filter(p => p.models.length > 0)
  }, [providers, search])

  return (
    <>
      <Button
        size='small'
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          textTransform: 'none',
          fontFamily: '"Fira Code", monospace',
          fontSize: '0.72rem',
          color: '#a9afbc',
          border: '1px solid rgba(70,75,87,0.60)',
          borderRadius: 1,
          px: 1.2,
          py: 0.3,
          minWidth: 0,
          gap: 0.5,
          '&:hover': { borderColor: '#61afef', color: '#dce0e5' }
        }}
      >
        {currentModel.label}
        <Icon icon='tabler:chevron-down' fontSize={14} />
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl === document.body ? null : anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        {...(anchorEl === document.body ? {
          anchorReference: 'anchorPosition',
          anchorPosition: { top: window.innerHeight / 2 - 150, left: window.innerWidth / 2 }
        } : {})}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#2f343e',
              border: '1px solid rgba(70,75,87,0.80)',
              borderRadius: 2,
              width: 320,
              maxHeight: 420,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }
          }
        }}
      >
        {/* Search */}
        <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(70,75,87,0.50)' }}>
          <TextField
            size='small'
            fullWidth
            placeholder='Search model...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.8rem',
                bgcolor: 'rgba(0,0,0,0.15)',
                '& fieldset': { borderColor: 'rgba(70,75,87,0.40)' },
                '&.Mui-focused fieldset': { borderColor: '#61afef' }
              }
            }}
          />
        </Box>

        {/* Provider groups */}
        <Box sx={{ overflow: 'auto', maxHeight: 320, py: 0.5 }}>
          {filtered.map(provider => (
            <Box key={provider.id}>
              {/* Provider header */}
              <Box sx={{
                px: 1.5,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.8
              }}>
                <Icon icon={provider.icon} fontSize={13} style={{ color: provider.color, opacity: provider.hasKey ? 1 : 0.4 }} />
                <Typography sx={{
                  fontSize: '0.68rem',
                  color: '#5c6370',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {provider.name}
                </Typography>
                {!provider.hasKey && (
                  <Typography sx={{ fontSize: '0.6rem', color: '#e06c75', ml: 'auto' }}>
                    sem key
                  </Typography>
                )}
              </Box>

              {/* Models */}
              {provider.models.map(m => {
                const isSelected = m.id === model
                const disabled = !provider.hasKey

                return (
                  <Box
                    key={m.id}
                    onClick={() => {
                      if (disabled) return
                      onModelChange(m.id)
                      setAnchorEl(null)
                    }}
                    sx={{
                      px: 2.5,
                      py: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: disabled ? 'default' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      bgcolor: isSelected ? 'rgba(97,175,239,0.12)' : 'transparent',
                      '&:hover': disabled ? {} : { bgcolor: 'rgba(97,175,239,0.08)' }
                    }}
                  >
                    {isSelected && (
                      <Icon icon='tabler:check' fontSize={14} style={{ color: '#61afef' }} />
                    )}
                    <Typography sx={{
                      fontSize: '0.82rem',
                      color: isSelected ? '#61afef' : '#dce0e5',
                      ml: isSelected ? 0 : 2.2,
                      fontFamily: '"Fira Code", monospace'
                    }}>
                      {m.label}
                    </Typography>
                    {m.badge && (
                      <Chip
                        label={m.badge}
                        size='small'
                        sx={{
                          height: 18,
                          fontSize: '0.58rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(97,175,239,0.15)',
                          color: '#61afef',
                          ml: 'auto'
                        }}
                      />
                    )}
                    {!m.tools && (
                      <Typography sx={{
                        fontSize: '0.58rem',
                        color: '#5c6370',
                        ml: m.badge ? 0 : 'auto'
                      }}>
                        chat-only
                      </Typography>
                    )}
                  </Box>
                )
              })}
            </Box>
          ))}
          {filtered.length === 0 && (
            <Typography sx={{ p: 2, textAlign: 'center', color: '#5c6370', fontSize: '0.8rem' }}>
              Nenhum modelo encontrado
            </Typography>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 1.5,
          borderTop: '1px solid rgba(70,75,87,0.50)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#5c6370' }}>
            Ctrl+Alt+C
          </Typography>
          <Button
            size='small'
            onClick={() => { setAnchorEl(null); onOpenSettings() }}
            startIcon={<Icon icon='tabler:settings' fontSize={14} />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: '#a9afbc',
              '&:hover': { color: '#dce0e5', bgcolor: 'rgba(97,175,239,0.08)' }
            }}
          >
            Configurar
          </Button>
        </Box>
      </Popover>
    </>
  )
}
