import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi'

export default function DataTable({ columns, rows, searchable = true, filterOptions = [], filterKey, pageSize = 5, onView, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(() => {
    const haystack = (row) => Object.values(row).join(' ').toLowerCase()
    return rows.filter((row) => {
      const matchesQuery = haystack(row).includes(query.toLowerCase())
      const matchesFilter = filter === 'All' || row[filterKey] === filter
      return matchesQuery && matchesFilter
    })
  }, [rows, query, filter, filterKey])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const updateQuery = (value) => {
    setQuery(value)
    setPage(1)
  }

  const updateFilter = (value) => {
    setFilter(value)
    setPage(1)
  }

  return (
    <div className="table-shell">
      <div className="table-toolbar">
        {searchable && (
          <div className="input-group search-box">
            <span className="input-group-text"><FiSearch /></span>
            <input className="form-control" placeholder="Search records" value={query} onChange={(event) => updateQuery(event.target.value)} />
          </div>
        )}
        {filterOptions.length > 0 && (
          <select className="form-select filter-select" value={filter} onChange={(event) => updateFilter(event.target.value)}>
            <option>All</option>
            {filterOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        )}
      </div>
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              {(onView || onEdit || onDelete) && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
                {(onView || onEdit || onDelete) && (
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {onView && <button className="btn btn-outline-primary" onClick={() => onView(row)}>View</button>}
                      {onEdit && <button className="btn btn-outline-secondary" onClick={() => onEdit(row)}>Edit</button>}
                      {onDelete && <button className="btn btn-outline-danger" onClick={() => onDelete(row)}>Delete</button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="text-center text-secondary py-4">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-row">
        <span className="text-secondary small">Showing {visibleRows.length} of {filteredRows.length} records</span>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><FiChevronLeft /></button>
          <button className="btn btn-light" disabled>{page} / {totalPages}</button>
          <button className="btn btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}><FiChevronRight /></button>
        </div>
      </div>
    </div>
  )
}
