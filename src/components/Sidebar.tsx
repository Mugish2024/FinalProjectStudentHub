import React from 'react';
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Vote, Shield, UserCircle2, LogOut, WalletCards, CalendarCheck2, Receipt, FileBarChart2 } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Sidebar.css';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  userRole: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president' | null;
  userName?: string;
  userId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  userRole,
  userName = 'User',
  userId = 'N/A',
  isOpen = true,
  onClose,
  onLogout,
}) => {
  const isDeanRole = userRole === 'staff' || userRole === 'dean';
  const isAdminRole = userRole === 'admin';
  const isFinanceRole = userRole === 'finance';
  const isGuildRole = userRole === 'guild_president';
  const studentMainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'labour', label: 'Student Labour', icon: Users },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'attendance', label: 'Attendance', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'discipline', label: 'Discipline Record', icon: Shield },
    { id: 'student-issues', label: 'Student Issues', icon: FileText },
  ];

  const deanTools = [
    { id: 'dashboard-tools', label: 'Dean Dashboard', icon: LayoutDashboard },
    { id: 'labour-mgmt', label: 'Labour Management', icon: Shield },
    { id: 'attendance-review', label: 'Attendance Review', icon: FileText },
    { id: 'candidate-review', label: 'Candidate Review', icon: Vote },
  ];

  const adminTools = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'registration', label: 'Registration Verify', icon: FileText },
    { id: 'finance-budgets', label: 'Budget Approvals', icon: WalletCards },
  ];

  const financeTools = [
    { id: 'finance-review', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finance-budgets', label: 'Budget Plans', icon: WalletCards },
    { id: 'finance-expenses', label: 'Daily Expenses', icon: CalendarCheck2 },
    { id: 'finance-receipts', label: 'Receipt Validation', icon: Receipt },
    { id: 'finance-reports', label: 'Financial Reports', icon: FileBarChart2 },
  ];

  const guildTools = [
    { id: 'guild-dashboard', label: 'Guild Dashboard', icon: LayoutDashboard },
    { id: 'guild-inbox', label: 'Guild Inbox', icon: Shield },
    { id: 'attendance-review', label: 'Attendance Review', icon: FileText },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${(isDeanRole || isAdminRole) ? 'dean-mode' : ''} ${isFinanceRole ? 'finance-mode' : ''}`}>
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
            <h1 className="logo-text"> <span>AUCASA</span></h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {!isDeanRole && !isAdminRole && !isFinanceRole && !isGuildRole && (
            <>
              <div className="nav-section-label">Main</div>
              {studentMainItems.map((item) => {
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

          {isDeanRole && (
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

          {isAdminRole && (
            <>
              <div className="nav-section-label">Admin Tools</div>
              {adminTools.map((item) => {
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

          {isFinanceRole && (
            <>
              <div className="finance-sidebar-panel">
                <h3>Finance Portal</h3>
                <p>Academic Year 2025/26</p>
              </div>
              <div className="nav-section-label">Finance Tools</div>
              {financeTools.map((item) => {
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

          {isGuildRole && (
            <>
              <div className="nav-section-label">Guild Tools</div>
              {guildTools.map((item) => {
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

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-footer-btn sidebar-footer-btn--static"
            disabled
            aria-disabled="true"
          >
            <UserCircle2 size={18} />
            <span>{userName}</span>
            <small>{userId}</small>
          </button>
          <button className="sidebar-footer-btn logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;
