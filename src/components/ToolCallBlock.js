import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from '../@core/components/icon'

const toolIcons = {
  read_file: 'tabler:file-text',
  write_file: 'tabler:file-pencil',
  bash_exec: 'tabler:terminal',
  list_directory: 'tabler:folder-open',
  ontology_search: 'tabler:search'
}

export default function ToolCallBlock({ name, input, result, status }) {
  const [expanded, setExpanded] = useState(false)

  const icon = toolIcons[name] || 'tabler:tool'
  const isLoading = status === 'running'
  const isError = status === 'error'

  return (
    <Box sx={{
      my: 1,
      borderRadius: 1,
      border: '1px solid',
      borderColor: isError ? 'rgba(239,68,68,0.2)' : 'rgba(36,105,255,0.15)',
      bgcolor: isError ? 'rgba(239,68,68,0.04)' : 'rgba(36,105,255,0.04)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box
        onClick={() => !isLoading && setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: isLoading ? 'default' : 'pointer',
          '&:hover': { bgcolor: isLoading ? 'transparent' : 'rgba(36,105,255,0.06)' }
        }}
      >
        {isLoading ? (
          <CircularProgress size={14} sx={{ color: '#2469FF' }} />
        ) : (
          <Icon icon={icon} fontSize={14} />
        )}
        <Typography variant='caption' sx={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '0.7rem',
          fontWeight: 500,
          flex: 1
        }}>
          {name}
        </Typography>
        {!isLoading && (
          <>
            {isError ? (
              <Icon icon='tabler:alert-circle' fontSize={14} style={{ color: '#EF4444' }} />
            ) : result ? (
              <Icon icon='tabler:check' fontSize={14} style={{ color: '#A3D955' }} />
            ) : null}
            <IconButton size='small' sx={{ p: 0.25 }}>
              <Icon icon={expanded ? 'tabler:chevron-up' : 'tabler:chevron-down'} fontSize={14} />
            </IconButton>
          </>
        )}
      </Box>

      {/* Body */}
      {expanded && (
        <Box sx={{
          px: 1.5,
          pb: 1,
          borderTop: '1px solid rgba(200,210,230,0.06)'
        }}>
          {input && (
            <Box sx={{ mt: 0.75 }}>
              <Typography variant='caption' sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                INPUT
              </Typography>
              <Box component='pre' sx={{
                m: 0,
                mt: 0.25,
                p: 1,
                borderRadius: 0.5,
                bgcolor: '#0A0E17',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.65rem',
                color: 'text.secondary',
                overflow: 'auto',
                maxHeight: 120,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
              </Box>
            </Box>
          )}
          {result && (
            <Box sx={{ mt: 0.75 }}>
              <Typography variant='caption' sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                OUTPUT
              </Typography>
              <Box component='pre' sx={{
                m: 0,
                mt: 0.25,
                p: 1,
                borderRadius: 0.5,
                bgcolor: '#0A0E17',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.65rem',
                color: 'text.secondary',
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {result.length > 2000 ? result.slice(0, 2000) + '\n...' : result}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
