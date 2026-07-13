export default function SummaryCard({ title, value, icon: Icon, tone = 'primary', meta }) {
  return (
    <div className="summary-card">
      <div className={`summary-icon text-bg-${tone}`}>
        <Icon aria-hidden="true" />
      </div>
      <div>
        <p className="text-secondary mb-1">{title}</p>
        <h3 className="mb-0">{value}</h3>
        {meta && <small className="text-success fw-semibold">{meta}</small>}
      </div>
    </div>
  )
}
