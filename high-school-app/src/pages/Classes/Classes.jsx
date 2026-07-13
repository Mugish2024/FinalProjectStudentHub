import { useState } from 'react'
import DataTable from '../../components/Tables/DataTable'
import { useSchool } from '../../context/useSchool'

const emptyClass = { id: '', name: '', teacher: '', room: '', students: 0 }

export default function Classes() {
  const { classes, setClasses, students, notify } = useSchool()
  const [form, setForm] = useState(emptyClass)
  const [classStudents, setClassStudents] = useState(null)

  const save = (event) => {
    event.preventDefault()
    const payload = { ...form, id: form.id || `CLS-${form.name.replace(/\s+/g, '-')}` }
    setClasses(classes.some((item) => item.id === payload.id) ? classes.map((item) => item.id === payload.id ? payload : item) : [payload, ...classes])
    setForm(emptyClass)
    notify('Class information saved')
  }

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Class Management</h2><p className="text-secondary mb-0">Create classes, assign teachers, and view enrolled students.</p></div></div>
      <div className="row g-3">
        <div className="col-lg-4">
          <form className="panel" onSubmit={save}>
            <h3 className="h5 mb-3">Create or Edit Class</h3>
            {['name', 'teacher', 'room'].map((key) => <div className="mb-2" key={key}><label className="form-label text-capitalize">{key}</label><input required className="form-control" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>)}
            <label className="form-label">Students</label>
            <input type="number" className="form-control mb-3" value={form.students} onChange={(event) => setForm({ ...form, students: Number(event.target.value) })} />
            <button className="btn btn-primary w-100">Save Class</button>
          </form>
        </div>
        <div className="col-lg-8">
          <DataTable rows={classes} onEdit={setForm} onView={(row) => setClassStudents(row)} columns={[{ key: 'name', label: 'Class' }, { key: 'teacher', label: 'Class Teacher' }, { key: 'room', label: 'Room' }, { key: 'students', label: 'Students' }]} />
        </div>
      </div>
      {classStudents && <div className="panel mt-3"><h3 className="h5">{classStudents.name} Students</h3><div className="row">{students.filter((student) => student.className === classStudents.name).map((student) => <div className="col-md-4" key={student.id}><div className="border rounded p-2 mb-2">{student.firstName} {student.lastName}<small className="d-block text-secondary">{student.email}</small></div></div>)}</div></div>}
    </>
  )
}
