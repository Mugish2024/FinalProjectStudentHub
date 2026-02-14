import React from 'react';
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Settings, Vote } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen = true, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'attendance', label: 'Attendance', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'events', label: 'Events', icon: Calendar },
    // { id: 'claims', label: 'Claims', icon: Megaphone },
    { id: 'discipline', label: 'Discipline Record', icon: Settings }, // Using Settings as placeholder for shield if not available
    { id: 'registration', label: 'Registration Info', icon: Users }, // Keeping the old page accessible
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo-text">STUDENTHUB</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
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
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-container">
            <div className="sidebar-user-avatar">
              JD
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Ishimwe Bienvenu</span>
              <span className="sidebar-user-role">Student</span>
            </div>
          </div>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;
