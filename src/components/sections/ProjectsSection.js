import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ProgressCard from '../ProgressCard'

export default function ProjectsSection({ data }) {
  const projects = data?.projects || []
  if (projects.length === 0) return null

  const colors = ['primary', 'success', 'warning', 'info', 'error']

  return (
    <Grid item xs={12}>
      <Box sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        mb: 1.5
      }}>
        <Typography variant='caption' sx={{
          color: 'text.disabled',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600
        }}>
          Projects
        </Typography>
        <Typography variant='caption' sx={{
          color: 'text.disabled',
          fontFamily: '"Fira Code", monospace',
          fontSize: '0.625rem'
        }}>
          {projects.length} active
        </Typography>
      </Box>
      <Grid container spacing={1.5}>
        {projects.map((project, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <ProgressCard
              title={project.name}
              value={project.done}
              total={project.total}
              color={colors[i % colors.length]}
            />
          </Grid>
        ))}
      </Grid>
    </Grid>
  )
}
