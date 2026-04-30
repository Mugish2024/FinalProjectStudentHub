import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
    userRole: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president' | null;
    userAccountId: number | null;
    title?: string;
    userName?: string;
    userId?: string;
    onLogout?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activePage, setActivePage, userRole, userAccountId, title, userName, userId, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                userRole={userRole}
                userName={userName}
                userId={userId}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
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
                />
                <div className="content-wrapper">
                    {children}
                </div>
            </main>

            <ChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                userRole={userRole}
                userAccountId={userAccountId}
                userName={userName ?? 'User'}
            />
        </div>
    );
};

export default DashboardLayout;
