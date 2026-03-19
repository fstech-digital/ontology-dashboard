import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import DataTable from '../DataTable'

const leadColumns = [
  { field: 'lead', headerName: 'Lead', minWidth: 140 },
  { field: 'empresa', headerName: 'Company', minWidth: 120 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 80,
    renderCell: row => (
      <Chip
        label={row.status}
        size='small'
        color={(row.status === 'Ativo' || row.status === 'Active') ? 'success' : 'default'}
        variant='outlined'
        sx={{ height: 20, fontSize: '0.65rem' }}
      />
    )
  },
  { field: 'ultimoContato', headerName: 'Last Contact', minWidth: 100, mono: true }
]

export default function PipelineSection({ data, loading }) {
  return (
    <Grid item xs={12} md={5}>
      <DataTable
        title='Pipeline'
        subtitle={`${data?.leads?.length || 0} active leads`}
        columns={leadColumns}
        rows={data?.leads || []}
        loading={loading}
        searchable
        defaultRowsPerPage={5}
      />
    </Grid>
  )
}
