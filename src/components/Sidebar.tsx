import React from 'react';
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Vote, Shield, UserCircle2, LogOut, WalletCards, CalendarCheck2, Receipt, FileBarChart2, CalendarClock, ClipboardList, Pin, PinOff, IdCard } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Sidebar.css';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  userRole: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
  userName?: string;
  userId?: string;
  isOpen?: boolean;
  isExpanded?: boolean;
  isPinned?: boolean;
  onClose?: () => void;
  onExpandChange?: (expanded: boolean) => void;
  onPinChange?: (pinned: boolean) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  userRole,
  userName = 'User',
  userId = 'N/A',
  isOpen = true,
  isExpanded = false,
  isPinned = false,
  onClose,
  onExpandChange,
  onPinChange,
  onLogout,
}) => {
  const isDeanRole = userRole === 'staff' || userRole === 'dean';
  const isAdminRole = userRole === 'admin';
  const isFinanceRole = userRole === 'finance';
  const isCardManagerRole = userRole === 'student_card_manager';
  const isGuildRole = userRole === 'guild_president' || userRole === 'minister_sport' || userRole === 'minister_evangelism' || userRole === 'minister_international_affairs';
  const studentMainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'labour', label: 'Student Labour', icon: Users },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'attendance', label: 'Attendance', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'discipline', label: 'Discipline Record', icon: Shield },
    { id: 'student-issues', label: 'Student Issues', icon: FileText },
    { id: 'aucasa-plan', label: 'Aucasa Plan', icon: ClipboardList },
  ];

  const deanTools = [
    { id: 'dashboard-tools', label: 'Dean Dashboard', icon: LayoutDashboard },
    { id: 'labour-mgmt', label: 'Labour Management', icon: Shield },
    { id: 'attendance-review', label: 'Attendance Review', icon: FileText },
    { id: 'candidate-review', label: 'Candidate Review', icon: Vote },
    { id: 'semester-management', label: 'Semester Management', icon: CalendarClock },
  ];

  const adminTools = [
    { id: 'admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'registration', label: 'Registration Verify', icon: FileText },
    { id: 'student-card-manager', label: 'Student Cards', icon: IdCard },
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
    { id: 'aucasa-plan', label: 'Aucasa Plan', icon: ClipboardList },
    { id: 'guild-inbox', label: 'Guild Inbox', icon: Shield },
    { id: 'attendance-review', label: 'Attendance Review', icon: FileText },
    { id: 'semester-management', label: 'Semester Management', icon: CalendarClock },
  ];

  const cardManagerTools = [
    { id: 'student-card-manager', label: 'Student Cards', icon: IdCard },
  ];

  const handleExpand = () => {
    if (window.innerWidth > 1024) {
      onExpandChange?.(true);
    }
  };

  const clearFocusedElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleCollapse = () => {
    if (window.innerWidth > 1024 && !isPinned) {
      clearFocusedElement();
      onExpandChange?.(false);
    }
  };

  const handlePinToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextPinned = !isPinned;
    onPinChange?.(nextPinned);
    if (window.innerWidth > 1024) {
      onExpandChange?.(nextPinned);
    }
  };

  const handleNavClick = (page: string, trigger?: HTMLButtonElement) => {
    setActivePage(page);
    if (window.innerWidth <= 1024) {
      onExpandChange?.(false);
      onClose?.();
      return;
    }
    trigger?.blur();
  };

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''} ${isPinned ? 'pinned' : ''} ${(isDeanRole || isAdminRole || isCardManagerRole) ? 'dean-mode' : ''} ${isFinanceRole ? 'finance-mode' : ''}`}
        onMouseEnter={handleExpand}
        onMouseLeave={handleCollapse}
        onFocus={handleExpand}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            handleCollapse();
          }
        }}
      >
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="brand-lockup">
              <img
                src={aucaLogo}
                alt="AUCA Logo"
                className="auca-logo-img"
                onError={(e) => {
                  e.currentTarget.src = "https://ui-avatars.com/api/?name=AUCA&background=01447B&color=fff";
                }}
              />
              <div className="university-mark">
                <strong>Adventist University</strong>
                <span>Of Central Africa</span>
              </div>
            </div>
            <h1 className="logo-text"><span>AUCASA</span></h1>
          </div>
          <button
            type="button"
            className={`sidebar-pin-btn ${isPinned ? 'active' : ''}`}
            onClick={handlePinToggle}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            aria-pressed={isPinned}
          >
            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!isDeanRole && !isAdminRole && !isFinanceRole && !isGuildRole && !isCardManagerRole && (
            <>
              <div className="nav-section-label">Main</div>
              {studentMainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={(event) => {
                      handleNavClick(item.id, event.currentTarget);
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
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
                    onClick={(event) => {
                      handleNavClick(item.id, event.currentTarget);
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
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
                    onClick={(event) => {
                      handleNavClick(item.id, event.currentTarget);
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
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
              <div className="nav-section-label">Finance Tools</div>
              {financeTools.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={(event) => {
                      handleNavClick(item.id, event.currentTarget);
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {isCardManagerRole && (
            <>
              <div className="nav-section-label">Card Office</div>
              {cardManagerTools.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={(event) => {
                      handleNavClick(item.id, event.currentTarget);
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
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
                    onClick={(event) => {
                      handleNavClick(item.id, event.currentTarget);
                    }}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
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
