import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Clock, DollarSign, Calendar, FileText, Check } from 'lucide-react';
import './StudentLabour.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type ApplicationItem = {
    id: number;
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

interface StudentLabourProps {
    studentNumber: string;
    gpa: string;
    semester: number;
    disciplineStatus: string;
}

const StudentLabour: React.FC<StudentLabourProps> = ({ studentNumber, gpa, semester, disciplineStatus }) => {
    const [activeTab, setActiveTab] = useState<'apply' | 'daily-log' | 'tracking'>('apply');
    const [department, setDepartment] = useState('');
    const [coverLetterText, setCoverLetterText] = useState('');
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [applicationError, setApplicationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);

    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [hoursWorked, setHoursWorked] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [logMessage, setLogMessage] = useState('');
    const [logError, setLogError] = useState('');
    const [logs, setLogs] = useState<LogItem[]>([]);

    const numericGpa = Number(gpa);
    const isEligible = semester >= 3 && numericGpa >= 14 && disciplineStatus === 'SATISFACTORY';

    const totalHours = useMemo(() => {
        return logs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
    }, [logs]);

    const fetchApplications = async () => {
        if (!studentNumber) {
            return;
        }
        const response = await fetch(`${API_BASE}/api/labour-applications?studentNumber=${encodeURIComponent(studentNumber)}`);
        const data = await response.json().catch(() => []);
        setApplications(Array.isArray(data) ? data : []);
    };

    const fetchLogs = async () => {
        if (!studentNumber) {
            return;
        }
        const response = await fetch(`${API_BASE}/api/labour-daily-logs?studentNumber=${encodeURIComponent(studentNumber)}`);
        const data = await response.json().catch(() => []);
        setLogs(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        fetchApplications();
        fetchLogs();
    }, [studentNumber]);

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplicationError('');
        setApplicationMessage('');
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('studentNumber', studentNumber);
            formData.append('department', department);
            if (coverLetterText) {
                formData.append('coverLetterText', coverLetterText);
            }
            if (coverLetterFile) {
                formData.append('coverLetterFile', coverLetterFile);
            }
            if (transcriptFile) {
                formData.append('transcriptFile', transcriptFile);
            }

            const response = await fetch(`${API_BASE}/api/labour-applications/submit`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Application submission failed.');
            }

            setApplicationMessage('Application submitted successfully.');
            setDepartment('');
            setCoverLetterText('');
            setCoverLetterFile(null);
            setTranscriptFile(null);
            await fetchApplications();
        } catch (err) {
            setApplicationError(err instanceof Error ? err.message : 'Application submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setLogError('');
        setLogMessage('');

        try {
            const response = await fetch(`${API_BASE}/api/labour-daily-logs/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber,
                    logDate,
                    hoursWorked,
                    taskDescription,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Daily log submission failed.');
            }

            setLogMessage('Daily log recorded successfully.');
            setHoursWorked('');
            setTaskDescription('');
            await fetchLogs();
        } catch (err) {
            setLogError(err instanceof Error ? err.message : 'Daily log submission failed.');
        }
    };

    return (
        <div className="student-labour">
            <div className="labour-header">
                <h1>Student Labour Portal</h1>
                <p>Campus employment opportunities and service management.</p>
            </div>

            {!studentNumber && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    Please login to access labour services.
                </div>
            )}

            <div className="labour-tabs">
                <button
                    className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
                    onClick={() => setActiveTab('apply')}
                >
                    Application
                </button>
                <button
                    className={`tab-btn ${activeTab === 'daily-log' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily-log')}
                >
                    Daily Log
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tracking')}
                >
                    My Activity
                </button>
            </div>

            {activeTab === 'apply' && (
                <div className="fade-in">
                    <section className="eligibility-check">
                        <h3>Eligibility Verification</h3>
                        <div className="eligibility-row">
                            <span className="check-label">Semester Requirements</span>
                            <span className="check-status">
                                {semester}th Semester <Check size={16} />
                            </span>
                        </div>
                        <div className="eligibility-row">
                            <span className="check-label">Academic Threshold (Min 14/20)</span>
                            <span className="check-status">
                                {numericGpa}/20 <Check size={16} />
                            </span>
                        </div>
                        <div className="eligibility-row">
                            <span className="check-label">Disciplinary Standing</span>
                            <span className="check-status">
                                {disciplineStatus || 'Unknown'} <Check size={16} />
                            </span>
                        </div>
                    </section>

                    {applicationError && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {applicationError}
                        </div>
                    )}
                    {applicationMessage && (
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {applicationMessage}
                        </div>
                    )}

                    {!isEligible && (
                        <div style={{ background: '#fff7ed', color: '#9a3412', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            You do not meet the eligibility requirements yet. You can still complete the form, but submission is disabled until you qualify.
                        </div>
                    )}
                    {!studentNumber && (
                        <div style={{ background: '#fff7ed', color: '#9a3412', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            Please login to submit. You can still fill the form, but submission is disabled until you sign in.
                        </div>
                    )}

                    <form className="application-container" onSubmit={handleSubmitApplication}>
                            <div className="form-field">
                                <label>Target Department</label>
                                <input
                                    className="custom-select"
                                    placeholder="e.g. Academic Library"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Cover Letter Text</label>
                                <textarea
                                    className="log-textarea"
                                    rows={5}
                                    placeholder="Write your cover letter here..."
                                    value={coverLetterText}
                                    onChange={(e) => setCoverLetterText(e.target.value)}
                                />
                            </div>

                            <div className="form-field">
                                <label>Cover Letter (PDF)</label>
                                <div className="upload-area">
                                    <FileText size={24} color="#94a3b8" />
                                    <span>{coverLetterFile ? coverLetterFile.name : 'Upload cover letter (PDF)'}</span>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setCoverLetterFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Official Transcript (PDF)</label>
                                <div className="upload-area">
                                    <Upload size={24} color="#94a3b8" />
                                    <span>{transcriptFile ? transcriptFile.name : 'Upload latest transcript (PDF)'}</span>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setTranscriptFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                            </div>

                            <button className="primary-action-btn" type="submit" disabled={isSubmitting || !studentNumber}>
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>

                    {applications.length > 0 && (
                        <div className="activity-history">
                            <h3 className="section-title">Recent Applications</h3>
                            {applications.map((app) => (
                                <div key={app.id} className="history-item">
                                    <div className="item-main">
                                        <span className="item-date">{new Date(app.submittedAt).toLocaleDateString()}</span>
                                        <span className="item-meta">{app.department} • {app.status}</span>
                                    </div>
                                    <span className="status-indicator">{app.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'daily-log' && (
                <div className="fade-in">
                    {logError && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {logError}
                        </div>
                    )}
                    {logMessage && (
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {logMessage}
                        </div>
                    )}

                    <form className="log-entry-card" onSubmit={handleSubmitLog}>
                        <div className="daily-grid">
                            <div className="form-field">
                                <label>Log Date</label>
                                <input type="date" className="custom-select" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Hours Worked</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    className="custom-select"
                                    placeholder="Ex: 4.5"
                                    value={hoursWorked}
                                    onChange={(e) => setHoursWorked(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-field">
                            <label>Description of Activities</label>
                            <textarea
                                className="log-textarea"
                                rows={4}
                                placeholder="Detail what you accomplished today..."
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                required
                            />
                        </div>
                        <button className="primary-action-btn secondary-action-btn" type="submit">
                            Record Daily Entry
                        </button>
                    </form>

                    <div className="activity-history">
                        <h3 className="section-title">Recent Logs</h3>
                        {logs.map((log) => (
                            <div key={log.id} className="history-item">
                                <div className="item-main">
                                    <span className="item-date">{new Date(log.logDate).toLocaleDateString()}</span>
                                    <span className="item-meta">{log.department} • {log.hoursWorked} Hours • {log.taskDescription}</span>
                                </div>
                                <span className="status-indicator">{log.status.replace('_', ' ')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tracking' && (
                <div className="fade-in">
                    <div className="stats-summary">
                        <div className="stat-block">
                            <span className="stat-label">Total Hours</span>
                            <span className="stat-num">{totalHours.toFixed(1)} <Clock size={20} style={{ verticalAlign: 'middle', opacity: 0.5 }} /></span>
                        </div>
                        <div className="stat-block">
                            <span className="stat-label">Total Earnings</span>
                            <span className="stat-num">{(totalHours * 300).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>RWF</span></span>
                        </div>
                    </div>

                    <div className="info-box" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                            <DollarSign size={14} style={{ verticalAlign: 'middle' }} /> Student labour rate is fixed at <strong>300 RWF</strong> per hour.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLabour;
