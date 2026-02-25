import React, { useState } from 'react';
import { UserCheck, FileText, Clock, Eye, Calendar, ClipboardList } from 'lucide-react';
import './DeanLabourManagement.css';

const DeanLabourManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<'applications' | 'daily-logs'>('applications');

    const mockApplications = [
        { id: 1, name: 'Ishimwe Bienvenu', dept: 'IT Helpdesk', gpa: '15.2', semester: 4, date: 'Feb 20, 2026' },
        { id: 2, name: 'Mutarutwa Ketsia', dept: 'Library Services', gpa: '16.8', semester: 5, date: 'Feb 22, 2026' },
        { id: 3, name: 'Tuyishime Eric', dept: 'Finance Office', gpa: '14.5', semester: 3, date: 'Feb 24, 2026' },
    ];

    const mockDailyLogs = [
        { id: 101, name: 'Manzi David', hours: 4.5, dept: 'Library', date: 'Feb 24, 2026', task: 'Book Digitization & Archiving' },
        { id: 102, name: 'Umuhoza Alice', hours: 3.0, dept: 'Admin', date: 'Feb 24, 2026', task: 'Document Filing & Registry assistance' },
        { id: 103, name: 'Kamanzi Paul', hours: 5.5, dept: 'Maintenance', date: 'Feb 23, 2026', task: 'Campus perimeter check & lighting audit' },
    ];

    return (
        <div className="dean-labour">
            <header className="dean-header">
                <h1>Student Labour Management</h1>
                <p>Oversight of campus student employment and daily activity logs.</p>
            </header>

            <section className="dean-summary">
                <div className="summary-item">
                    <span className="summary-label">Active Workers</span>
                    <span className="summary-val">42 <UserCheck size={24} style={{ opacity: 0.3 }} /></span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Pending Applications</span>
                    <span className="summary-val">12 <FileText size={24} style={{ opacity: 0.3 }} /></span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Daily Recorded Hours</span>
                    <span className="summary-val">156.5 <Clock size={24} style={{ opacity: 0.3 }} /></span>
                </div>
            </section>

            <nav className="dean-view-toggle">
                <span
                    className={`toggle-link ${activeView === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveView('applications')}
                >
                    PENDING APPLICATIONS
                </span>
                <span
                    className={`toggle-link ${activeView === 'daily-logs' ? 'active' : ''}`}
                    onClick={() => setActiveView('daily-logs')}
                >
                    DAILY ACTIVITY LOGS
                </span>
            </nav>

            <div className="view-content fade-in">
                {activeView === 'applications' ? (
                    <div className="applications-list">
                        {mockApplications.map(app => (
                            <div key={app.id} className="application-entry">
                                <div className="applicant-info">
                                    <span className="applicant-name">{app.name}</span>
                                    <div className="applicant-details">
                                        <span>{app.dept}</span>
                                        <span>GPA: <span className="dt-badge">{app.gpa}/20</span></span>
                                        <span>Semester: <span className="dt-badge">{app.semester}</span></span>
                                        <span>Applied: {app.date}</span>
                                    </div>
                                </div>
                                <div className="action-group">
                                    <button className="btn-ghost"><Eye size={16} /> Documents</button>
                                    <button className="btn-outline-primary">Process Selection</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="logs-container">
                        <table className="log-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Student Worker</th>
                                    <th>Department</th>
                                    <th>Hours</th>
                                    <th>Activity Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockDailyLogs.map(log => (
                                    <tr key={log.id}>
                                        <td><Calendar size={14} /> {log.date}</td>
                                        <td><strong>{log.name}</strong></td>
                                        <td>{log.dept}</td>
                                        <td>{log.hours}</td>
                                        <td style={{ color: '#64748b' }}>{log.task}</td>
                                        <td>
                                            <button className="view-btn">Verify Entry</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeanLabourManagement;
