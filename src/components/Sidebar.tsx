import React from 'react';
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Vote, Grid, BookOpen, Clock, Shield } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Sidebar.css';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  userRole: 'student' | 'staff' | 'dean' | 'admin' | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, userRole, isOpen = true, onClose }) => {
  const isStaffRole = userRole === 'staff' || userRole === 'dean' || userRole === 'admin';
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'labour', label: 'Student Labour', icon: Users },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'attendance', label: 'Attendance', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'discipline', label: 'Discipline Record', icon: Shield },
  ];

  const deanTools = [
    { id: 'labour-mgmt', label: 'Labour Management', icon: Shield },
    { id: 'groups', label: 'Groups & Sizes', icon: Grid },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'dashboard-tools', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exam', label: 'Exam Officer', icon: Clock },
    { id: 'registration', label: 'Student Registration', icon: Users },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img
              src={aucaLogo}
              alt="AUCA Logo"
              className="auca-logo-img"
              onError={(e) => {
                e.currentTarget.src = "https://ui-avatars.com/api/?name=AUCA&background=01447B&color=fff";
              }}
            />
            <h1 className="logo-text">AU <span>CASA</span></h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (window.innerWidth <= 768 && onClose) {
                    onClose();
                  }
                }}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isStaffRole && (
            <>
              <div className="nav-section-label">Dean Tools</div>
              {deanTools.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      if (window.innerWidth <= 768 && onClose) {
                        onClose();
                      }
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;
