import { useState } from 'react'
import DataTable from '../../components/Tables/DataTable'
import { useSchool } from '../../context/useSchool'
import { subjects } from '../../services/mockData'

const gradeFromMarks = (marks) => marks >= 85 ? 'A' : marks >= 75 ? 'B+' : marks >= 65 ? 'B' : marks >= 50 ? 'C' : 'D'
const gpaFromMarks = (marks) => Number(Math.min(4, Math.max(1, marks / 25)).toFixed(1))

export default function Results() {
  const { results, setResults, students, notify } = useSchool()
  const [form, setForm] = useState({ student: students[0]?.firstName + ' ' + students[0]?.lastName, className: students[0]?.className, subject: subjects[0], marks: 80 })
  const save = (event) => {
    event.preventDefault()
    setResults([{ id: `RES-${Date.now()}`, ...form, marks: Number(form.marks), grade: gradeFromMarks(form.marks), gpa: gpaFromMarks(form.marks) }, ...results])
    notify('Marks saved and GPA calculated')
  }
  const average = (results.reduce((sum, item) => sum + item.gpa, 0) / results.length).toFixed(2)

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Results Management</h2><p className="text-secondary mb-0">Add marks, update performance, and generate report cards.</p></div><button className="btn btn-outline-primary" onClick={() => notify('Report cards generated')}>Generate Report Cards</button></div>
      <div className="row g-3">
        <div className="col-lg-4"><form className="panel" onSubmit={save}><h3 className="h5 mb-3">Add Marks</h3><label className="form-label">Student</label><select className="form-select mb-2" value={form.student} onChange={(event) => { const student = students.find((item) => `${item.firstName} ${item.lastName}` === event.target.value); setForm({ ...form, student: event.target.value, className: student?.className || form.className }) }}>{students.map((student) => <option key={student.id}>{student.firstName} {student.lastName}</option>)}</select><label className="form-label">Subject</label><select className="form-select mb-2" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select><label className="form-label">Marks</label><input type="number" min="0" max="100" className="form-control mb-3" value={form.marks} onChange={(event) => setForm({ ...form, marks: event.target.value })} /><button className="btn btn-primary w-100">Save Marks</button></form><div className="panel mt-3"><p className="text-secondary mb-1">Average GPA</p><h3>{average}</h3><p className="mb-0 text-success">Performance analysis: improving</p></div></div>
        <div className="col-lg-8"><DataTable rows={results} onEdit={(row) => notify(`Update marks for ${row.student}`)} columns={[{ key: 'student', label: 'Student' }, { key: 'className', label: 'Class' }, { key: 'subject', label: 'Subject' }, { key: 'marks', label: 'Marks' }, { key: 'grade', label: 'Grade' }, { key: 'gpa', label: 'GPA' }]} /></div>
      </div>
    </>
  )
}
