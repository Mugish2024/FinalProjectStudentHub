import { useState } from 'react'
import DataTable from '../../components/Tables/DataTable'
import { useSchool } from '../../context/useSchool'

const emptyStudent = { id: '', firstName: '', lastName: '', gender: 'Female', dob: '', className: 'Grade 10A', parentName: '', parentPhone: '', address: '', email: '', photo: '', attendance: 90, balance: 0 }

export default function Students() {
  const { students, setStudents, classes, notify } = useSchool()
  const [form, setForm] = useState(emptyStudent)
  const [selected, setSelected] = useState(null)

  const save = (event) => {
    event.preventDefault()
    const payload = { ...form, id: form.id || `STU-${Date.now().toString().slice(-4)}`, photo: form.photo || `https://i.pravatar.cc/120?u=${form.email}` }
    setStudents(students.some((student) => student.id === payload.id) ? students.map((student) => student.id === payload.id ? payload : student) : [payload, ...students])
    setForm(emptyStudent)
    notify('Student record saved')
  }

  const edit = (student) => setForm(student)
  const remove = (student) => {
    setStudents(students.filter((item) => item.id !== student.id))
    notify('Student deleted', 'warning')
  }

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Student Management</h2><p className="text-secondary mb-0">Add, edit, delete, view, search, and filter students.</p></div></div>
      <div className="row g-3">
        <div className="col-xl-4">
          <form className="panel" onSubmit={save}>
            <h3 className="h5 mb-3">{form.id ? 'Edit Student' : 'Add Student'}</h3>
            <div className="row g-2">
              {['firstName', 'lastName', 'parentName', 'parentPhone', 'email', 'address', 'photo'].map((key) => (
                <div className="col-12" key={key}><label className="form-label text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</label><input required={key !== 'photo'} className="form-control" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>
              ))}
              <div className="col-md-6"><label className="form-label">Student ID</label><input className="form-control" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /></div>
              <div className="col-md-6"><label className="form-label">Date of Birth</label><input required type="date" className="form-control" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} /></div>
              <div className="col-md-6"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option>Female</option><option>Male</option></select></div>
              <div className="col-md-6"><label className="form-label">Class</label><select className="form-select" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })}>{classes.map((item) => <option key={item.id}>{item.name}</option>)}</select></div>
            </div>
            <button className="btn btn-primary w-100 mt-3">Save Student</button>
          </form>
        </div>
        <div className="col-xl-8">
          <DataTable rows={students} filterOptions={classes.map((item) => item.name)} filterKey="className" onView={setSelected} onEdit={edit} onDelete={remove} columns={[
            { key: 'name', label: 'Student', render: (row) => <div className="d-flex align-items-center gap-2"><img src={row.photo} className="avatar" alt="" /><span>{row.firstName} {row.lastName}<small className="d-block text-secondary">{row.id}</small></span></div> },
            { key: 'gender', label: 'Gender' },
            { key: 'className', label: 'Class' },
            { key: 'parentPhone', label: 'Parent Phone' },
            { key: 'attendance', label: 'Attendance', render: (row) => `${row.attendance}%` },
          ]} />
        </div>
      </div>
      {selected && <div className="modal d-block" tabIndex="-1"><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Student Details</h5><button className="btn-close" onClick={() => setSelected(null)} /></div><div className="modal-body"><img src={selected.photo} className="avatar mb-3" alt="" /><p><strong>Name:</strong> {selected.firstName} {selected.lastName}</p><p><strong>Email:</strong> {selected.email}</p><p><strong>Address:</strong> {selected.address}</p><p><strong>Parent:</strong> {selected.parentName} ({selected.parentPhone})</p></div></div></div></div>}
    </>
  )
}
