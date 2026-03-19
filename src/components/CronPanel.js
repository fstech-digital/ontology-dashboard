import { useState } from 'react'
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
import Icon from '../@core/components/icon'

export default function CronPanel({ crons = [] }) {
  const [open, setOpen] = useState(true)

  const activeCount = crons.filter(c => !c.disabled).length

  if (crons.length === 0) return null

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
          <Icon icon='tabler:clock-play' fontSize={18} style={{ color: '#98c379' }} />
          <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
            Crons
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.disabled', fontFamily: '"Fira Code", monospace', fontSize: '0.65rem' }}>
            {crons.length} crons — {activeCount} ativos
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
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '1px solid rgba(70,75,87,0.40)' }}>Cron</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '1px solid rgba(70,75,87,0.40)' }}>Schedule</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '1px solid rgba(70,75,87,0.40)' }}>Entrega</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '1px solid rgba(70,75,87,0.40)' }} align='right'>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crons.map((cron, i) => {
                  const isWhatsApp = cron.entrega.toLowerCase().includes('whatsapp')
                  return (
                    <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 }, opacity: cron.disabled ? 0.5 : 1 }}>
                      <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }}>
                        <Typography variant='body2' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {cron.nome}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }}>
                        <Typography variant='body2' sx={{ fontFamily: '"Fira Code", monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
                          {cron.schedule}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }}>
                        <Chip
                          label={cron.entrega}
                          size='small'
                          variant='outlined'
                          color={isWhatsApp ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.6rem', fontFamily: '"Fira Code", monospace' }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(70,75,87,0.20)', py: 0.75 }} align='right'>
                        <Chip
                          label={cron.disabled ? 'Off' : 'Ativo'}
                          size='small'
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            bgcolor: cron.disabled ? 'rgba(92,99,112,0.2)' : 'rgba(152,195,121,0.15)',
                            color: cron.disabled ? '#5c6370' : '#98c379',
                            border: 'none'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Collapse>
    </Card>
  )
}
