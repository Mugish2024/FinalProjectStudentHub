import React from 'react';
import { UserCheck, FileText, ClipboardList, ArrowRight } from 'lucide-react';
import './StudentDashboard.css';

interface StudentDashboardProps {
    navigateTo: (page: string) => void;
    fullName: string;
    studentNumber: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
    navigateTo,
    fullName,
    studentNumber,
    faculty,
    department,
    program,
    credits,
}) => {
    const handleNavigate = (page: string) => {
        if (navigateTo) {
            navigateTo(page);
        }
    };

    return (
        <div className="student-dashboard">
            {/* Profile Grid - Top Section of Content Area */}
            <div className="profile-info-grid">
                <div className="info-card">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{fullName}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">Reg. Nr.</span>
                    <span className="info-value">{studentNumber}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">Faculty</span>
                    <span className="info-value accent-blue">{faculty}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">Department</span>
                    <span className="info-value accent-blue">{department}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">Program</span>
                    <span className="info-value">{program}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">Credits</span>
                    <span className="info-value accent-blue">{credits}</span>
                </div>
            </div>

            {/* Main Interactive Sections */}
            <div className="dashboard-main-sections">
                {/* Primary Student Services */}
                <div className="section-container">
                    <div className="section-title-bar">
                        <div className="title-marker"></div>
                        <h3 className="section-title">Essential Services</h3>
                    </div>

                    <div className="baton-services-container">
                        <button className="btn-baton-service" onClick={() => handleNavigate('attendance')}>
                            <div className="service-btn-content">
                                <div className="service-btn-icon-wrapper">
                                    <UserCheck size={24} />
                                </div>
                                <span className="service-btn-label">Attendance Records</span>
                            </div>
                            <ArrowRight size={20} className="service-arrow" />
                        </button>

                        <button className="btn-baton-service" onClick={() => handleNavigate('discipline')}>
                            <div className="service-btn-content">
                                <div className="service-btn-icon-wrapper">
                                    <ClipboardList size={24} />
                                </div>
                                <span className="service-btn-label">Discipline Records</span>
                            </div>
                            <ArrowRight size={20} className="service-arrow" />
                        </button>

                        <button className="btn-baton-service" onClick={() => handleNavigate('registration')}>
                            <div className="service-btn-content">
                                <div className="service-btn-icon-wrapper">
                                    <FileText size={24} />
                                </div>
                                <span className="service-btn-label">Registration Information</span>
                            </div>
                            <ArrowRight size={20} className="service-arrow" />
                        </button>
                    </div>
                </div>

                {/* Navigation Hub */}
                <div className="section-container">
                    <div className="section-title-bar">
                        <div className="title-marker"></div>
                        <h3 className="section-title">Navigation Hub</h3>
                    </div>

                    <div className="navigation-hub-grid">
                        <button className="btn-nav-hub" onClick={() => handleNavigate('dashboard')}>
                            Dashboard
                        </button>
                        <button className="btn-nav-hub" onClick={() => handleNavigate('courses')}>
                            Courses
                        </button>
                        <button className="btn-nav-hub" onClick={() => handleNavigate('payments')}>
                            Payments
                        </button>
                        <button className="btn-nav-hub" onClick={() => handleNavigate('events')}>
                            Events
                        </button>
                        <button className="btn-nav-hub" onClick={() => handleNavigate('profile')}>
                            Profile
                        </button>
                        <button className="btn-nav-hub" onClick={() => handleNavigate('transcript')}>
                            Transcript
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
