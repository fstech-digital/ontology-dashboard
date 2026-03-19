import Grid from '@mui/material/Grid'
import DataTable from '../DataTable'

export default function GitLogSection({ data }) {
  const gitLog = data?.gitLog || []
  if (gitLog.length === 0) return null

  return (
    <Grid item xs={12}>
      <DataTable
        title='Commits'
        columns={[
          { field: 'hash', headerName: 'Hash', width: 90, mono: true },
          { field: 'message', headerName: 'Mensagem', minWidth: 400 }
        ]}
        rows={gitLog.map((c, i) => ({ id: i, ...c }))}
        defaultRowsPerPage={5}
      />
    </Grid>
  )
}
