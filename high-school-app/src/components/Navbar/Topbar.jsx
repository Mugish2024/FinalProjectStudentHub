import { FiBell, FiMenu, FiSearch } from 'react-icons/fi'

export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <button className="btn btn-outline-primary d-lg-none" onClick={onMenuClick} aria-label="Open navigation"><FiMenu /></button>
      <div>
        <p className="text-secondary mb-0">Welcome back</p>
        <h1 className="h4 mb-0">Nu Vision High School</h1>
      </div>
      <div className="topbar-actions">
        <div className="input-group d-none d-md-flex">
          <span className="input-group-text"><FiSearch /></span>
          <input className="form-control" placeholder="Search dashboard" />
        </div>
        <button className="btn btn-light position-relative" aria-label="Notifications">
          <FiBell />
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">3</span>
        </button>
      </div>
    </header>
  )
}
