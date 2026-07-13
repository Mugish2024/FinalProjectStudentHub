import { useState } from 'react'
import DataTable from '../../components/Tables/DataTable'
import { useSchool } from '../../context/useSchool'
import { subjects } from '../../services/mockData'

const emptyTeacher = { id: '', fullName: '', subject: 'Mathematics', qualification: '', phone: '', email: '', address: '' }

export default function Teachers() {
  const { teachers, setTeachers, notify } = useSchool()
  const [form, setForm] = useState(emptyTeacher)
  const save = (event) => {
    event.preventDefault()
    const payload = { ...form, id: form.id || `TCH-${Date.now().toString().slice(-3)}` }
    setTeachers(teachers.some((item) => item.id === payload.id) ? teachers.map((item) => item.id === payload.id ? payload : item) : [payload, ...teachers])
    setForm(emptyTeacher)
    notify('Teacher record saved')
  }

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Teacher Management</h2><p className="text-secondary mb-0">Maintain teacher profiles and subject assignments.</p></div></div>
      <div className="row g-3">
        <div className="col-lg-4"><form className="panel" onSubmit={save}><h3 className="h5 mb-3">Add or Edit Teacher</h3>{['id', 'fullName', 'qualification', 'phone', 'email', 'address'].map((key) => <div className="mb-2" key={key}><label className="form-label text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</label><input required={key !== 'id'} className="form-control" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>)}<label className="form-label">Subject</label><select className="form-select mb-3" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select><button className="btn btn-primary w-100">Save Teacher</button></form></div>
        <div className="col-lg-8"><DataTable rows={teachers} onEdit={setForm} onDelete={(teacher) => { setTeachers(teachers.filter((item) => item.id !== teacher.id)); notify('Teacher deleted', 'warning') }} columns={[{ key: 'id', label: 'ID' }, { key: 'fullName', label: 'Full Name' }, { key: 'subject', label: 'Subject' }, { key: 'qualification', label: 'Qualification' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }]} /></div>
      </div>
    </>
  )
}
