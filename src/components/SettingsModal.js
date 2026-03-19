import { useState, useEffect, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import IconButton from '@mui/material/IconButton'
import Icon from '../@core/components/icon'

export default function SettingsModal({ open, onClose, authHeaders }) {
  const [providers, setProviders] = useState([])
  const [keys, setKeys] = useState({})
  const [saving, setSaving] = useState({})

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers', { headers: authHeaders })
      if (res.ok) setProviders(await res.json())
    } catch {}
  }, [authHeaders])

  useEffect(() => {
    if (open) fetchProviders()
  }, [open, fetchProviders])

  const handleSave = async (providerId) => {
    const key = keys[providerId]
    if (!key?.trim()) return

    setSaving(prev => ({ ...prev, [providerId]: true }))
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ provider: providerId, apiKey: key.trim() })
      })
      setKeys(prev => ({ ...prev, [providerId]: '' }))
      await fetchProviders()
    } catch {}
    setSaving(prev => ({ ...prev, [providerId]: false }))
  }

  const handleReset = async (providerId) => {
    setSaving(prev => ({ ...prev, [providerId]: true }))
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ provider: providerId, apiKey: '' })
      })
      await fetchProviders()
    } catch {}
    setSaving(prev => ({ ...prev, [providerId]: false }))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#2f343e',
          border: '1px solid rgba(70,75,87,0.80)',
          borderRadius: 2,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(70,75,87,0.50)',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='tabler:settings' fontSize={20} style={{ color: '#a9afbc' }} />
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
            API Keys
          </Typography>
        </Box>
        <IconButton size='small' onClick={onClose} sx={{ color: '#5c6370' }}>
          <Icon icon='tabler:x' fontSize={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, mt: 1 }}>
        <Typography sx={{
          px: 3,
          py: 1,
          fontSize: '0.75rem',
          color: '#8b919d'
        }}>
          Keys ficam salvas no .env do servidor. Nunca sao expostas ao navegador.
        </Typography>

        {providers.map(provider => (
          <Accordion
            key={provider.id}
            defaultExpanded={!provider.hasKey}
            disableGutters
            sx={{
              bgcolor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              borderBottom: '1px solid rgba(70,75,87,0.30)'
            }}
          >
            <AccordionSummary
              expandIcon={<Icon icon='tabler:chevron-down' fontSize={16} style={{ color: '#5c6370' }} />}
              sx={{ px: 3, minHeight: 48, '& .MuiAccordionSummary-content': { gap: 1.2, alignItems: 'center' } }}
            >
              <Icon icon={provider.icon} fontSize={16} style={{ color: provider.color }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {provider.name}
              </Typography>
              {provider.hasKey ? (
                <Icon icon='tabler:circle-check-filled' fontSize={16} style={{ color: '#98c379', marginLeft: 'auto', marginRight: 8 }} />
              ) : (
                <Icon icon='tabler:circle-x-filled' fontSize={16} style={{ color: '#e06c75', marginLeft: 'auto', marginRight: 8 }} />
              )}
            </AccordionSummary>

            <AccordionDetails sx={{ px: 3, pb: 2 }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#a9afbc', mb: 1 }}>
                {provider.models.map(m => m.label).join(', ')}
                {' — '}
                <span style={{ color: provider.hasKey ? '#98c379' : '#e5c07b' }}>
                  {provider.hasKey ? 'Configurado' : 'Nao configurado'}
                </span>
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  size='small'
                  fullWidth
                  type='password'
                  placeholder={provider.hasKey ? '••••••••' : 'Cole a API key aqui'}
                  value={keys[provider.id] || ''}
                  onChange={(e) => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.8rem',
                      fontFamily: '"Fira Code", monospace',
                      bgcolor: 'rgba(0,0,0,0.12)',
                      '& fieldset': { borderColor: 'rgba(70,75,87,0.50)' },
                      '&.Mui-focused fieldset': { borderColor: '#61afef' }
                    }
                  }}
                />
                <Button
                  variant='contained'
                  size='small'
                  disabled={!keys[provider.id]?.trim() || saving[provider.id]}
                  onClick={() => handleSave(provider.id)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    bgcolor: '#61afef',
                    minWidth: 70,
                    '&:hover': { bgcolor: '#74ade8' }
                  }}
                >
                  Salvar
                </Button>
                {provider.hasKey && (
                  <Button
                    variant='outlined'
                    size='small'
                    disabled={saving[provider.id]}
                    onClick={() => handleReset(provider.id)}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      borderColor: '#e06c75',
                      color: '#e06c75',
                      minWidth: 70,
                      '&:hover': { bgcolor: 'rgba(224,108,117,0.1)', borderColor: '#e06c75' }
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
    </Dialog>
  )
}
