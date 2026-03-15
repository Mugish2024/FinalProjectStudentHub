import React, { useEffect, useMemo, useState } from 'react';
import { UserCheck, FileText, Clock, Eye, Calendar } from 'lucide-react';
import './DeanLabourManagement.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type DepartmentItem = {
    id: number;
    name: string;
};

type ApplicationItem = {
    id: number;
    studentName: string;
    studentNumber: string;
    department: string;
    status: string;
    submittedAt: string;
    coverLetterPath?: string;
    transcriptPath?: string;
    coverLetterText?: string;
    reviewNotes?: string;
};

type LogItem = {
    id: number;
    studentName: string;
    department: string;
    logDate: string;
    hoursWorked: string;
    taskDescription: string;
    status: string;
};

const DeanLabourManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<'applications' | 'daily-logs'>('applications');
    const [departments, setDepartments] = useState<DepartmentItem[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [dailyLogs, setDailyLogs] = useState<LogItem[]>([]);
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
    const [error, setError] = useState('');

    const pendingApplicationsCount = applications.length;
    const pendingLogsCount = dailyLogs.length;
    const totalDailyHours = useMemo(() => {
        return dailyLogs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
    }, [dailyLogs]);

    const loadDepartments = async () => {
        const response = await fetch(`${API_BASE}/api/departments`);
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
        if (!selectedDepartment && list.length > 0) {
            setSelectedDepartment(list[0].name);
        }
    };

    const loadApplications = async (department: string) => {
        if (!department) {
            setApplications([]);
            return;
        }
        const response = await fetch(`${API_BASE}/api/labour-applications?status=PENDING&department=${encodeURIComponent(department)}`);
        const data = await response.json().catch(() => []);
        setApplications(Array.isArray(data) ? data : []);
    };

    const loadDailyLogs = async (department: string) => {
        if (!department) {
            setDailyLogs([]);
            return;
        }
        const response = await fetch(`${API_BASE}/api/labour-daily-logs?status=PENDING_REVIEW&department=${encodeURIComponent(department)}`);
        const data = await response.json().catch(() => []);
        setDailyLogs(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        if (!selectedDepartment) {
            return;
        }
        loadApplications(selectedDepartment);
        loadDailyLogs(selectedDepartment);
    }, [selectedDepartment]);

    const handleReviewApplication = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/labour-applications/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    reviewerDepartment: selectedDepartment,
                    notes: reviewNotes[id] ?? '',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to review application.');
            }
            await loadApplications(selectedDepartment);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to review application.');
        }
    };

    const handleReviewLog = async (id: number, decision: 'VERIFIED' | 'REJECTED') => {
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/labour-daily-logs/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    reviewerDepartment: selectedDepartment,
                    notes: reviewNotes[id] ?? '',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to review daily log.');
            }
            await loadDailyLogs(selectedDepartment);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to review daily log.');
        }
    };

    return (
        <div className="dean-labour">
            <header className="dean-header">
                <h1>Student Labour Management</h1>
                <p>Oversight of campus student employment and daily activity logs.</p>
            </header>

            <section className="dean-summary">
                <div className="summary-item">
                    <span className="summary-label">Pending Applications</span>
                    <span className="summary-val">{pendingApplicationsCount} <UserCheck size={24} style={{ opacity: 0.3 }} /></span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Daily Logs Pending</span>
                    <span className="summary-val">{pendingLogsCount} <FileText size={24} style={{ opacity: 0.3 }} /></span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Daily Recorded Hours</span>
                    <span className="summary-val">{totalDailyHours.toFixed(1)} <Clock size={24} style={{ opacity: 0.3 }} /></span>
                </div>
            </section>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div className="dean-view-toggle" style={{ alignItems: 'center', gap: '1rem' }}>
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
                <div style={{ marginLeft: 'auto' }}>
                    <select
                        className="custom-select"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="view-content fade-in">
                {activeView === 'applications' ? (
                    <div className="applications-list">
                        {applications.map(app => (
                            <div key={app.id} className="application-entry">
                                <div className="applicant-info">
                                    <span className="applicant-name">{app.studentName}</span>
                                    <div className="applicant-details">
                                        <span>{app.department}</span>
                                        <span>Student: <span className="dt-badge">{app.studentNumber}</span></span>
                                        <span>Applied: {new Date(app.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    {app.coverLetterText && (
                                        <div style={{ marginTop: '0.75rem', color: '#64748b' }}>
                                            <strong>Cover Letter:</strong> {app.coverLetterText}
                                        </div>
                                    )}
                                </div>
                                <div className="action-group">
                                    <button className="btn-ghost"><Eye size={16} /> Documents</button>
                                    <button className="btn-outline-primary" onClick={() => handleReviewApplication(app.id, 'APPROVED')}>Approve</button>
                                    <button className="btn-outline-primary" onClick={() => handleReviewApplication(app.id, 'REJECTED')}>Reject</button>
                                    <div style={{ width: '100%', marginTop: '0.5rem' }}>
                                        <textarea
                                            className="log-textarea"
                                            rows={2}
                                            placeholder="Review notes"
                                            value={reviewNotes[app.id] ?? ''}
                                            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                                        />
                                    </div>
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
                                {dailyLogs.map(log => (
                                    <tr key={log.id}>
                                        <td><Calendar size={14} /> {new Date(log.logDate).toLocaleDateString()}</td>
                                        <td><strong>{log.studentName}</strong></td>
                                        <td>{log.department}</td>
                                        <td>{log.hoursWorked}</td>
                                        <td style={{ color: '#64748b' }}>{log.taskDescription}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button className="view-btn" onClick={() => handleReviewLog(log.id, 'VERIFIED')}>Verify</button>
                                                <button className="view-btn" onClick={() => handleReviewLog(log.id, 'REJECTED')}>Reject</button>
                                            </div>
                                            <textarea
                                                className="log-textarea"
                                                rows={2}
                                                placeholder="Verification note"
                                                value={reviewNotes[log.id] ?? ''}
                                                onChange={(e) => setReviewNotes((prev) => ({ ...prev, [log.id]: e.target.value }))}
                                            />
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
