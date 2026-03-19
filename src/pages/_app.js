import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import DefaultPalette from '../@core/theme/palette'
import ThreeColumnLayout from '../layouts/ThreeColumnLayout'
import themeConfig from '../../theme.config.json'
import dashConfig from '../../dashboard.config.json'

const palette = DefaultPalette()
const typo = themeConfig.typography || {}
const scroll = themeConfig.scrollbar || {}
const border = themeConfig.border || {}

const theme = createTheme({
  palette,
  typography: {
    fontFamily: typo.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: typo.fontFamilyMono || '"Fira Code", "IBM Plex Mono", monospace',
    h4: { fontWeight: 600, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '0.95rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.7rem', letterSpacing: '0.02em' }
  },
  shape: {
    borderRadius: typo.borderRadius || 6
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: themeConfig.backgrounds?.body || '#282c33',
          scrollbarColor: `${scroll.thumb || '#464b57'} ${scroll.track || '#282c33'}`,
          '&::-webkit-scrollbar': { width: scroll.width || 6 },
          '&::-webkit-scrollbar-track': { background: scroll.track || '#282c33' },
          '&::-webkit-scrollbar-thumb': { background: scroll.thumb || '#464b57', borderRadius: 3 }
        }
      }
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${border.card || 'rgba(70, 75, 87, 0.50)'}`,
          transition: 'border-color 0.2s ease',
          '&:hover': {
            borderColor: border.cardHover || 'rgba(70, 75, 87, 0.80)'
          }
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, '&:last-child': { paddingBottom: 16 } }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { padding: '12px 16px' }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.7rem' }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: '0.8125rem', padding: '8px 12px' },
        head: {
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.675rem',
          letterSpacing: '0.06em',
          color: themeConfig.text?.disabled || 'rgba(169, 175, 188, 0.55)'
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 4, borderRadius: 2 },
        bar: { borderRadius: 2 }
      }
    }
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.25)',
    '0 1px 4px rgba(0,0,0,0.30)',
    '0 2px 6px rgba(0,0,0,0.30)',
    '0 2px 8px rgba(0,0,0,0.30)',
    '0 3px 10px rgba(0,0,0,0.35)',
    '0 4px 12px rgba(0,0,0,0.35)',
    '0 4px 14px rgba(0,0,0,0.35)',
    '0 6px 18px rgba(0,0,0,0.40)',
    '0 6px 18px rgba(0,0,0,0.40)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)',
    '0 8px 24px rgba(0,0,0,0.45)'
  ]
})

const pageTitle = dashConfig.instance?.title || 'Dashboard'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  const isLoginPage = router.pathname === '/login'

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true)
      return
    }
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setAuthenticated(true)
        } else {
          router.replace('/login')
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setAuthChecked(true))
  }, [router.pathname])

  const content = isLoginPage
    ? <Component {...pageProps} />
    : authChecked && authenticated
      ? <ThreeColumnLayout><Component {...pageProps} /></ThreeColumnLayout>
      : null

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{pageTitle}</title>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
        />
      </Head>
      <CssBaseline />
      {content}
    </ThemeProvider>
  )
}
