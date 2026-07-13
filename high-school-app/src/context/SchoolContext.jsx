import { useMemo, useState } from 'react'
import { SchoolContext } from './SchoolContextValue'
import { attendanceSeed, classesSeed, feesSeed, resultSeed, studentsSeed, teachersSeed, timetableSeed } from '../services/mockData'

export function SchoolProvider({ children }) {
  const [students, setStudents] = useState(studentsSeed)
  const [teachers, setTeachers] = useState(teachersSeed)
  const [classes, setClasses] = useState(classesSeed)
  const [attendance, setAttendance] = useState(attendanceSeed)
  const [results, setResults] = useState(resultSeed)
  const [fees, setFees] = useState(feesSeed)
  const [timetable, setTimetable] = useState(timetableSeed)
  const [toast, setToast] = useState(null)

  const notify = (message, variant = 'success') => {
    setToast({ id: Date.now(), message, variant })
    window.setTimeout(() => setToast(null), 3000)
  }

  const value = useMemo(() => ({
    students, setStudents,
    teachers, setTeachers,
    classes, setClasses,
    attendance, setAttendance,
    results, setResults,
    fees, setFees,
    timetable, setTimetable,
    toast, notify,
  }), [students, teachers, classes, attendance, results, fees, timetable, toast])

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
}
