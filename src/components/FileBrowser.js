import { useState, useEffect, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from '../@core/components/icon'
import { getIcon, getIconColor, formatSize, isPreviewable, FileContentPreview } from './FilePreview'

export default function FileBrowser({ authHeaders }) {
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const fileInputRef = useRef(null)

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
    setSelectedFile(null)
    setFileContent(null)
    fetchDir(newPath)
  }

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const newPath = parts.join('/')
    setSelectedFile(null)
    setFileContent(null)
    fetchDir(newPath)
  }

  const goToPath = (index) => {
    const parts = currentPath.split('/').filter(Boolean)
    const newPath = parts.slice(0, index + 1).join('/')
    setSelectedFile(null)
    setFileContent(null)
    fetchDir(newPath)
  }

  const selectFile = async (item) => {
    setSelectedFile(item)
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
    } catch (err) {
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

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', currentPath || '.')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formData
      })
      if (res.ok) {
        fetchDir(currentPath)
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
    e.target.value = ''
  }

  const pathParts = currentPath.split('/').filter(Boolean)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Toolbar */}
      <Box sx={{
        px: 2.5,
        py: 1.5,
        borderBottom: '1px solid rgba(200,210,230,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='tabler:folders' fontSize={20} style={{ color: '#2469FF' }} />
          <Typography variant='h6' sx={{ fontSize: '0.95rem' }}>
            Files
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            ref={fileInputRef}
            type='file'
            hidden
            onChange={handleUpload}
          />
          <Button
            size='small'
            startIcon={<Icon icon='tabler:upload' fontSize={16} />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(200,210,230,0.06)' }
            }}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Breadcrumb */}
      <Box sx={{
        px: 2.5,
        py: 1,
        borderBottom: '1px solid rgba(200,210,230,0.04)',
        flexShrink: 0
      }}>
        <Breadcrumbs
          separator={<Icon icon='tabler:chevron-right' fontSize={12} style={{ color: 'rgba(200,210,230,0.3)' }} />}
          sx={{ '& .MuiBreadcrumbs-li': { fontSize: '0.75rem' } }}
        >
          <Typography
            variant='caption'
            onClick={() => { setSelectedFile(null); setFileContent(null); fetchDir('') }}
            sx={{
              cursor: 'pointer',
              color: pathParts.length === 0 ? 'text.primary' : '#2469FF',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.7rem',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            ontologia
          </Typography>
          {pathParts.map((part, i) => (
            <Typography
              key={i}
              variant='caption'
              onClick={() => goToPath(i)}
              sx={{
                cursor: 'pointer',
                color: i === pathParts.length - 1 ? 'text.primary' : '#2469FF',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.7rem',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {part}
            </Typography>
          ))}
        </Breadcrumbs>
      </Box>

      {/* Content area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File list */}
        <Box sx={{
          width: { xs: selectedFile ? '40%' : '100%', md: selectedFile ? '40%' : '100%' },
          borderRight: selectedFile ? '1px solid rgba(200,210,230,0.08)' : 'none',
          overflow: 'auto',
          transition: 'width 0.2s ease',
          scrollbarColor: '#1E2535 transparent',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#1E2535', borderRadius: 2 }
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: '#2469FF' }} />
            </Box>
          ) : (
            <>
              {currentPath && (
                <Box
                  onClick={goUp}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2.5,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(200,210,230,0.04)' }
                  }}
                >
                  <Icon icon='tabler:arrow-up' fontSize={16} style={{ color: 'rgba(200,210,230,0.4)' }} />
                  <Typography variant='body2' sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>
                    ..
                  </Typography>
                </Box>
              )}
              {items.map(item => (
                <Box
                  key={item.name}
                  onClick={() => item.type === 'directory' ? openDir(item.name) : selectFile(item)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2.5,
                    py: 0.75,
                    cursor: 'pointer',
                    bgcolor: selectedFile?.name === item.name ? 'rgba(36,105,255,0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(200,210,230,0.04)' }
                  }}
                >
                  <Icon icon={getIcon(item)} fontSize={18} style={{ color: getIconColor(item, 'browser'), flexShrink: 0 }} />
                  <Typography variant='body2' sx={{
                    flex: 1,
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </Typography>
                  <Typography variant='caption' sx={{
                    color: 'text.disabled',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.6rem',
                    flexShrink: 0
                  }}>
                    {formatSize(item.size)}
                  </Typography>
                </Box>
              ))}
              {items.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                    Diretorio vazio
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Preview panel */}
        {selectedFile && (
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            scrollbarColor: '#1E2535 transparent',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: '#1E2535', borderRadius: 2 }
          }}>
            {/* Preview header */}
            <Box sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid rgba(200,210,230,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              bgcolor: '#0A0E17',
              zIndex: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                <Icon icon={getIcon(selectedFile)} fontSize={16} style={{ color: getIconColor(selectedFile, 'browser') }} />
                <Typography variant='caption' sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant='caption' sx={{
                  color: 'text.disabled',
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.6rem'
                }}>
                  {formatSize(selectedFile.size)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size='small' onClick={() => downloadFile(selectedFile)} sx={{ color: 'text.disabled' }}>
                  <Icon icon='tabler:download' fontSize={16} />
                </IconButton>
                <IconButton size='small' onClick={() => { setSelectedFile(null); setFileContent(null) }} sx={{ color: 'text.disabled' }}>
                  <Icon icon='tabler:x' fontSize={16} />
                </IconButton>
              </Box>
            </Box>

            {/* Preview body */}
            <Box sx={{ p: 2 }}>
              {loadingFile ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={20} sx={{ color: '#2469FF' }} />
                </Box>
              ) : fileContent !== null ? (
                <FileContentPreview content={fileContent} ext={selectedFile.extension} />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Icon icon={getIcon(selectedFile)} fontSize={32} style={{ color: 'rgba(200,210,230,0.2)', display: 'block', margin: '0 auto 8px'}} />
                  <Typography variant='body2' sx={{ color: 'text.disabled', mb: 1 }}>
                    Preview nao disponivel
                  </Typography>
                  <Button
                    size='small'
                    startIcon={<Icon icon='tabler:download' fontSize={14} />}
                    onClick={() => downloadFile(selectedFile)}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Download
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
