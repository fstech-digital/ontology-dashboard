import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from '../@core/components/icon'
import { getIcon, getIconColor, formatSize, isPreviewable, FileContentPreview } from './FilePreview'

export default function FileTree({ authHeaders, onFileSaved }) {
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogFile, setDialogFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)

  const fetchDir = useCallback(async (dirPath) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ op: 'list', path: dirPath })
      const res = await fetch(`/api/files?${params}`, { headers: authHeaders })
      const data = await res.json()
      if (data.items) {
        setItems(data.items)
        setCurrentPath(dirPath)
      }
    } catch (err) {
      console.error('Fetch dir error:', err)
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    fetchDir('')
  }, [fetchDir])

  const openDir = (name) => {
    const newPath = currentPath ? `${currentPath}/${name}` : name
    fetchDir(newPath)
  }

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    fetchDir(parts.join('/'))
  }

  const openFile = async (item) => {
    setDialogFile(item)
    if (!isPreviewable(item.extension)) {
      setFileContent(null)
      return
    }
    setLoadingFile(true)
    try {
      const filePath = currentPath ? `${currentPath}/${item.name}` : item.name
      const params = new URLSearchParams({ op: 'read', path: filePath })
      const res = await fetch(`/api/files?${params}`, { headers: authHeaders })
      const data = await res.json()
      setFileContent(data.content || null)
    } catch {
      setFileContent('Erro ao ler arquivo.')
    } finally {
      setLoadingFile(false)
    }
  }

  const downloadFile = (item) => {
    const filePath = currentPath ? `${currentPath}/${item.name}` : item.name
    const params = new URLSearchParams({ op: 'download', path: filePath })
    window.open(`/api/files?${params}`, '_blank')
  }

  const closeDialog = () => {
    setDialogFile(null)
    setFileContent(null)
  }

  const pathParts = currentPath.split('/').filter(Boolean)
  const breadcrumbParts = pathParts.length > 2
    ? [{ label: '...', index: -1 }, ...pathParts.slice(-2).map((p, i) => ({ label: p, index: pathParts.length - 2 + i }))]
    : pathParts.map((p, i) => ({ label: p, index: i }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{
        px: 1.5,
        py: 1,
        borderBottom: '1px solid rgba(70,75,87,0.60)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Typography variant='caption' sx={{
          color: 'text.disabled',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          fontSize: '0.65rem'
        }}>
          Files
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size='small' onClick={() => fetchDir(currentPath)} sx={{ color: 'text.disabled', p: 0.5 }}>
            <Icon icon='tabler:refresh' fontSize={14} />
          </IconButton>
        </Box>
      </Box>

      {/* Breadcrumb */}
      <Box sx={{
        px: 1.5,
        py: 0.5,
        borderBottom: '1px solid rgba(169,175,188,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        <Typography
          variant='caption'
          onClick={() => fetchDir('')}
          sx={{
            cursor: 'pointer',
            color: pathParts.length === 0 ? 'text.primary' : '#61afef',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.6rem',
            flexShrink: 0,
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          ~
        </Typography>
        {breadcrumbParts.map((part, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
            <Icon icon='tabler:chevron-right' fontSize={10} style={{ color: 'rgba(92,99,112,0.6)', flexShrink: 0 }} />
            <Typography
              variant='caption'
              onClick={() => part.index >= 0 && fetchDir(pathParts.slice(0, part.index + 1).join('/'))}
              sx={{
                cursor: part.index >= 0 ? 'pointer' : 'default',
                color: i === breadcrumbParts.length - 1 ? 'text.primary' : '#61afef',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.6rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': part.index >= 0 ? { textDecoration: 'underline' } : {}
              }}
            >
              {part.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* File list */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        scrollbarColor: '#464b57 transparent',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: '#464b57', borderRadius: 2 }
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={18} sx={{ color: '#61afef' }} />
          </Box>
        ) : (
          <>
            {currentPath && (
              <Box
                onClick={goUp}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(169,175,188,0.06)' }
                }}
              >
                <Icon icon='tabler:arrow-up' fontSize={14} style={{ color: 'rgba(92,99,112,0.6)' }} />
                <Typography variant='body2' sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>..</Typography>
              </Box>
            )}
            {items.map(item => (
              <Box
                key={item.name}
                onClick={() => item.type === 'directory' ? openDir(item.name) : openFile(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.4,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(169,175,188,0.06)' }
                }}
              >
                <Icon icon={getIcon(item)} fontSize={15} style={{ color: getIconColor(item), flexShrink: 0 }} />
                <Typography variant='body2' sx={{
                  flex: 1,
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.name}
                </Typography>
                <Typography variant='caption' sx={{
                  color: 'text.disabled',
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '0.55rem',
                  flexShrink: 0
                }}>
                  {formatSize(item.size)}
                </Typography>
              </Box>
            ))}
            {items.length === 0 && (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant='body2' sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>Vazio</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* File preview dialog */}
      <Dialog
        open={!!dialogFile}
        onClose={closeDialog}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#2f343e',
            border: '1px solid',
            borderColor: 'divider',
            backgroundImage: 'none',
            maxHeight: '80vh'
          }
        }}
      >
        {dialogFile && (
          <>
            <DialogTitle sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              pb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Icon icon={getIcon(dialogFile)} fontSize={16} style={{ color: getIconColor(dialogFile) }} />
              <Box sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentPath ? `${currentPath}/${dialogFile.name}` : dialogFile.name}
              </Box>
              <Typography variant='caption' sx={{
                color: 'text.disabled',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.6rem',
                flexShrink: 0
              }}>
                {formatSize(dialogFile.size)}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {loadingFile ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={20} sx={{ color: '#61afef' }} />
                </Box>
              ) : fileContent !== null ? (
                <Box sx={{ p: 2 }}>
                  <FileContentPreview content={fileContent} ext={dialogFile.extension} />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Icon icon={getIcon(dialogFile)} fontSize={32} style={{ color: 'rgba(92,99,112,0.3)', display: 'block', margin: '0 auto 8px' }} />
                  <Typography variant='body2' sx={{ color: 'text.disabled', mb: 1 }}>Preview nao disponivel</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 1.5 }}>
                  <Button
                    size='small'
                    startIcon={<Icon icon='tabler:download' fontSize={14} />}
                    onClick={() => downloadFile(dialogFile)}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Download
                  </Button>
                  <Button
                    size='small'
                    onClick={closeDialog}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Fechar
                  </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
