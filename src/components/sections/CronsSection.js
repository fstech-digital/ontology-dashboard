import Grid from '@mui/material/Grid'
import CronPanel from '../CronPanel'

export default function CronsSection({ data }) {
  const crons = data?.crons || []
  if (crons.length === 0) return null

  return (
    <Grid item xs={12}>
      <CronPanel crons={crons} />
    </Grid>
  )
}
