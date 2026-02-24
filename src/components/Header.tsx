import React from 'react';
import { MessageSquare, LogOut } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title?: string;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
    return (
        <header className="header">
            <div className="header-left-controls">
                <div className="semester-badge">2025/2</div>

                <div className="student-nr-container">
                    <span className="nr-label">Student Nr.</span>
                    <div className="nr-input-wrapper">
                        <input type="text" defaultValue="26701" />
                    </div>
                </div>

                <button className="btn-header-fill btn-blue">Fetch</button>

                <button className="btn-header-fill btn-orange">
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

                <button className="btn-logout-coral">
                    <span>→ Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
