import DataTable from '../../components/Tables/DataTable'
import { useSchool } from '../../context/useSchool'

export default function Attendance() {
  const { attendance, setAttendance, classes, notify } = useSchool()
  const toggleStatus = (row) => {
    setAttendance(attendance.map((item) => item.id === row.id ? { ...item, status: item.status === 'Present' ? 'Absent' : 'Present' } : item))
    notify('Attendance status updated')
  }
  const present = attendance.filter((item) => item.status === 'Present').length

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Attendance Management</h2><p className="text-secondary mb-0">Mark daily attendance and review reports.</p></div><button className="btn btn-primary" onClick={() => notify('Attendance report exported')}>Export Report</button></div>
      <div className="row g-3 mb-3">
        <div className="col-md-4"><div className="panel"><p className="text-secondary mb-1">Today Present</p><h3>{present}</h3></div></div>
        <div className="col-md-4"><div className="panel"><p className="text-secondary mb-1">Today Absent</p><h3>{attendance.length - present}</h3></div></div>
        <div className="col-md-4"><div className="panel"><p className="text-secondary mb-1">Attendance Rate</p><h3>{Math.round((present / attendance.length) * 100)}%</h3></div></div>
      </div>
      <DataTable rows={attendance} filterOptions={classes.map((item) => item.name)} filterKey="className" onEdit={toggleStatus} columns={[
        { key: 'studentId', label: 'Student ID' },
        { key: 'name', label: 'Student' },
        { key: 'className', label: 'Class' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${row.status === 'Present' ? 'text-bg-success' : 'text-bg-danger'}`}>{row.status}</span> },
      ]} />
    </>
  )
}
