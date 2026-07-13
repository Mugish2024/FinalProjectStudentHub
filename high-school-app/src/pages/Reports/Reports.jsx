import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { useSchool } from '../../context/useSchool'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function Reports() {
  const { students, attendance, fees, results, notify } = useSchool()
  const paid = fees.reduce((sum, item) => sum + item.paid, 0)
  const balance = fees.reduce((sum, item) => sum + item.balance, 0)

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Reports Module</h2><p className="text-secondary mb-0">Generate student, attendance, financial, and academic reports.</p></div><button className="btn btn-primary" onClick={() => notify('All reports generated')}>Generate Reports</button></div>
      <div className="summary-grid mb-3">
        <div className="panel"><p className="text-secondary mb-1">Student Reports</p><h3>{students.length}</h3></div>
        <div className="panel"><p className="text-secondary mb-1">Attendance Reports</p><h3>{attendance.length}</h3></div>
        <div className="panel"><p className="text-secondary mb-1">Financial Reports</p><h3>{paid.toLocaleString()} RWF</h3></div>
        <div className="panel"><p className="text-secondary mb-1">Academic Reports</p><h3>{results.length}</h3></div>
        <div className="panel"><p className="text-secondary mb-1">Open Balance</p><h3>{balance.toLocaleString()} RWF</h3></div>
      </div>
      <div className="dashboard-grid">
        <div className="panel"><h3 className="h5 mb-3">Academic Performance Reports</h3><Bar data={{ labels: results.map((item) => item.student), datasets: [{ label: 'GPA', data: results.map((item) => item.gpa), backgroundColor: '#0f5fb7', borderRadius: 6 }] }} options={{ scales: { y: { max: 4 } } }} /></div>
        <div className="panel"><h3 className="h5 mb-3">Financial Reports</h3><Pie data={{ labels: ['Paid', 'Outstanding'], datasets: [{ data: [paid, balance], backgroundColor: ['#0f5fb7', '#f59e0b'] }] }} /></div>
      </div>
    </>
  )
}
