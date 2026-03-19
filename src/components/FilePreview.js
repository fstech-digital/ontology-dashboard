import Box from '@mui/material/Box'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const fileIcons = {
  directory: 'tabler:folder-filled',
  md: 'tabler:file-text',
  js: 'tabler:brand-javascript',
  py: 'tabler:brand-python',
  sh: 'tabler:terminal',
  json: 'tabler:braces',
  jsonl: 'tabler:braces',
  yaml: 'tabler:file-settings',
  yml: 'tabler:file-settings',
  html: 'tabler:brand-html5',
  css: 'tabler:brand-css3',
  default: 'tabler:file'
}

export const fileColorsZed = {
  directory: '#a9afbc',
  md: '#a9afbc',
  js: '#a9afbc',
  py: '#a9afbc',
  sh: '#a9afbc',
  json: '#a9afbc',
  jsonl: '#a9afbc',
  default: '#5c6370'
}

export const fileColorsBrowser = {
  directory: '#2469FF',
  md: '#8B7FFC',
  js: '#F59E0B',
  py: '#A3D955',
  sh: '#A3D955',
  json: '#F59E0B',
  jsonl: '#F59E0B',
  default: 'rgba(200,210,230,0.5)'
}

export function getIcon(item) {
  if (item.type === 'directory') return fileIcons.directory
  return fileIcons[item.extension] || fileIcons.default
}

export function getIconColor(item, palette = 'zed') {
  const colors = palette === 'browser' ? fileColorsBrowser : fileColorsZed
  if (item.type === 'directory') return colors.directory
  return colors[item.extension] || colors.default
}

export function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const previewableExtensions = ['md', 'js', 'py', 'sh', 'json', 'jsonl', 'yaml', 'yml', 'html', 'css', 'txt', 'cfg', 'ini', 'env', 'toml']

export function isPreviewable(ext) {
  return previewableExtensions.includes(ext)
}

const mdStyles = {
  '& p': { mb: 1, fontSize: '0.8125rem', lineHeight: 1.6 },
  '& h1': { fontSize: '1.2rem', fontWeight: 600, mt: 2, mb: 1 },
  '& h2': { fontSize: '1rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
  '& h3': { fontSize: '0.9rem', fontWeight: 600, mt: 1, mb: 0.5 },
  '& code': {
    px: 0.5, py: 0.15, borderRadius: 0.5,
    bgcolor: 'rgba(97,175,239,0.1)',
    fontFamily: '"Fira Code", monospace',
    fontSize: '0.8em'
  },
  '& pre': {
    p: 1.5, borderRadius: 1, bgcolor: '#282c33',
    border: '1px solid rgba(70,75,87,0.60)',
    overflow: 'auto',
    '& code': { bgcolor: 'transparent', px: 0, py: 0 }
  },
  '& ul, & ol': { pl: 2.5, mb: 1 },
  '& table': {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem',
    '& th, & td': { px: 1, py: 0.5, borderBottom: '1px solid rgba(70,75,87,0.60)', textAlign: 'left' },
    '& th': { fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }
  }
}

export function FileContentPreview({ content, ext, sx }) {
  if (!content) return null

  if (ext === 'md') {
    return (
      <Box sx={{ ...mdStyles, ...sx }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </Box>
    )
  }

  return (
    <Box component='pre' sx={{
      m: 0,
      fontFamily: '"Fira Code", monospace',
      fontSize: '0.75rem',
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      color: 'text.primary',
      ...sx
    }}>
      {content}
    </Box>
  )
}
