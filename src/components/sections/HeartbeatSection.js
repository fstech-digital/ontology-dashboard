import { useState } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from '../../@core/components/icon'

export default function HeartbeatSection({ data, onRefresh }) {
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [markingDone, setMarkingDone] = useState(false)
  const [pendingPage, setPendingPage] = useState(0)
  const [pendingOpen, setPendingOpen] = useState(true)

  const pendingItems = data?.heartbeat?.pendingItems || []
  if (pendingItems.length === 0) return null

  const toggleItem = text => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(text)) next.delete(text)
      else next.add(text)
      return next
    })
  }

  const markDone = async () => {
    if (checkedItems.size === 0) return
    setMarkingDone(true)
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [...checkedItems] })
      })
      if (res.ok) {
        setCheckedItems(new Set())
        setPendingPage(0)
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      console.error('Mark done error:', err)
    } finally {
      setMarkingDone(false)
    }
  }

  const perPage = 5
  const totalPages = Math.ceil(pendingItems.length / perPage)
  const page = Math.min(pendingPage, totalPages - 1)
  const visible = pendingItems.slice(page * perPage, (page + 1) * perPage)

  return (
    <Grid item xs={12}>
      <Card sx={{ bgcolor: '#2f343e', backgroundImage: 'none', border: '1px solid rgba(70,75,87,0.40)' }}>
        <Box
          onClick={() => setPendingOpen(v => !v)}
          sx={{
            px: 2, py: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            borderBottom: pendingOpen ? '1px solid rgba(70,75,87,0.40)' : 'none',
            '&:hover': { bgcolor: 'rgba(169,175,188,0.04)' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon='tabler:checklist' fontSize={18} style={{ color: '#e5c07b' }} />
            <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              Pending
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.disabled', fontFamily: '"Fira Code", monospace', fontSize: '0.65rem' }}>
              {pendingItems.length} tasks — HEARTBEAT.md
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.disabled', p: 0.5 }}>
            <Icon icon={pendingOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'} fontSize={16} />
          </IconButton>
        </Box>

        <Collapse in={pendingOpen}>
          <CardContent sx={{ pt: 1, pb: 0 }}>
            {visible.map((item, i) => (
              <Box
                key={page * perPage + i}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  py: 0.5,
                  borderBottom: i < visible.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  opacity: checkedItems.has(item.text) ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <Checkbox
                  size='small'
                  checked={checkedItems.has(item.text)}
                  onChange={() => toggleItem(item.text)}
                  sx={{ p: 0.5, mr: 1 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant='body2'
                    sx={{
                      textDecoration: checkedItems.has(item.text) ? 'line-through' : 'none',
                      color: checkedItems.has(item.text) ? 'text.disabled' : 'text.primary'
                    }}
                  >
                    {item.text}
                  </Typography>
                </Box>
                <Chip
                  label={item.section}
                  size='small'
                  variant='outlined'
                  sx={{ ml: 1, height: 20, fontSize: '0.6rem', flexShrink: 0 }}
                />
              </Box>
            ))}
          </CardContent>
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {totalPages > 1 && (
                <>
                  <Button
                    size='small'
                    disabled={page === 0}
                    onClick={() => setPendingPage(p => p - 1)}
                    sx={{ minWidth: 32, fontSize: '0.7rem' }}
                  >
                    Prev
                  </Button>
                  <Typography variant='caption' sx={{ lineHeight: '30px', color: 'text.disabled', fontFamily: '"Fira Code", monospace' }}>
                    {page + 1}/{totalPages}
                  </Typography>
                  <Button
                    size='small'
                    disabled={page >= totalPages - 1}
                    onClick={() => setPendingPage(p => p + 1)}
                    sx={{ minWidth: 32, fontSize: '0.7rem' }}
                  >
                    Next
                  </Button>
                </>
              )}
            </Box>
            {checkedItems.size > 0 && (
              <Button
                variant='contained'
                size='small'
                color='success'
                onClick={markDone}
                disabled={markingDone}
                startIcon={markingDone ? <CircularProgress size={14} color='inherit' /> : <Icon icon='tabler:check' fontSize={16} />}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Mark {checkedItems.size} done
              </Button>
            )}
          </CardActions>
        </Collapse>
      </Card>
    </Grid>
  )
}
