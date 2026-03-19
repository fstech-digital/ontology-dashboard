import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ToolCallBlock from './ToolCallBlock'

const markdownComponents = {
  p: ({ children }) => (
    <Typography variant='body2' sx={{ mb: 1, lineHeight: 1.6, '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  ),
  h1: ({ children }) => <Typography variant='h5' sx={{ mt: 2, mb: 1 }}>{children}</Typography>,
  h2: ({ children }) => <Typography variant='h6' sx={{ mt: 1.5, mb: 0.75 }}>{children}</Typography>,
  h3: ({ children }) => <Typography variant='subtitle1' sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>{children}</Typography>,
  ul: ({ children }) => <Box component='ul' sx={{ pl: 2.5, mb: 1, '& li': { mb: 0.25 } }}>{children}</Box>,
  ol: ({ children }) => <Box component='ol' sx={{ pl: 2.5, mb: 1, '& li': { mb: 0.25 } }}>{children}</Box>,
  li: ({ children }) => <Typography component='li' variant='body2' sx={{ lineHeight: 1.5 }}>{children}</Typography>,
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <Box component='code' sx={{
          px: 0.5,
          py: 0.15,
          borderRadius: 0.5,
          bgcolor: 'rgba(36,105,255,0.1)',
          fontFamily: '"Fira Code", monospace',
          fontSize: '0.8em',
          color: '#8B7FFC'
        }}>
          {children}
        </Box>
      )
    }
    return (
      <Box component='pre' sx={{
        p: 1.5,
        my: 1,
        borderRadius: 1,
        bgcolor: '#0A0E17',
        border: '1px solid rgba(200,210,230,0.08)',
        overflow: 'auto',
        maxHeight: 400
      }}>
        <Box component='code' sx={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '0.75rem',
          lineHeight: 1.5,
          color: 'text.primary'
        }}>
          {children}
        </Box>
      </Box>
    )
  },
  table: ({ children }) => (
    <Box sx={{ overflow: 'auto', my: 1 }}>
      <Box component='table' sx={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.8rem',
        '& th, & td': {
          px: 1,
          py: 0.5,
          borderBottom: '1px solid rgba(200,210,230,0.08)',
          textAlign: 'left'
        },
        '& th': {
          fontWeight: 600,
          color: 'text.secondary',
          fontSize: '0.7rem',
          textTransform: 'uppercase'
        }
      }}>
        {children}
      </Box>
    </Box>
  ),
  blockquote: ({ children }) => (
    <Box sx={{
      borderLeft: '3px solid #2469FF',
      pl: 1.5,
      my: 1,
      color: 'text.secondary'
    }}>
      {children}
    </Box>
  ),
  strong: ({ children }) => (
    <Box component='strong' sx={{ fontWeight: 600, color: 'text.primary' }}>{children}</Box>
  ),
  a: ({ href, children }) => (
    <Box component='a' href={href} target='_blank' rel='noopener' sx={{
      color: '#2469FF',
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' }
    }}>
      {children}
    </Box>
  )
}

export default function ChatMessage({ role, content, toolCalls }) {
  const isUser = role === 'user'

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2,
      px: 1
    }}>
      <Box sx={{
        maxWidth: isUser ? '70%' : '85%',
        minWidth: 0
      }}>
        {/* Role label */}
        <Typography variant='caption' sx={{
          color: 'text.disabled',
          fontSize: '0.6rem',
          mb: 0.5,
          display: 'block',
          textAlign: isUser ? 'right' : 'left'
        }}>
          {isUser ? 'You' : 'Assistant'}
        </Typography>

        {/* Message body */}
        <Box sx={{
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isUser ? 'rgba(36,105,255,0.12)' : 'rgba(200,210,230,0.04)',
          border: '1px solid',
          borderColor: isUser ? 'rgba(36,105,255,0.2)' : 'rgba(200,210,230,0.08)'
        }}>
          {isUser ? (
            <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
              {content}
            </Typography>
          ) : (
            <>
              {toolCalls && toolCalls.map((tc, i) => (
                <ToolCallBlock
                  key={tc.id || i}
                  name={tc.name}
                  input={tc.input}
                  result={tc.result}
                  status={tc.status}
                />
              ))}
              {content && (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
