import React from 'react';
import { Bell, LogOut, Search, Menu } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title?: string;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = "Student Portal", onMenuClick }) => {
    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="icon-btn menu-btn" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <div className="header-logo-container">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/en/8/8c/Logo_of_the_Adventist_University_of_Central_Africa.png"
                        alt="AUCA Logo"
                        className="auca-logo-img-sm"
                        onError={(e) => {
                            e.currentTarget.src = "https://ui-avatars.com/api/?name=A&background=01447B&color=fff";
                        }}
                    />
                    <h2 className="header-title">{title}</h2>
                </div>
            </div>

            <div className="header-actions">
                {/* Search could go here if needed */}
                <button className="icon-btn">
                    <Search size={20} />
                </button>

                <button className="icon-btn">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="user-profile">
                    <div className="avatar">JD</div>
                    <div className="user-info">
                        <span className="user-name">Ishimwe Bienvenu</span>
                        <span className="user-role">Student</span>
                    </div>
                </div>

                <button className="logout-btn">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
