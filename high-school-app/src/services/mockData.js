export const studentsSeed = [
  { id: 'STU-1001', firstName: 'Aline', lastName: 'Mutesi', gender: 'Female', dob: '2009-04-14', className: 'Grade 10A', parentName: 'Jean Mutesi', parentPhone: '+250 788 111 201', address: 'Kigali, Kacyiru', email: 'aline.mutesi@nuvision.edu', photo: 'https://i.pravatar.cc/120?img=32', attendance: 94, balance: 0 },
  { id: 'STU-1002', firstName: 'Brian', lastName: 'Uwimana', gender: 'Male', dob: '2008-09-22', className: 'Grade 11B', parentName: 'Claire Uwimana', parentPhone: '+250 788 111 202', address: 'Kigali, Remera', email: 'brian.uwimana@nuvision.edu', photo: 'https://i.pravatar.cc/120?img=12', attendance: 88, balance: 145000 },
  { id: 'STU-1003', firstName: 'Diane', lastName: 'Ishimwe', gender: 'Female', dob: '2010-01-08', className: 'Grade 9C', parentName: 'Eric Ishimwe', parentPhone: '+250 788 111 203', address: 'Kigali, Kimironko', email: 'diane.ishimwe@nuvision.edu', photo: 'https://i.pravatar.cc/120?img=47', attendance: 97, balance: 0 },
  { id: 'STU-1004', firstName: 'Kevin', lastName: 'Niyonsenga', gender: 'Male', dob: '2009-11-19', className: 'Grade 10B', parentName: 'Grace Niyonsenga', parentPhone: '+250 788 111 204', address: 'Kigali, Gisozi', email: 'kevin.niyonsenga@nuvision.edu', photo: 'https://i.pravatar.cc/120?img=15', attendance: 91, balance: 78000 },
  { id: 'STU-1005', firstName: 'Maya', lastName: 'Keza', gender: 'Female', dob: '2008-06-03', className: 'Grade 12A', parentName: 'Patrick Keza', parentPhone: '+250 788 111 205', address: 'Kigali, Nyamirambo', email: 'maya.keza@nuvision.edu', photo: 'https://i.pravatar.cc/120?img=49', attendance: 95, balance: 0 },
  { id: 'STU-1006', firstName: 'Noah', lastName: 'Habimana', gender: 'Male', dob: '2011-03-27', className: 'Grade 8A', parentName: 'Olive Habimana', parentPhone: '+250 788 111 206', address: 'Kigali, Nyarutarama', email: 'noah.habimana@nuvision.edu', photo: 'https://i.pravatar.cc/120?img=17', attendance: 86, balance: 92000 },
]

export const teachersSeed = [
  { id: 'TCH-201', fullName: 'Dr. Samuel Mugisha', subject: 'Mathematics', qualification: 'MSc Mathematics', phone: '+250 788 220 101', email: 'samuel.mugisha@nuvision.edu', address: 'Kigali, Gacuriro' },
  { id: 'TCH-202', fullName: 'Beatrice Nkurunziza', subject: 'English', qualification: 'BA Education', phone: '+250 788 220 102', email: 'beatrice.n@nuvision.edu', address: 'Kigali, Remera' },
  { id: 'TCH-203', fullName: 'Eric Bizimana', subject: 'Physics', qualification: 'BSc Physics', phone: '+250 788 220 103', email: 'eric.bizimana@nuvision.edu', address: 'Kigali, Kicukiro' },
  { id: 'TCH-204', fullName: 'Chantal Uwera', subject: 'Biology', qualification: 'MEd Science', phone: '+250 788 220 104', email: 'chantal.uwera@nuvision.edu', address: 'Kigali, Kimihurura' },
]

export const classesSeed = [
  { id: 'CLS-8A', name: 'Grade 8A', teacher: 'Noeline Akimana', room: 'B-102', students: 34 },
  { id: 'CLS-9C', name: 'Grade 9C', teacher: 'Eric Bizimana', room: 'B-204', students: 31 },
  { id: 'CLS-10A', name: 'Grade 10A', teacher: 'Dr. Samuel Mugisha', room: 'A-301', students: 38 },
  { id: 'CLS-10B', name: 'Grade 10B', teacher: 'Beatrice Nkurunziza', room: 'A-302', students: 36 },
  { id: 'CLS-11B', name: 'Grade 11B', teacher: 'Chantal Uwera', room: 'Science Lab', students: 29 },
  { id: 'CLS-12A', name: 'Grade 12A', teacher: 'Patrick Rukundo', room: 'A-401', students: 27 },
]

export const subjects = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'History', 'ICT']

export const attendanceSeed = studentsSeed.map((student, index) => ({
  id: `ATT-${index + 1}`,
  studentId: student.id,
  name: `${student.firstName} ${student.lastName}`,
  className: student.className,
  date: '2026-06-25',
  status: index === 1 ? 'Absent' : 'Present',
}))

export const resultSeed = [
  { id: 'RES-1', student: 'Aline Mutesi', className: 'Grade 10A', subject: 'Mathematics', marks: 91, grade: 'A', gpa: 4.0 },
  { id: 'RES-2', student: 'Brian Uwimana', className: 'Grade 11B', subject: 'Physics', marks: 78, grade: 'B', gpa: 3.2 },
  { id: 'RES-3', student: 'Diane Ishimwe', className: 'Grade 9C', subject: 'English', marks: 88, grade: 'A', gpa: 3.8 },
  { id: 'RES-4', student: 'Maya Keza', className: 'Grade 12A', subject: 'Biology', marks: 84, grade: 'B+', gpa: 3.5 },
]

export const feesSeed = [
  { id: 'FEE-1', student: 'Aline Mutesi', invoice: 'INV-4501', paid: 350000, balance: 0, date: '2026-06-10', status: 'Paid' },
  { id: 'FEE-2', student: 'Brian Uwimana', invoice: 'INV-4502', paid: 205000, balance: 145000, date: '2026-06-12', status: 'Partial' },
  { id: 'FEE-3', student: 'Kevin Niyonsenga', invoice: 'INV-4503', paid: 272000, balance: 78000, date: '2026-06-15', status: 'Partial' },
  { id: 'FEE-4', student: 'Noah Habimana', invoice: 'INV-4504', paid: 258000, balance: 92000, date: '2026-06-18', status: 'Partial' },
]

export const timetableSeed = [
  { day: 'Monday', periods: ['Mathematics', 'English', 'Physics', 'ICT', 'Sports'] },
  { day: 'Tuesday', periods: ['Biology', 'Chemistry', 'History', 'Mathematics', 'Clubs'] },
  { day: 'Wednesday', periods: ['English', 'Physics', 'ICT', 'Biology', 'Library'] },
  { day: 'Thursday', periods: ['Chemistry', 'Mathematics', 'History', 'English', 'Mentorship'] },
  { day: 'Friday', periods: ['Physics', 'Biology', 'ICT', 'Assessment', 'Assembly'] },
]

export const activities = [
  'Grade 12A report cards generated',
  'New attendance report submitted by Grade 10A',
  'Three fee payments recorded this morning',
  'Physics teacher assigned to Grade 11B practicals',
]
