import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa'
import { FiBookOpen, FiCheckCircle, FiUsers } from 'react-icons/fi'
import SummaryCard from '../../components/Cards/SummaryCard'
import { activities, subjects } from '../../services/mockData'
import { useSchool } from '../../context/useSchool'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

export default function Dashboard() {
  const { students, teachers, classes, notify } = useSchool()
  const avgAttendance = Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
  const perClass = classes.map((item) => item.students)

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
          <p className="text-secondary mb-0">Live overview of school operations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => notify('Daily school summary generated')}>Generate Summary</button>
      </div>
      <div className="summary-grid">
        <SummaryCard title="Total Students" value={students.length + 189} icon={FaUserGraduate} meta="+12 this term" />
        <SummaryCard title="Total Teachers" value={teachers.length + 28} icon={FaChalkboardTeacher} tone="info" />
        <SummaryCard title="Total Classes" value={classes.length} icon={FiUsers} tone="success" />
        <SummaryCard title="Total Subjects" value={subjects.length} icon={FiBookOpen} tone="warning" />
        <SummaryCard title="Attendance Rate" value={`${avgAttendance}%`} icon={FiCheckCircle} tone="primary" meta="+3.4%" />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 mb-0">Student Statistics</h3>
            <span className="badge text-bg-primary">2026 Term 2</span>
          </div>
          <Bar data={{ labels: classes.map((item) => item.name), datasets: [{ label: 'Students', data: perClass, backgroundColor: '#0f5fb7', borderRadius: 6 }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="panel">
          <h3 className="h5 mb-3">Attendance Mix</h3>
          <Doughnut data={{ labels: ['Present', 'Absent'], datasets: [{ data: [avgAttendance, 100 - avgAttendance], backgroundColor: ['#0f5fb7', '#f59e0b'] }] }} />
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <h3 className="h5 mb-3">Academic Performance</h3>
          <Line data={{ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Average GPA', data: [3.1, 3.2, 3.35, 3.28, 3.45, 3.6], borderColor: '#0f5fb7', backgroundColor: '#e8f2ff', tension: 0.35 }] }} />
        </div>
        <div className="panel">
          <h3 className="h5 mb-3">Recent Activities</h3>
          <div className="list-group list-group-flush mb-4">
            {activities.map((activity) => <div className="list-group-item px-0" key={activity}>{activity}</div>)}
          </div>
          <h3 className="h6">Quick Actions</h3>
          <div className="quick-actions">
            {['Add Student', 'Mark Attendance', 'Record Payment', 'Create Timetable'].map((action) => <button key={action} className="btn btn-outline-primary" onClick={() => notify(`${action} opened`)}>{action}</button>)}
          </div>
        </div>
      </div>
    </>
  )
}
