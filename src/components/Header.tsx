import React from 'react';
import { MessageSquare, LogOut, Menu } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Header.css';

interface HeaderProps {
    title?: string;
    userName?: string;
    userId?: string;
    userRole?: 'student' | 'staff' | null;
    onMenuClick?: () => void;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = "Student Portal", userName = "Student User", userId = "26701", userRole = "student", onMenuClick, onLogout }) => {
    const initials = userName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="header">
            <div className="header-left-section">
                <button className="icon-btn menu-btn" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <div className="header-logo-container">
                    <img
                        src={aucaLogo}
                        alt="AUCA Logo"
                        className="auca-logo-img-sm"
                        onError={(e) => {
                            e.currentTarget.src = "https://ui-avatars.com/api/?name=A&background=01447B&color=fff";
                        }}
                    />
                    <h2 className="header-title">{title}</h2>
                </div>
            </div>

            <div className="header-controls-group">
                <div className="semester-badge">2025/2</div>

                <div className="student-nr-container">
                    <span className="nr-label">{userRole === 'staff' ? 'Staff ID' : 'Student Nr.'}</span>
                    <div className="nr-input-wrapper">
                        <input type="text" value={userId} readOnly />
                    </div>
                </div>

                <button className="btn-header-fill btn-blue">Fetch</button>

                <button className="btn-header-fill btn-blue">
                    <MessageSquare size={16} />
                    <span>Chat</span>
                    <div className="chat-dot"></div>
                </button>
            </div>

            <div className="header-actions">
                <div className="user-pill">
                    <div className="user-avatar-small">{initials}</div>
                    <span className="user-name-small">{userName}</span>
                </div>

                <button className="btn-logout-slate" onClick={onLogout}>
                    <LogOut size={16} style={{ marginRight: '6px' }} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
