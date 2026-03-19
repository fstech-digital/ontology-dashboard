// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'

// ** Custom Components
import Icon from '../@core/components/icon'
import CustomAvatar from '../@core/components/mui/avatar'

const StatsCard = props => {
  const {
    sx,
    icon,
    title,
    stats,
    subtitle,
    trendNumber,
    trend = 'neutral',
    iconColor = 'primary',
    avatarSize = 38
  } = props

  const theme = useTheme()

  return (
    <Card sx={{ ...sx }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant='caption'
              sx={{
                mb: 0.5,
                display: 'block',
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600
              }}
            >
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  fontFamily: '"Fira Code", monospace',
                  lineHeight: 1.2
                }}
              >
                {stats}
              </Typography>
              {trendNumber && (
                <Typography
                  variant='caption'
                  sx={{
                    fontFamily: '"Fira Code", monospace',
                    fontWeight: 500,
                    color: trend === 'positive'
                      ? 'success.main'
                      : trend === 'negative'
                      ? 'error.main'
                      : 'text.disabled'
                  }}
                >
                  {trend === 'positive' ? '+' : ''}{trendNumber}
                </Typography>
              )}
            </Box>
            {subtitle && (
              <Typography variant='caption' sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <CustomAvatar
              skin='light'
              color={iconColor}
              sx={{ width: avatarSize, height: avatarSize }}
            >
              <Icon icon={icon} fontSize='1.25rem' />
            </CustomAvatar>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default StatsCard
