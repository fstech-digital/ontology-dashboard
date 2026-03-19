import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { Icon } from '@iconify/react'
import useAuth from '../lib/useAuth'

const ChatPanel = dynamic(() => import('../components/ChatPanel'), { ssr: false })
const FileTree = dynamic(() => import('../components/FileTree'), { ssr: false })

const LS_CHAT = 'layout-chat-open'
const LS_FILES = 'layout-files-open'
const LS_FILES_W = 'layout-files-width'
const LS_CHAT_W = 'layout-chat-width'
const DEFAULT_FILES_WIDTH = 300
const DEFAULT_CHAT_WIDTH = 380
const MIN_PANEL = 200
const MAX_PANEL = 600
const TOP_BAR_HEIGHT = 48

function DragHandle({ side, onDrag }) {
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = 0 // will be set by parent via onDrag
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev) => {
      if (!dragging.current) return
      const delta = side === 'left' ? ev.clientX - startX.current : startX.current - ev.clientX
      onDrag(delta)
      startX.current = ev.clientX
    }

    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        width: 4,
        flexShrink: 0,
        cursor: 'col-resize',
        bgcolor: 'transparent',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: 'rgba(97,175,239,0.25)' },
        '&:active': { bgcolor: 'rgba(97,175,239,0.40)' }
      }}
    />
  )
}

export default function ThreeColumnLayout({ children }) {
  const { authHeaders } = useAuth()
  const [chatOpen, setChatOpen] = useState(true)
  const [filesOpen, setFilesOpen] = useState(true)
  const [filesWidth, setFilesWidth] = useState(DEFAULT_FILES_WIDTH)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const [time, setTime] = useState('')


  // Load persisted state
  useEffect(() => {
    const savedChat = localStorage.getItem(LS_CHAT)
    const savedFiles = localStorage.getItem(LS_FILES)
    const savedFilesW = localStorage.getItem(LS_FILES_W)
    const savedChatW = localStorage.getItem(LS_CHAT_W)
    if (savedChat === 'false') setChatOpen(false)
    if (savedFiles === 'false') setFilesOpen(false)
    if (savedFilesW) setFilesWidth(Math.max(MIN_PANEL, Math.min(MAX_PANEL, parseInt(savedFilesW))))
    if (savedChatW) setChatWidth(Math.max(MIN_PANEL, Math.min(MAX_PANEL, parseInt(savedChatW))))
  }, [])

  useEffect(() => { localStorage.setItem(LS_CHAT, String(chatOpen)) }, [chatOpen])
  useEffect(() => { localStorage.setItem(LS_FILES, String(filesOpen)) }, [filesOpen])
  useEffect(() => { localStorage.setItem(LS_FILES_W, String(filesWidth)) }, [filesWidth])
  useEffect(() => { localStorage.setItem(LS_CHAT_W, String(chatWidth)) }, [chatWidth])

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  // Drag handlers
  const handleFilesDrag = useCallback((delta) => {
    setFilesWidth(prev => Math.max(MIN_PANEL, Math.min(MAX_PANEL, prev + delta)))
  }, [])

  const handleChatDrag = useCallback((delta) => {
    setChatWidth(prev => Math.max(MIN_PANEL, Math.min(MAX_PANEL, prev + delta)))
  }, [])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') return

    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      setFilesOpen(prev => !prev)
    } else if (e.ctrlKey && e.key === 'e') {
      e.preventDefault()
      setChatOpen(prev => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <Box sx={{
        height: TOP_BAR_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        borderBottom: '1px solid rgba(70,75,87,0.60)',
        bgcolor: '#21252b'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component='img'
            src='/logo.png'
            alt='Logo'
            sx={{ height: 28, width: 28, mr: 0.5 }}
          />

          <Tooltip title='Files (Ctrl+B)' arrow>
            <IconButton
              size='small'
              onClick={() => setFilesOpen(prev => !prev)}
              sx={{
                color: filesOpen ? '#dce0e5' : '#5c6370',
                p: 0.5,
                '&:hover': { bgcolor: 'rgba(169,175,188,0.08)' }
              }}
            >
              <Icon icon='tabler:folders' width={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Chat (Ctrl+E)' arrow>
            <IconButton
              size='small'
              onClick={() => setChatOpen(prev => !prev)}
              sx={{
                color: chatOpen ? '#dce0e5' : '#5c6370',
                p: 0.5,
                '&:hover': { bgcolor: 'rgba(169,175,188,0.08)' }
              }}
            >
              <Icon icon='tabler:message-chatbot' width={18} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%',
            bgcolor: '#98c379',
            boxShadow: '0 0 4px rgba(152,195,121,0.4)'
          }} />

          <Typography variant='caption' sx={{
            color: '#5c6370',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.6rem'
          }}>
            v0.3.0
          </Typography>

          <Typography variant='caption' sx={{
            color: '#5c6370',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.6rem'
          }}>
            {time}
          </Typography>
        </Box>
      </Box>

      {/* Main area: Files | drag | Overview | drag | Chat */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Files */}
        {filesOpen && (
          <>
            <Box sx={{
              width: filesWidth,
              flexShrink: 0,
              overflow: 'hidden',
              bgcolor: '#282c33'
            }}>
              <Box sx={{ width: filesWidth, height: '100%' }}>
                <FileTree authHeaders={authHeaders} />
              </Box>
            </Box>
            <DragHandle side='left' onDrag={handleFilesDrag} />
          </>
        )}

        {/* Center: Overview */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          scrollbarColor: '#464b57 #282c33',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { background: '#464b57', borderRadius: 3 }
        }}>
          {children}
        </Box>

        {/* Right: Chat */}
        {chatOpen && (
          <>
            <DragHandle side='right' onDrag={handleChatDrag} />
            <Box sx={{
              width: chatWidth,
              flexShrink: 0,
              overflow: 'hidden',
              bgcolor: '#282c33'
            }}>
              <Box sx={{ width: chatWidth, height: '100%' }}>
                <ChatPanel authHeaders={authHeaders} />
              </Box>
            </Box>
          </>
        )}
      </Box>

    </Box>
  )
}
