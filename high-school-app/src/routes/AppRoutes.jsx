import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Attendance from '../pages/Attendance/Attendance'
import Classes from '../pages/Classes/Classes'
import Dashboard from '../pages/Dashboard/Dashboard'
import Fees from '../pages/Fees/Fees'
import ForgotPassword from '../pages/Login/ForgotPassword'
import Home from '../pages/Home/Home'
import Login from '../pages/Login/Login'
import Reports from '../pages/Reports/Reports'
import Results from '../pages/Results/Results'
import Students from '../pages/Students/Students'
import Teachers from '../pages/Teachers/Teachers'
import Timetable from '../pages/Timetable/Timetable'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/results" element={<Results />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
