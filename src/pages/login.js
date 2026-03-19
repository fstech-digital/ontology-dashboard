import { useState } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('ares_token', data.token)
        router.push('/')
      } else {
        setError('Invalid credentials')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#21252b'
    }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: 360,
          p: 4,
          bgcolor: '#2f343e',
          borderRadius: 2,
          border: '1px solid rgba(70, 75, 87, 0.5)'
        }}
      >
        <Typography variant="h5" sx={{ color: '#dce0e5', mb: 0.5, fontWeight: 700, textAlign: 'center' }}>
          Ontology Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#5c6370', mb: 3, textAlign: 'center' }}>
          Operations control center
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          sx={{ mb: 2, input: { color: '#dce0e5' }, label: { color: '#5c6370' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(70, 75, 87, 0.5)' },
              '&:hover fieldset': { borderColor: '#61afef' },
              '&.Mui-focused fieldset': { borderColor: '#61afef' }
            }
          }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ mb: 3, input: { color: '#dce0e5' }, label: { color: '#5c6370' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(70, 75, 87, 0.5)' },
              '&:hover fieldset': { borderColor: '#61afef' },
              '&.Mui-focused fieldset': { borderColor: '#61afef' }
            }
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#61afef',
            color: '#21252b',
            fontWeight: 600,
            '&:hover': { bgcolor: '#528bcc' }
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </Box>
    </Box>
  )
}
