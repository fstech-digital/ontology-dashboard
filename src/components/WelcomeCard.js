// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const WelcomeCard = props => {
  const {
    sx,
    userName,
    userRole,
    companyName,
    greeting,
    message,
    stats
  } = props

  const getGreeting = () => {
    if (greeting) return greeting
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Card sx={{
      background: 'rgba(47, 52, 62, 0.60)',
      border: '1px solid rgba(70, 75, 87, 0.50)',
      ...sx
    }}>
      <CardContent sx={{ py: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant='h5' sx={{ color: 'text.primary' }}>
              {getGreeting()}, {userName}
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
              {userRole} {companyName && `| ${companyName}`}
              {message && ` — ${message}`}
            </Typography>
          </Box>

          {stats && stats.length > 0 && (
            <Box sx={{ display: 'flex', gap: 4 }}>
              {stats.map((stat, index) => (
                <Box key={index} sx={{ textAlign: 'right' }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      fontFamily: '"Fira Code", monospace',
                      color: 'primary.main',
                      lineHeight: 1.2
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default WelcomeCard
