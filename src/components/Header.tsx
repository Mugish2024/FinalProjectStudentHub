import React, { useMemo, useState } from 'react';
import { MessageSquare, Search, Bell, Settings, Menu } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title?: string;
    userName?: string;
    userId?: string;
    activePage?: string;
    userRole?: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president' | null;
    onNavigate?: (page: string) => void;
    onMenuClick?: () => void;
    onChatClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    title = 'Student Portal',
    activePage = 'dashboard',
    userRole = 'student',
    onNavigate,
    onMenuClick,
    onChatClick,
}) => {
    const [searchText, setSearchText] = useState('');
    const navItems = useMemo(
        () => {
            if (userRole !== 'student') {
                return [];
            }
            return [
                { label: 'Dashboard', page: 'dashboard' },
                { label: 'Payments', page: 'payments' },
                { label: 'Events', page: 'events' },
            ];
        },
        [userRole]
    );

    const navigateFromSearch = () => {
        const term = searchText.trim().toLowerCase();
        if (!term || !onNavigate) return;
        const match = navItems.find((item) => item.label.toLowerCase().includes(term));
        if (match) {
            onNavigate(match.page);
            setSearchText('');
        }
    };

    return (
        <header className="header">
            <div className="header-left-section">
                {onMenuClick && (
                    <button className="icon-btn top-icon-btn header-menu-btn" aria-label="Toggle sidebar" onClick={onMenuClick}>
                        <Menu size={18} />
                    </button>
                )}
                <h2 className="header-title">{title}</h2>
            </div>

            <div className="header-center">
                {navItems.length > 0 && (
                    <nav className="top-nav-tabs">
                        {navItems.map((item) => (
                            <button
                                key={item.page}
                                className={`top-nav-tab ${activePage === item.page ? 'active' : ''}`}
                                onClick={() => onNavigate?.(item.page)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                )}

                <div className="global-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search grades, courses..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                navigateFromSearch();
                            }
                        }}
                    />
                </div>
            </div>

            <div className="header-actions">
                <button className="icon-btn top-icon-btn" aria-label="Notifications">
                    <Bell size={18} />
                </button>
                <button className="icon-btn top-icon-btn" aria-label="Settings">
                    <Settings size={18} />
                </button>
                {onChatClick && (
                    <button className="btn-header-fill btn-blue" onClick={onChatClick}>
                        <MessageSquare size={16} />
                        <span>Chat</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
