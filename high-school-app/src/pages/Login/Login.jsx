import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiLock, FiMail } from 'react-icons/fi'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) navigate('/dashboard')
  }

  return (
    <section className="auth-page">
      <div className="auth-hero">
        <div className="school-logo mb-4">NV</div>
        <h1 className="display-5 fw-bold">Welcome to Nu Vision High School</h1>
        <p className="lead col-lg-9">Manage students, staff, attendance, results, fees, reports, and timetables from one responsive dashboard.</p>
      </div>
      <form className="auth-card needs-validation" onSubmit={submit} noValidate>
        <h2 className="fw-bold mb-1">Sign in</h2>
        <p className="text-secondary mb-4">Use your school administrator account.</p>
        <label className="form-label">Email address</label>
        <div className="input-group mb-1">
          <span className="input-group-text"><FiMail /></span>
          <input className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@nuvision.edu" />
        </div>
        {errors.email && <div className="invalid-feedback d-block mb-3">{errors.email}</div>}
        <label className="form-label">Password</label>
        <div className="input-group mb-1">
          <span className="input-group-text"><FiLock /></span>
          <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="minimum 6 characters" />
        </div>
        {errors.password && <div className="invalid-feedback d-block mb-3">{errors.password}</div>}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="remember" />
            <label className="form-check-label" htmlFor="remember">Remember me</label>
          </div>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button className="btn btn-primary w-100 py-2">Login</button>
      </form>
    </section>
  )
}
