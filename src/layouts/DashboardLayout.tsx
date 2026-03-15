import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
    userRole: 'student' | 'staff' | 'dean' | 'admin' | null;
    title?: string;
    userName?: string;
    userId?: string;
    onLogout?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activePage, setActivePage, userRole, title, userName, userId, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="dashboard-layout">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                userRole={userRole}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="main-content">
                <Header
                    title={title}
                    userName={userName}
                    userId={userId}
                    userRole={userRole}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    onLogout={onLogout}
                />
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
