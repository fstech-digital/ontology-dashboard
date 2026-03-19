import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import dashConfig from '../../dashboard.config.json'
import { resolveSections } from '../lib/section-registry'

const REFRESH_INTERVAL = dashConfig.layout?.refreshInterval || 60000

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showValues, setShowValues] = useState(true)

  const maskR$ = val => showValues ? val : '•••'

  const fetchData = async () => {
    try {
      const res = await fetch('/api/ontology')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  const sections = resolveSections(dashConfig.sections)

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, height: '100%' }}>
      <Grid container spacing={2}>
        {sections.map(({ id, Component }) => (
          <Component
            key={id}
            data={data}
            loading={loading}
            showValues={showValues}
            maskR$={maskR$}
            onRefresh={fetchData}
            onToggleValues={() => setShowValues(v => !v)}
          />
        ))}
      </Grid>
    </Box>
  )
}
