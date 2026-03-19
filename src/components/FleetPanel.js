import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from '../@core/components/icon'

const statusColor = (status) => {
  if (status === 'online') return { bgcolor: 'rgba(152,195,121,0.15)', color: '#98c379' }
  if (status === 'offline' || status === 'disconnected') return { bgcolor: 'rgba(224,108,117,0.15)', color: '#e06c75' }
  if (status === 'unreachable') return { bgcolor: 'rgba(229,192,123,0.15)', color: '#e5c07b' }
  return { bgcolor: 'rgba(92,99,112,0.2)', color: '#5c6370' }
}

const thSx = {
  fontWeight: 600,
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  color: 'text.secondary',
  borderBottom: '1px solid rgba(70,75,87,0.40)'
}

export default function FleetPanel() {
  const [open, setOpen] = useState(true)
  const [agents, setAgents] = useState([])
  const [degraded, setDegraded] = useState(0)
  const [checkedAt, setCheckedAt] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchHealth = async (force = false) => {
    setLoading(true)
    try {
      const opts = force ? { method: 'POST' } : {}
      const res = await fetch('/api/health-check', opts)
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
        setDegraded(data.degradedCount || 0)
        setCheckedAt(data.checkedAt || null)
      }
    } catch (err) {
      console.error('Fleet health fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHealth() }, [])

  const onlineCount = agents.filter(a => a.status === 'online').length
  const total = agents.length

  return (
    <Card sx={{ bgcolor: '#2f343e', backgroundImage: 'none', border: '1px solid rgba(70,75,87,0.40)' }}>
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{
          px: 2, py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: open ? '1px solid rgba(70,75,87,0.40)' : 'none',
          '&:hover': { bgcolor: 'rgba(169,175,188,0.04)' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='tabler:heartbeat' fontSize={18} style={{ color: degraded > 0 ? '#e5c07b' : '#98c379' }} />
          <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
            Frota
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.disabled', fontFamily: '"Fira Code", monospace', fontSize: '0.65rem' }}>
            {onlineCount}/{total} online
          </Typography>
        </Box>
        <IconButton size='small' sx={{ color: 'text.disabled', p: 0.5 }}>
          <Icon icon={open ? 'tabler:chevron-up' : 'tabler:chevron-down'} fontSize={16} />
        </IconButton>
      </Box>

      <Collapse in={open}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell sx={thSx}>Agente</TableCell>
                  <TableCell sx={thSx}>Host</TableCell>
                  <TableCell sx={thSx}>Processo</TableCell>
                  <TableCell sx={thSx} align='right'>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((agent, i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {agent.agent}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }}>
                      <Typography variant='body2' sx={{ fontFamily: '"Fira Code", monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
                        {agent.host}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }}>
                      <Typography variant='body2' sx={{ fontFamily: '"Fira Code", monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
                        {agent.process}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }} align='right'>
                      <Chip
                        label={agent.status}
                        size='small'
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          border: 'none',
                          ...statusColor(agent.status)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
            <Typography variant='caption' sx={{ color: 'text.disabled', fontFamily: '"Fira Code", monospace', fontSize: '0.6rem' }}>
              {checkedAt ? new Date(checkedAt).toLocaleString('pt-BR') : '—'}
            </Typography>
            <Button
              size='small'
              onClick={(e) => { e.stopPropagation(); fetchHealth(true) }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={12} color='inherit' /> : <Icon icon='tabler:refresh' fontSize={14} />}
              sx={{ textTransform: 'none', fontSize: '0.7rem', color: '#61afef', minWidth: 0 }}
            >
              Check Frota
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}
