import { useState } from 'react'
import { useSchool } from '../../context/useSchool'
import { subjects } from '../../services/mockData'

export default function Timetable() {
  const { timetable, setTimetable, teachers, notify } = useSchool()
  const [form, setForm] = useState({ day: 'Monday', period: 0, subject: subjects[0], teacher: teachers[0]?.fullName || '' })
  const assign = (event) => {
    event.preventDefault()
    setTimetable(timetable.map((day) => day.day === form.day ? { ...day, periods: day.periods.map((period, index) => index === Number(form.period) ? `${form.subject} - ${form.teacher}` : period) } : day))
    notify('Timetable updated')
  }

  return (
    <>
      <div className="page-header"><div><h2 className="fw-bold mb-1">Timetable Management</h2><p className="text-secondary mb-0">Create weekly schedules and assign subjects and teachers.</p></div></div>
      <form className="panel mb-3" onSubmit={assign}>
        <div className="row g-2 align-items-end">
          <div className="col-md"><label className="form-label">Day</label><select className="form-select" value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>{timetable.map((item) => <option key={item.day}>{item.day}</option>)}</select></div>
          <div className="col-md"><label className="form-label">Period</label><select className="form-select" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })}>{[0,1,2,3,4].map((period) => <option key={period} value={period}>Period {period + 1}</option>)}</select></div>
          <div className="col-md"><label className="form-label">Subject</label><select className="form-select" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></div>
          <div className="col-md"><label className="form-label">Teacher</label><select className="form-select" value={form.teacher} onChange={(event) => setForm({ ...form, teacher: event.target.value })}>{teachers.map((teacher) => <option key={teacher.id}>{teacher.fullName}</option>)}</select></div>
          <div className="col-md-auto"><button className="btn btn-primary w-100">Assign</button></div>
        </div>
      </form>
      <div className="timetable-grid">{timetable.map((day) => <div className="panel" key={day.day}><h3 className="h5">{day.day}</h3>{day.periods.map((period, index) => <div className="border rounded p-2 mb-2" key={`${day.day}-${period}`}>Period {index + 1}<strong className="d-block">{period}</strong></div>)}</div>)}</div>
    </>
  )
}
