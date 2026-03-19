// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// ** Custom Components
import ReactApexcharts from '../@core/components/react-apexcharts'

const BarChart = props => {
  const {
    sx,
    title,
    subtitle,
    categories,
    series,
    colors,
    height = 300,
    columnWidth = '45%',
    showValues = true
  } = props

  const theme = useTheme()

  const chartColors = colors || [
    theme.palette.primary.main,
    theme.palette.error.main
  ]

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      background: 'transparent'
    },
    theme: { mode: 'dark' },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '11px' },
      y: { formatter: val => showValues ? (val >= 1000 ? `R$${(val / 1000).toFixed(1)}k` : `R$${val}`) : '•••' }
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth,
        barHeight: '70%'
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 1,
      colors: ['transparent']
    },
    grid: {
      show: true,
      borderColor: 'rgba(200, 210, 230, 0.08)',
      padding: { top: -15, left: -4, right: 0, bottom: -8 }
    },
    colors: chartColors,
    xaxis: {
      categories: categories || [],
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '10px',
          fontFamily: '"Fira Code", monospace',
          colors: 'rgba(200, 210, 230, 0.4)'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '10px',
          fontFamily: '"Fira Code", monospace',
          colors: 'rgba(200, 210, 230, 0.4)'
        },
        formatter: val => showValues ? (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val) : '•••'
      }
    },
    legend: {
      show: series && series.length > 1,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: 'rgba(200, 210, 230, 0.6)' },
      fontFamily: 'Inter',
      fontSize: '11px',
      markers: { width: 8, height: 8, radius: 2 },
      itemMargin: { horizontal: 8 }
    },
    fill: { opacity: 0.85 }
  }

  return (
    <Card sx={{ ...sx }}>
      {(title || subtitle) && (
        <CardHeader
          title={<Typography variant='h6'>{title}</Typography>}
          subheader={subtitle && <Typography variant='caption' sx={{ color: 'text.disabled' }}>{subtitle}</Typography>}
        />
      )}
      <CardContent sx={{ pt: 0 }}>
        <ReactApexcharts
          type='bar'
          height={height}
          options={options}
          series={series || []}
        />
      </CardContent>
    </Card>
  )
}

export default BarChart
