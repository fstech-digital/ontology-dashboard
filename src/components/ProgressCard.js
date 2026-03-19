// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

const ProgressCard = props => {
  const {
    sx,
    title,
    subtitle,
    value,
    total,
    percentage,
    color = 'primary'
  } = props

  const calculatedPercentage = percentage || (total ? (value / total) * 100 : 0)

  return (
    <Card sx={{ ...sx }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant='body2' sx={{ fontWeight: 500, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography
            variant='caption'
            sx={{
              fontFamily: '"Fira Code", monospace',
              fontWeight: 600,
              color: calculatedPercentage >= 80 ? 'success.main' : calculatedPercentage >= 50 ? 'warning.main' : 'text.secondary'
            }}
          >
            {Math.round(calculatedPercentage)}%
          </Typography>
        </Box>

        <LinearProgress
          variant='determinate'
          value={calculatedPercentage}
          color={color}
          sx={{ mb: 1 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='caption' sx={{ color: 'text.disabled', fontFamily: '"Fira Code", monospace' }}>
            {value}/{total}
          </Typography>
          {subtitle && (
            <Typography variant='caption' sx={{ color: 'text.disabled' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProgressCard
