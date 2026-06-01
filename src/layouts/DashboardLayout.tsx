import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';
import DashboardFooter from '../components/DashboardFooter';
import './DashboardLayout.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
    userRole: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
    userAccountId: number | null;
    title?: string;
    userName?: string;
    userId?: string;
    onLogout?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activePage, setActivePage, userRole, userAccountId, title, userName, userId, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 1024 : true));
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('aucasa_sidebar_pinned') === 'true';
    });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('aucasa_sidebar_pinned', String(isSidebarPinned));
        if (isSidebarPinned && window.innerWidth > 1024) {
            setIsSidebarExpanded(true);
        }
    }, [isSidebarPinned]);

    const loadChatUnreadCount = React.useCallback(async () => {
        if (!userAccountId) {
            setChatUnreadCount(0);
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/chat/unread-count?userId=${userAccountId}`);
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                setChatUnreadCount(Number(data.count ?? 0));
            }
        } catch {
            setChatUnreadCount(0);
        }
    }, [userAccountId]);

    React.useEffect(() => {
        void loadChatUnreadCount();
        if (!userAccountId) return;
        const intervalId = window.setInterval(() => {
            void loadChatUnreadCount();
        }, 30000);
        return () => window.clearInterval(intervalId);
    }, [loadChatUnreadCount, userAccountId]);

    const isFinancePortalPage = activePage.startsWith('finance-') || (userRole === 'finance' && activePage === 'dashboard');

    return (
        <div className={`dashboard-layout ${isSidebarExpanded ? 'sidebar-is-expanded' : ''} ${isFinancePortalPage ? 'dashboard-layout--finance' : ''}`}>
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                userRole={userRole}
                userName={userName}
                userId={userId}
                isOpen={isSidebarOpen}
                isExpanded={isSidebarPinned || isSidebarExpanded}
                isPinned={isSidebarPinned}
                onClose={() => {
                    setIsSidebarOpen(false);
                    setIsSidebarExpanded(false);
                }}
                onExpandChange={setIsSidebarExpanded}
                onPinChange={setIsSidebarPinned}
                onLogout={onLogout}
            />

            <main className="main-content">
                <Header
                    title={title}
                    userName={userName}
                    userId={userId}
                    userRole={userRole}
                    activePage={activePage}
                    onNavigate={setActivePage}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    onChatClick={() => setIsChatOpen(!isChatOpen)}
                    chatUnreadCount={chatUnreadCount}
                    onNotificationsClick={() => setActivePage('notifications')}
                    onSettingsClick={() => setActivePage('settings')}
                />
                <div className="content-wrapper">
                    {children}
                    <DashboardFooter variant={isFinancePortalPage ? 'finance' : 'default'} />
                </div>
            </main>

            <ChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                userRole={userRole}
                userAccountId={userAccountId}
                userName={userName ?? 'User'}
                onUnreadCountChange={setChatUnreadCount}
            />
        </div>
    );
};

export default DashboardLayout;
