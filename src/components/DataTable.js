// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { useTheme } from '@mui/material/styles'

// ** Custom Components
import Icon from '../@core/components/icon'

const DataTable = props => {
  const {
    sx,
    title,
    subtitle,
    columns,
    rows,
    loading = false,
    searchable = false,
    rowsPerPageOptions = [5, 10, 25],
    defaultRowsPerPage = 5,
    emptyMessage = 'Sem dados'
  } = props

  const theme = useTheme()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRows = searchable && searchTerm
    ? rows.filter(row =>
        columns.some(col => {
          const value = row[col.field]
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    : rows

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Card sx={{ ...sx }}>
      <CardHeader
        title={
          <Box>
            <Typography variant='h6'>{title}</Typography>
            {subtitle && (
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        }
        action={
          searchable && (
            <TextField
              size='small'
              placeholder='Search...'
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0) }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler:search' fontSize='1rem' />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '0.8125rem',
                  bgcolor: 'background.default',
                  '& fieldset': { borderColor: 'divider' }
                }
              }}
              sx={{ width: 180 }}
            />
          )
        }
        sx={{ '& .MuiCardHeader-action': { m: 0 } }}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(200, 210, 230, 0.04)' }}>
                {columns.map(column => (
                  <TableCell
                    key={column.field}
                    align={column.align || 'left'}
                    sx={{ width: column.width, minWidth: column.minWidth }}
                  >
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(rowsPerPage)].map((_, index) => (
                  <TableRow key={index}>
                    {columns.map(column => (
                      <TableCell key={column.field}>
                        <Skeleton animation='wave' sx={{ bgcolor: 'grey.200' }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align='center'>
                    <Typography variant='caption' sx={{ py: 3, display: 'block', color: 'text.disabled' }}>
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, rowIndex) => (
                  <TableRow
                    key={row.id || rowIndex}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:last-child td': { border: 0 }
                    }}
                  >
                    {columns.map(column => (
                      <TableCell key={column.field} align={column.align || 'left'}>
                        {column.renderCell
                          ? column.renderCell(row)
                          : <Typography variant='body2' sx={{ fontFamily: column.mono ? '"Fira Code", monospace' : 'inherit' }}>
                              {row[column.field]}
                            </Typography>
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && filteredRows.length > 0 && (
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component='div'
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
            labelRowsPerPage=''
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.7rem'
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default DataTable
