import { useState } from 'react'
import DataTable from '../../components/Tables/DataTable'
import { useSchool } from '../../context/useSchool'

export default function Fees() {
  const { fees, setFees, students, notify } = useSchool()
  const [form, setForm] = useState({ student: 'Aline Mutesi', paid: 0, balance: 0 })
  const outstanding = fees.reduce((sum, item) => sum + item.balance, 0)

  const save = (event) => {
    event.preventDefault()
    setFees([{ id: `FEE-${Date.now()}`, invoice: `INV-${Date.now().toString().slice(-4)}`, date: new Date().toISOString().slice(0, 10), status: Number(form.balance) > 0 ? 'Partial' : 'Paid', ...form, paid: Number(form.paid), balance: Number(form.balance) }, ...fees])
    notify('Payment recorded')
  }

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Fee Management</h2><p className="text-secondary mb-0">Record payments, track history, and monitor outstanding balances.</p></div><button className="btn btn-outline-primary" onClick={() => notify('Financial report exported')}>Fee Report</button></div>
      <div className="row g-3">
        <div className="col-lg-4"><form className="panel" onSubmit={save}><h3 className="h5 mb-3">Record Payment</h3><label className="form-label">Student</label><select className="form-select mb-2" value={form.student} onChange={(event) => setForm({ ...form, student: event.target.value })}>{students.map((student) => <option key={student.id}>{student.firstName} {student.lastName}</option>)}</select><label className="form-label">Paid Amount</label><input type="number" className="form-control mb-2" value={form.paid} onChange={(event) => setForm({ ...form, paid: event.target.value })} /><label className="form-label">Outstanding Balance</label><input type="number" className="form-control mb-3" value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} /><button className="btn btn-primary w-100">Record Payment</button></form><div className="panel mt-3"><p className="text-secondary mb-1">Outstanding Balances</p><h3>{outstanding.toLocaleString()} RWF</h3></div></div>
        <div className="col-lg-8"><DataTable rows={fees} columns={[{ key: 'invoice', label: 'Invoice' }, { key: 'student', label: 'Student' }, { key: 'paid', label: 'Paid', render: (row) => `${row.paid.toLocaleString()} RWF` }, { key: 'balance', label: 'Balance', render: (row) => `${row.balance.toLocaleString()} RWF` }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${row.status === 'Paid' ? 'text-bg-success' : 'text-bg-warning'}`}>{row.status}</span> }]} /></div>
      </div>
    </>
  )
}
