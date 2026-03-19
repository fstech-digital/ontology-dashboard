import Grid from '@mui/material/Grid'
import BarChart from '../BarChart'

export default function FinanceiroSection({ data, showValues }) {
  const finMonths = data?.financeiro?.months || []
  if (finMonths.length === 0) return null

  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const categories = finMonths.map(m => {
    const [y, mo] = m.month.split('-')
    return `${names[parseInt(mo) - 1]}/${y.slice(2)}`
  })
  const series = [
    { name: 'Receita', data: finMonths.map(m => m.receita) },
    { name: 'Despesa', data: finMonths.map(m => m.despesa) }
  ]

  return (
    <Grid item xs={12} md={7}>
      <BarChart
        title='Financeiro'
        subtitle='Receita vs Despesa'
        categories={categories}
        series={series}
        height={280}
        columnWidth='50%'
        showValues={showValues}
      />
    </Grid>
  )
}
