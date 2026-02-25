import React from 'react';
import { MessageSquare, LogOut, Menu } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title?: string;
    onMenuClick?: () => void;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = "Student Portal", onMenuClick, onLogout }) => {
    return (
        <header className="header">
            <div className="header-left-section">
                <button className="icon-btn menu-btn" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <div className="header-logo-container">
                    <img
                        src="/src/assets/auca-logo.png"
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
                    <span className="nr-label">Student Nr.</span>
                    <div className="nr-input-wrapper">
                        <input type="text" defaultValue="26701" />
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
                    <div className="user-avatar-small">JD</div>
                    <span className="user-name-small">Ishimwe Bienvenu</span>
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
