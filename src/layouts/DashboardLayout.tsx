import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activePage, setActivePage }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="dashboard-layout">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                <Header
                    title={activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
