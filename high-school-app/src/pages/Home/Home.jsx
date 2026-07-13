import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiPhone, FiUsers } from 'react-icons/fi'

const points = [
  { left: '48%', top: '56%' },
  { left: '56%', top: '48%' },
  { left: '63%', top: '58%' },
  { left: '71%', top: '45%' },
  { left: '80%', top: '52%' },
  { left: '87%', top: '36%' },
  { left: '92%', top: '60%' },
]

export default function Home() {
  return (
    <main className="home-page">
      <nav className="home-nav">
        <Link className="home-brand" to="/">
          <div className="home-logo">NV</div>
          <span>Nu Vision High School</span>
        </Link>
        <div className="home-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <Link className="btn btn-primary px-4" to="/login">Sign In</Link>
        </div>
      </nav>

      <section className="home-hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow">StudentHub</div>
          <h1>Nu Vision High School</h1>
          <div className="hero-rule" />
          <p>
            Manage students, attendance, academic results, payments, reports, and class schedules in one trusted digital school portal.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/login">Get Started <FiArrowRight /></Link>
            <a className="btn btn-outline-secondary btn-lg" href="#about">Learn More <FiArrowRight /></a>
          </div>
        </div>

        <div className="hero-network" aria-hidden="true">
          <span className="network-line line-1" />
          <span className="network-line line-2" />
          <span className="network-line line-3" />
          <span className="network-line line-4" />
          {points.map((point, index) => (
            <span className="network-dot" style={point} key={index} />
          ))}
          <div className="network-bubble bubble-top">Track learning progress with confidence.</div>
          <div className="network-bubble bubble-bottom">Support every student before gaps grow.</div>
        </div>
      </section>

      <section className="home-section" id="about">
        <div className="section-kicker">Inside StudentHub</div>
        <h2>Everything a school needs, arranged with clarity</h2>
        <div className="home-feature-grid">
          <div>
            <FiUsers />
            <h3>Student and staff records</h3>
            <p>Keep admissions, parent details, teacher profiles, and class assignments organized.</p>
          </div>
          <div>
            <FiCheckCircle />
            <h3>Attendance and academics</h3>
            <p>Mark daily attendance, add marks, calculate GPA, and generate report cards.</p>
          </div>
          <div>
            <FiPhone />
            <h3>Finance and communication</h3>
            <p>Record fee payments, monitor balances, and keep administrators informed.</p>
          </div>
        </div>
      </section>

      <section className="home-contact" id="contact">
        <div>
          <div className="section-kicker">Contact</div>
          <h2>Ready to manage Nu Vision High School?</h2>
        </div>
        <Link className="btn btn-primary btn-lg" to="/login">Sign In <FiArrowRight /></Link>
      </section>
    </main>
  )
}
