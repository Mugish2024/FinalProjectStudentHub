import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    if (/\S+@\S+\.\S+/.test(email)) setSent(true)
  }

  return (
    <section className="auth-page">
      <div className="auth-hero">
        <div className="school-logo mb-4">NV</div>
        <h1 className="display-5 fw-bold">Reset administrator access</h1>
        <p className="lead col-lg-9">Enter your email and the system will send password recovery instructions.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2 className="fw-bold mb-3">Forgot password</h2>
        {sent && <div className="alert alert-success">Recovery instructions sent to {email}.</div>}
        <label className="form-label">School email</label>
        <input className="form-control mb-3" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@nuvision.edu" />
        <button className="btn btn-primary w-100 py-2 mb-3">Send reset link</button>
        <Link to="/login">Back to login</Link>
      </form>
    </section>
  )
}
