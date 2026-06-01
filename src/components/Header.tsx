import React, { useMemo } from 'react';
import { MessageSquare, Bell, Settings, Menu } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title?: string;
    userName?: string;
    userId?: string;
    activePage?: string;
    userRole?: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
    onNavigate?: (page: string) => void;
    onMenuClick?: () => void;
    onChatClick?: () => void;
    chatUnreadCount?: number;
    onNotificationsClick?: () => void;
    onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    title = 'Student Portal',
    activePage = 'dashboard',
    userRole = 'student',
    onNavigate,
    onMenuClick,
    onChatClick,
    chatUnreadCount = 0,
    onNotificationsClick,
    onSettingsClick,
}) => {
    const topNavItems = useMemo(
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
                {topNavItems.length > 0 && (
                    <nav className="top-nav-tabs">
                        {topNavItems.map((item) => (
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

            </div>

            <div className="header-actions">
                <button className="icon-btn top-icon-btn" aria-label="Notifications" onClick={onNotificationsClick}>
                    <Bell size={18} />
                </button>
                <button className="icon-btn top-icon-btn" aria-label="Settings" onClick={onSettingsClick}>
                    <Settings size={18} />
                </button>
                {onChatClick && (
                    <button className="btn-header-fill btn-blue chat-header-btn" onClick={onChatClick}>
                        <MessageSquare size={16} />
                        <span>Chat</span>
                        {chatUnreadCount > 0 && (
                            <span className="chat-header-badge" aria-label={`${chatUnreadCount} unread chat messages`}>
                                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
