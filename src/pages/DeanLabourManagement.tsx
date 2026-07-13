import React, { useEffect, useMemo, useState } from 'react';
import { UserCheck, FileText, Clock, Eye, Calendar, BadgeCheck, Download, BriefcaseBusiness, MapPin, GraduationCap, Award, ShieldCheck } from 'lucide-react';
import './DeanLabourManagement.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type ApplicationItem = {
    id: number;
    studentName: string;
    studentNumber: string;
    department: string;
    roleTitle?: string;
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
    lateSubmissionReason?: string;
    locationValidated?: boolean;
};

type LabourActivityItem = {
    id: number;
    title: string;
    department: string;
    description?: string;
    minSemester: number;
    minGpa: number;
    requiresSatisfactoryDiscipline: boolean;
    active: boolean;
};

type MonthlyPerformanceItem = {
    studentNumber: string;
    studentName: string;
    campus: string;
    position: string;
    expectedWorkDays: number;
    daysPresent: number;
    daysMissed: number;
    totalHours: string;
};

const DeanLabourManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<'applications' | 'daily-logs'>('applications');
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [dailyLogs, setDailyLogs] = useState<LogItem[]>([]);
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
    const [error, setError] = useState('');
    const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
    const [activities, setActivities] = useState<LabourActivityItem[]>([]);
    const [roleReportFilter, setRoleReportFilter] = useState('');
    const [backfillNote, setBackfillNote] = useState('');
    const [newActivity, setNewActivity] = useState({
        title: '',
        department: 'Gishushu',
        description: '',
        minSemester: '1',
        minGpa: '14',
        requiresSatisfactoryDiscipline: true,
    });
    const [positionFormOpen, setPositionFormOpen] = useState(false);
    const [campusFilter, setCampusFilter] = useState('');
    const [positionFilter, setPositionFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformanceItem[]>([]);
    const [selectedStudentPerformance, setSelectedStudentPerformance] = useState<MonthlyPerformanceItem | null>(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportCampus, setReportCampus] = useState<'Gishushu' | 'Masoro' | ''>('');
    const [reportPosition, setReportPosition] = useState('');

    const pendingApplicationsCount = applications.length;
    const pendingLogsCount = dailyLogs.length;
    const totalDailyHours = useMemo(() => {
        return dailyLogs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
    }, [dailyLogs]);

    const publishedActivities = useMemo(() => {
        return [...activities].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            return a.title.localeCompare(b.title);
        });
    }, [activities]);

    const activeActivityCount = useMemo(() => activities.filter((activity) => activity.active).length, [activities]);

    const campusActivitySummary = useMemo(() => {
        return activities.reduce<Record<string, number>>((summary, activity) => {
            const campus = activity.department || 'Unassigned';
            summary[campus] = (summary[campus] ?? 0) + 1;
            return summary;
        }, {});
    }, [activities]);

    const selectedApplication = useMemo(() => {
        if (!selectedApplicationId) return applications[0] ?? null;
        return applications.find((app) => app.id === selectedApplicationId) ?? applications[0] ?? null;
    }, [applications, selectedApplicationId]);

    const loadApplications = async () => {
        const response = await fetch(`${API_BASE}/api/labour-applications?status=PENDING`);
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setApplications(list);
        if (list.length > 0) {
            setSelectedApplicationId((prev) => prev ?? list[0].id);
        } else {
            setSelectedApplicationId(null);
        }
    };

    const loadDailyLogs = async () => {
        const response = await fetch(`${API_BASE}/api/labour-daily-logs`);
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
        setDailyLogs(list);
    };

    const loadMonthlyPerformance = async () => {
        const params = new URLSearchParams();
        if (campusFilter.trim()) params.set('campus', campusFilter.trim());
        if (positionFilter.trim()) params.set('roleTitle', positionFilter.trim());
        if (monthFilter.trim()) params.set('month', monthFilter.trim());
        const response = await fetch(`${API_BASE}/api/labour-daily-logs/monthly-performance?${params.toString()}`);
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setMonthlyPerformance(list);
        setSelectedStudentPerformance(list[0] ?? null);
    };

    const loadActivities = async () => {
        const response = await fetch(`${API_BASE}/api/labour-activities`);
        const data = await response.json().catch(() => []);
        setActivities(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadApplications();
        loadDailyLogs();
        loadActivities();
    }, []);

    useEffect(() => {
        if (activeView === 'daily-logs') {
            loadMonthlyPerformance();
        }
    }, [activeView, campusFilter, positionFilter, monthFilter]);

    const handleReviewApplication = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
        setError('');
        try {
            const app = applications.find((item) => item.id === id);
            const response = await fetch(`${API_BASE}/api/labour-applications/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    reviewerDepartment: app?.department ?? '',
                    notes: reviewNotes[id] ?? '',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to review application.');
            }
            await loadApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to review application.');
        }
    };

    const handleDownloadLabourReport = () => {
        const params = new URLSearchParams();
        if (roleReportFilter.trim()) params.set('roleTitle', roleReportFilter.trim());
        const query = params.toString();
        window.open(`${API_BASE}/api/labour-daily-logs/report/pdf${query ? `?${query}` : ''}`, '_blank', 'noopener,noreferrer');
    };

    const handleGenerateSpecificReport = () => {
        setError('');
        if (!reportCampus) {
            setError('Please choose report campus first.');
            return;
        }
        const params = new URLSearchParams();
        params.set('department', reportCampus);
        if (reportPosition.trim()) params.set('roleTitle', reportPosition.trim());
        window.open(`${API_BASE}/api/labour-daily-logs/report/pdf?${params.toString()}`, '_blank', 'noopener,noreferrer');
        setReportModalOpen(false);
    };

    const reportPositions = useMemo(() => {
        const source = activities
            .filter((a) => !reportCampus || a.department.toLowerCase() === reportCampus.toLowerCase())
            .map((a) => a.title.trim())
            .filter((v) => v.length > 0);
        return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
    }, [activities, reportCampus]);

    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/labour-activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newActivity.title,
                    department: newActivity.department,
                    description: newActivity.description,
                    minSemester: Number(newActivity.minSemester),
                    minGpa: Number(newActivity.minGpa),
                    requiresSatisfactoryDiscipline: newActivity.requiresSatisfactoryDiscipline,
                    active: true,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to create activity.');
            }
            setNewActivity({
                title: '',
                department: 'Gishushu',
                description: '',
                minSemester: '1',
                minGpa: '14',
                requiresSatisfactoryDiscipline: true,
            });
            await loadActivities();
            setPositionFormOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create activity.');
        }
    };

    const handleApproveLateBackfill = async () => {
        if (!selectedApplication) return;
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/labour-daily-logs/backfill/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber: selectedApplication.studentNumber,
                    approvalNote: backfillNote,
                    approvedBy: 'Dean',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to approve late backfill.');
            }
            setBackfillNote('');
            alert(data.message ?? 'Late backfill approved.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve late backfill.');
        }
    };

    return (
        <div className="dean-labour-page">
            <header className="dean-page-header">
                <span>Administrator Portal</span>
                <h1>Student Labour Management</h1>
                <p>Review labour applications, manage approvals, and track pending departmental activity logs.</p>
            </header>

            {error && <div className="dean-alert">{error}</div>}

            <section className="dean-top-layout">
                <div className="dean-main-metrics">
                    <section className="dean-stats-row">
                        <article className="stat-box">
                            <div className="stat-icon"><UserCheck size={18} /></div>
                            <div className="stat-content">
                                <strong>{pendingApplicationsCount}</strong>
                                <span>Pending Applications</span>
                            </div>
                        </article>
                        <article className="stat-box">
                            <div className="stat-icon"><FileText size={18} /></div>
                            <div className="stat-content">
                                <strong>{pendingLogsCount}</strong>
                                <span>Daily Logs Pending</span>
                            </div>
                        </article>
                        <article className="stat-box dark">
                            <div className="stat-icon"><Clock size={18} /></div>
                            <div className="stat-content">
                                <strong>{totalDailyHours.toFixed(1)}</strong>
                                <span>Daily Recorded Hours</span>
                            </div>
                        </article>
                    </section>
                </div>

                <aside className="dean-quick-actions">
                    <h3>Quick Actions</h3>
                    <button className="report-selector-btn" onClick={() => setReportModalOpen(true)}>
                        Student Labour Report
                    </button>
                    <button className="create-position-btn" onClick={() => setPositionFormOpen((prev) => !prev)}>
                        {positionFormOpen ? 'Close Position Form' : 'Create Labour Position'}
                    </button>
                    <button className="report-download-btn" onClick={handleDownloadLabourReport}>
                        <Download size={16} />
                        Download Labour PDF Report
                    </button>
                </aside>
            </section>

            <section className="published-services-panel">
                <div className="published-services-head">
                    <div>
                        <span>Dean Created Labour Services</span>
                        <h2>Published Labour Positions</h2>
                        <p>Students can discover and apply for these positions from their labour portal.</p>
                    </div>
                    <div className="published-services-summary">
                        <strong>{activeActivityCount}</strong>
                        <span>Active of {activities.length}</span>
                    </div>
                </div>

                {Object.keys(campusActivitySummary).length > 0 && (
                    <div className="campus-service-strip">
                        {Object.entries(campusActivitySummary).map(([campus, count]) => (
                            <span key={campus}>{campus}: {count}</span>
                        ))}
                    </div>
                )}

                {publishedActivities.length === 0 ? (
                    <div className="services-empty-state">
                        <BriefcaseBusiness size={22} />
                        <div>
                            <strong>No labour services published yet.</strong>
                            <p>Use Create Labour Position to add the first service students will see.</p>
                        </div>
                    </div>
                ) : (
                    <div className="published-services-grid">
                        {publishedActivities.map((activity) => (
                            <article key={activity.id} className={`published-service-card ${activity.active ? '' : 'inactive'}`}>
                                <div className="published-service-top">
                                    <div className="published-service-icon">
                                        <BriefcaseBusiness size={19} />
                                    </div>
                                    <div>
                                        <h3>{activity.title}</h3>
                                        <p>{activity.description || 'Dean approved campus labour activity.'}</p>
                                    </div>
                                    <span className={`service-status-chip ${activity.active ? 'active' : 'inactive'}`}>
                                        {activity.active ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="published-service-tags">
                                    <span><MapPin size={13} /> {activity.department}</span>
                                    <span><GraduationCap size={13} /> Sem {activity.minSemester}+</span>
                                    <span><Award size={13} /> GPA {activity.minGpa}+</span>
                                    {activity.requiresSatisfactoryDiscipline && (
                                        <span><ShieldCheck size={13} /> Discipline clear</span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="dean-controls-row">
                <div className="toggle-group">
                    <button className={activeView === 'applications' ? 'active' : ''} onClick={() => setActiveView('applications')}>
                        Pending Applications
                    </button>
                    <button className={activeView === 'daily-logs' ? 'active' : ''} onClick={() => setActiveView('daily-logs')}>
                        Monthly Labour Records
                    </button>
                </div>
                <input
                    className="report-role-filter"
                    placeholder="Filter report by position"
                    value={roleReportFilter}
                    onChange={(e) => setRoleReportFilter(e.target.value)}
                />
            </section>

            {reportModalOpen && (
                <div className="position-modal-overlay" onClick={() => setReportModalOpen(false)}>
                    <section className="activity-create-panel position-modal-card report-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="position-modal-header">
                            <h3>Student Labour Report</h3>
                            <button type="button" className="position-close-btn" onClick={() => setReportModalOpen(false)}>Close</button>
                        </div>
                        <div className="report-campus-row">
                            <button
                                type="button"
                                className={`campus-choice-btn ${reportCampus === 'Gishushu' ? 'active' : ''}`}
                                onClick={() => setReportCampus('Gishushu')}
                            >
                                Gishushu
                            </button>
                            <button
                                type="button"
                                className={`campus-choice-btn ${reportCampus === 'Masoro' ? 'active' : ''}`}
                                onClick={() => setReportCampus('Masoro')}
                            >
                                Masoro
                            </button>
                        </div>
                        <div className="field-group">
                            <label>Position</label>
                            <select value={reportPosition} onChange={(e) => setReportPosition(e.target.value)} disabled={!reportCampus}>
                                <option value="">All positions in selected campus</option>
                                {reportPositions.map((position) => (
                                    <option key={position} value={position}>{position}</option>
                                ))}
                            </select>
                        </div>
                        <button type="button" className="generate-report-btn" onClick={handleGenerateSpecificReport}>
                            Generate Report
                        </button>
                    </section>
                </div>
            )}

            {positionFormOpen && (
                <div className="position-modal-overlay" onClick={() => setPositionFormOpen(false)}>
                    <section className="activity-create-panel position-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="position-modal-header">
                            <h3>Create Available Labour Activity</h3>
                            <button type="button" className="position-close-btn" onClick={() => setPositionFormOpen(false)}>Close</button>
                        </div>
                        <form className="activity-create-form" onSubmit={handleCreateActivity}>
                            <div className="field-group field-role">
                                <label>Role Title</label>
                                <input
                                    placeholder="e.g. Library Supporting"
                                    value={newActivity.title}
                                    onChange={(e) => setNewActivity((prev) => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="field-group field-campus">
                                <label>Campus</label>
                                <select
                                    value={newActivity.department}
                                    onChange={(e) => setNewActivity((prev) => ({ ...prev, department: e.target.value }))}
                                    required
                                >
                                    <option value="Gishushu">Gishushu</option>
                                    <option value="Masoro">Masoro</option>
                                </select>
                            </div>
                            <div className="field-group field-description">
                                <label>Activity Description</label>
                                <input
                                    placeholder="Short description of this labour activity"
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="field-group field-semester">
                                <label>Minimum Semester</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 1"
                                    value={newActivity.minSemester}
                                    onChange={(e) => setNewActivity((prev) => ({ ...prev, minSemester: e.target.value }))}
                                />
                            </div>
                            <div className="field-group field-gpa">
                                <label>Minimum GPA</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="e.g. 14.0"
                                    value={newActivity.minGpa}
                                    onChange={(e) => setNewActivity((prev) => ({ ...prev, minGpa: e.target.value }))}
                                />
                            </div>
                            <button type="submit">Publish Activity</button>
                        </form>
                        <div className="activity-list-inline">
                            {activities.slice(0, 6).map((item) => (
                                <span key={item.id}>{item.title} - {item.department}</span>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {activeView === 'applications' ? (
                <section className="review-layout">
                    <aside className="candidate-list-panel">
                        <h3>Candidate Queue</h3>
                        {applications.length === 0 && <p className="muted">No pending applications.</p>}
                        {applications.map((app) => (
                            <button
                                key={app.id}
                                className={`candidate-item ${selectedApplication?.id === app.id ? 'active' : ''}`}
                                onClick={() => setSelectedApplicationId(app.id)}
                            >
                                <strong>{app.studentName}</strong>
                                <span>{app.studentNumber}</span>
                                <small>{app.roleTitle || 'Role pending'}</small>
                                <small>{app.department}</small>
                            </button>
                        ))}
                    </aside>

                    <div className="candidate-review-panel">
                        {selectedApplication ? (
                            <>
                                <div className="review-top">
                                    <div>
                                        <h2>{selectedApplication.studentName}</h2>
                                        <p>
                                            ID: {selectedApplication.studentNumber} - Role: {selectedApplication.roleTitle || 'N/A'} - Department: {selectedApplication.department}
                                        </p>
                                    </div>
                                    <span className="status-chip">{selectedApplication.status}</span>
                                </div>

                                <div className="cover-letter-box">
                                    <h4>Cover Letter</h4>
                                    <p>{selectedApplication.coverLetterText || 'No cover letter text provided.'}</p>
                                </div>

                                <div className="review-docs-row">
                                    <a
                                        className={`doc-btn ${selectedApplication.coverLetterPath ? '' : 'disabled'}`}
                                        href={selectedApplication.coverLetterPath ? `${API_BASE}${selectedApplication.coverLetterPath}` : '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => {
                                            if (!selectedApplication.coverLetterPath) e.preventDefault();
                                        }}
                                    >
                                        <Eye size={16} /> View Cover Letter
                                    </a>
                                    <a
                                        className={`doc-btn ${selectedApplication.transcriptPath ? '' : 'disabled'}`}
                                        href={selectedApplication.transcriptPath ? `${API_BASE}${selectedApplication.transcriptPath}` : '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => {
                                            if (!selectedApplication.transcriptPath) e.preventDefault();
                                        }}
                                    >
                                        <FileText size={16} /> View Transcript
                                    </a>
                                </div>

                                <div className="notes-box">
                                    <label>Review Notes</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Add internal observations regarding candidate suitability..."
                                        value={reviewNotes[selectedApplication.id] ?? ''}
                                        onChange={(e) => setReviewNotes((prev) => ({ ...prev, [selectedApplication.id]: e.target.value }))}
                                    />
                                </div>

                                <div className="notes-box">
                                    <label>Late Backfill Approval Note</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Reason for allowing up to 2 missed daily logs."
                                        value={backfillNote}
                                        onChange={(e) => setBackfillNote(e.target.value)}
                                    />
                                </div>

                                <div className="review-actions">
                                    <button className="backfill-btn" onClick={handleApproveLateBackfill}>
                                        Approve Late Backfill
                                    </button>
                                    <button className="reject-btn" onClick={() => handleReviewApplication(selectedApplication.id, 'REJECTED')}>
                                        Reject Application
                                    </button>
                                    <button className="approve-btn" onClick={() => handleReviewApplication(selectedApplication.id, 'APPROVED')}>
                                        <BadgeCheck size={16} /> Approve Candidate
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">Select a candidate to review details.</div>
                        )}
                    </div>
                </section>
            ) : (
                <section className="logs-panel">
                    <h3>Monthly Labour Performance</h3>
                    <div className="monthly-filter-row">
                        <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}>
                            <option value="">All Campuses</option>
                            <option value="Gishushu">Gishushu</option>
                            <option value="Masoro">Masoro</option>
                        </select>
                        <input
                            placeholder="Filter by position"
                            value={positionFilter}
                            onChange={(e) => setPositionFilter(e.target.value)}
                        />
                        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                    </div>
                    {monthlyPerformance.length === 0 && <p className="muted">No monthly records found.</p>}
                    {monthlyPerformance.length > 0 && (
                        <div className="monthly-performance-grid">
                            <div className="monthly-list">
                                {monthlyPerformance.map((item) => (
                                    <button
                                        key={`${item.studentNumber}-${item.position}`}
                                        className={`candidate-item ${selectedStudentPerformance?.studentNumber === item.studentNumber ? 'active' : ''}`}
                                        onClick={() => setSelectedStudentPerformance(item)}
                                    >
                                        <strong>{item.studentName}</strong>
                                        <span>{item.studentNumber}</span>
                                        <small>{item.campus} - {item.position}</small>
                                        <small>Present {item.daysPresent}/{item.expectedWorkDays} - Missed {item.daysMissed}</small>
                                    </button>
                                ))}
                            </div>
                            <div className="monthly-detail">
                                {selectedStudentPerformance && (
                                    <>
                                        <h4>{selectedStudentPerformance.studentName}</h4>
                                        <p>{selectedStudentPerformance.studentNumber} - {selectedStudentPerformance.campus}</p>
                                        <p>Position: {selectedStudentPerformance.position}</p>
                                        <p>Total Hours: {selectedStudentPerformance.totalHours}</p>
                                        <p>Days Present: {selectedStudentPerformance.daysPresent}</p>
                                        <p>Days Missed: {selectedStudentPerformance.daysMissed}</p>
                                        <p className={selectedStudentPerformance.daysMissed === 0 ? 'perfect-attendance' : 'needs-attention'}>
                                            {selectedStudentPerformance.daysMissed === 0 ? 'Never missed this month.' : 'Has missed days this month.'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    <h3>All Daily Logs (Auto-verified by system)</h3>
                    {dailyLogs.map((log) => (
                        <article key={log.id} className="log-entry-card">
                            <div className="log-head">
                                <strong>{log.studentName}</strong>
                                <span><Calendar size={14} /> {new Date(log.logDate).toLocaleDateString()}</span>
                            </div>
                            <p className="log-meta">{log.department} - {log.hoursWorked} hours</p>
                            <p className="log-description">{log.taskDescription}</p>
                            {log.lateSubmissionReason && (
                                <p className="log-late-reason">Late reason: {log.lateSubmissionReason}</p>
                            )}
                            {log.locationValidated === false && (
                                <p className="log-late-reason">Location check failed.</p>
                            )}
                            <p className="muted">Status: {log.status}</p>
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
};

export default DeanLabourManagement;
