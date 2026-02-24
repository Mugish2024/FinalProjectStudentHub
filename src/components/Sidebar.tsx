import React from 'react';
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Settings, Vote, GraduationCap, Grid, BookOpen, Clock, Shield } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen = true, onClose }) => {
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'attendance', label: 'Attendance', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'discipline', label: 'Discipline Record', icon: Shield },
    { id: 'registration', label: 'Registration Info', icon: Users },
  ];

  const deanTools = [
    { id: 'groups', label: 'Groups & Sizes', icon: Grid },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'dashboard-tools', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exam', label: 'Exam Officer', icon: Clock },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ background: '#dcb14a', padding: '4px', borderRadius: '4px', display: 'flex' }}>
            <GraduationCap size={20} color="#0d1b3e" />
          </div>
          <h1 className="logo-text">AU <span>CASA</span></h1>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="nav-section-label">Dean Tools</div>
          {deanTools.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;
