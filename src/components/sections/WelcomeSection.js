import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Icon from '../../@core/components/icon'
import WelcomeCard from '../WelcomeCard'
import StatsCard from '../StatsCard'

export default function WelcomeSection({ data, showValues, maskR$, onRefresh, onToggleValues }) {
  const agentCount = data?.agents?.length || 0
  const pipelineCount = data?.leads?.length || 0
  const pendingTasks = data?.heartbeat?.pending || 0
  const receitaYTD = data?.receitaYTD || 0
  const propostasPipelineTotal = data?.propostasPipelineTotal || 0
  const propostas = data?.propostas || []

  return (
    <>
      <Grid item xs={12}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={onRefresh}
            size='small'
            title='Refresh data'
            sx={{
              position: 'absolute',
              top: 6,
              right: 34,
              color: 'text.disabled',
              '&:hover': { color: 'text.secondary' }
            }}
          >
            <Icon icon='tabler:refresh' fontSize={16} />
          </IconButton>
          <WelcomeCard
            userName={data?.instance?.user?.name || 'Operator'}
            userRole={data?.instance?.user?.role || ''}
            companyName={data?.instance?.name || 'Dashboard'}
            message={`${agentCount} agents | ${pipelineCount} leads | ${pendingTasks} pending`}
            stats={[
              { value: agentCount, label: 'Agents' },
              { value: pipelineCount, label: 'Pipeline' },
              { value: maskR$(receitaYTD > 0 ? `$${receitaYTD.toLocaleString()}` : 'No data'), label: 'Revenue YTD' }
            ]}
          />
          <IconButton
            onClick={onToggleValues}
            size='small'
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              color: 'text.disabled',
              '&:hover': { color: 'text.secondary' }
            }}
          >
            <Icon icon={showValues ? 'tabler:eye' : 'tabler:eye-off'} fontSize={16} />
          </IconButton>
        </Box>
      </Grid>

      <Grid item xs={6} md={3}>
        <StatsCard title='Agents' stats={agentCount} subtitle='active fleet' />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatsCard
          title='Proposals'
          stats={maskR$(propostasPipelineTotal > 0 ? `$${propostasPipelineTotal.toLocaleString()}` : '0')}
          subtitle={`${propostas.length} active`}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatsCard title='Pending' stats={pendingTasks} subtitle='HEARTBEAT.md' />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatsCard
          title='Revenue'
          stats={maskR$(receitaYTD > 0 ? `$${receitaYTD.toLocaleString()}` : 'No data')}
          subtitle='YTD 2026'
        />
      </Grid>
    </>
  )
}
