import { NavLink } from 'react-router-dom'
import { FaChalkboardTeacher, FaFileInvoiceDollar, FaRegCalendarAlt, FaUserGraduate } from 'react-icons/fa'
import { FiBarChart2, FiBookOpen, FiClipboard, FiGrid, FiLogOut, FiUsers } from 'react-icons/fi'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/students', label: 'Students', icon: FaUserGraduate },
  { to: '/teachers', label: 'Teachers', icon: FaChalkboardTeacher },
  { to: '/classes', label: 'Classes', icon: FiUsers },
  { to: '/attendance', label: 'Attendance', icon: FiClipboard },
  { to: '/results', label: 'Results', icon: FiBookOpen },
  { to: '/fees', label: 'Fees', icon: FaFileInvoiceDollar },
  { to: '/timetable', label: 'Timetable', icon: FaRegCalendarAlt },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">NV</div>
          <div>
            <strong>Nu Vision</strong>
            <small>High School</small>
          </div>
        </div>
        <nav className="nav flex-column gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link" onClick={onClose}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink to="/login" className="nav-link mt-auto logout"><FiLogOut /> Logout</NavLink>
      </aside>
      {open && <button className="sidebar-backdrop d-lg-none" aria-label="Close navigation" onClick={onClose} />}
    </>
  )
}
