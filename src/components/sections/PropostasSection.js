import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import DataTable from '../DataTable'

export default function PropostasSection({ data, showValues }) {
  const propostas = data?.propostas || []
  const propostasPipelineTotal = data?.propostasPipelineTotal || 0
  if (propostas.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const twoDaysFromNow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)

  const columns = [
    { field: 'lead', headerName: 'Lead', minWidth: 140 },
    { field: 'empresa', headerName: 'Empresa', minWidth: 120 },
    {
      field: 'valor',
      headerName: 'Valor',
      minWidth: 100,
      mono: true,
      renderCell: row => (
        <Typography variant='body2' sx={{ fontFamily: '"Fira Code", monospace', fontWeight: 600 }}>
          {showValues ? (row.valor > 0 ? `R$${row.valor.toLocaleString('pt-BR')}` : '-') : '•••'}
        </Typography>
      )
    },
    { field: 'data', headerName: 'Data', minWidth: 90, mono: true },
    {
      field: 'followUp',
      headerName: 'Follow-up',
      minWidth: 110,
      renderCell: row => {
        if (!row.followUp) return <Typography variant='body2' sx={{ color: 'text.disabled' }}>-</Typography>
        const isOverdue = row.followUp < today
        const isSoon = !isOverdue && row.followUp <= twoDaysFromNow
        return (
          <Chip
            label={`D+${row.followUpDays} ${row.followUp.slice(5)}`}
            size='small'
            variant='outlined'
            color={isOverdue ? 'error' : isSoon ? 'warning' : 'default'}
            sx={{ height: 20, fontSize: '0.65rem', fontFamily: '"Fira Code", monospace' }}
          />
        )
      }
    },
    {
      field: 'url',
      headerName: 'Link',
      minWidth: 60,
      renderCell: row => row.url ? (
        <Link href={row.url} target='_blank' rel='noopener' sx={{ fontSize: '0.75rem' }}>
          Ver
        </Link>
      ) : (
        <Typography variant='body2' sx={{ color: 'text.disabled' }}>-</Typography>
      )
    }
  ]

  return (
    <Grid item xs={12}>
      <DataTable
        title='Propostas Ativas'
        subtitle={showValues ? `${propostas.length} propostas — R$${propostasPipelineTotal.toLocaleString('pt-BR')} em pipeline` : `${propostas.length} propostas`}
        columns={columns}
        rows={propostas}
        searchable
        defaultRowsPerPage={5}
      />
    </Grid>
  )
}
