import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer/Footer'
import Sidebar from '../components/Sidebar/Sidebar'
import Topbar from '../components/Navbar/Topbar'
import ToastNotice from '../components/ToastNotice'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-panel">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-wrap">
          <Outlet />
        </div>
        <Footer />
      </main>
      <ToastNotice />
    </div>
  )
}
