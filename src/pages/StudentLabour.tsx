import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Clock, FileText, CheckCircle2, ClipboardList } from 'lucide-react';
import './StudentLabour.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type ApplicationItem = {
    id: number;
    department: string;
    roleTitle?: string;
    status: string;
    submittedAt: string;
    coverLetterPath?: string;
    transcriptPath?: string;
    coverLetterText?: string;
    reviewNotes?: string;
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

interface StudentLabourProps {
    studentNumber: string;
    gpa: string;
    semester: number;
    disciplineStatus: string;
}

const StudentLabour: React.FC<StudentLabourProps> = ({ studentNumber, gpa, semester, disciplineStatus }) => {
    const [activeTab, setActiveTab] = useState<'apply' | 'daily-log' | 'tracking'>('apply');
    const [coverLetterText, setCoverLetterText] = useState('');
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [applicationError, setApplicationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [activities, setActivities] = useState<LabourActivityItem[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<LabourActivityItem | null>(null);
    const [eligibilityPopupOpen, setEligibilityPopupOpen] = useState(false);
    const [eligibilityPopupTitle, setEligibilityPopupTitle] = useState('');
    const [eligibilityPopupMessage, setEligibilityPopupMessage] = useState('');

    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [workStartTime, setWorkStartTime] = useState('');
    const [workEndTime, setWorkEndTime] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [lateSubmissionReason, setLateSubmissionReason] = useState('');
    const [logMessage, setLogMessage] = useState('');
    const [logError, setLogError] = useState('');
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [reminders, setReminders] = useState<string[]>([]);

    const numericGpa = Number(gpa || 0);
    const isEligible = semester >= 3 && numericGpa >= 14 && disciplineStatus === 'SATISFACTORY';

    const totalHours = useMemo(() => {
        return logs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
    }, [logs]);
    const hasActivePosition = useMemo(
        () => applications.some((app) => app.status === 'PENDING' || app.status === 'APPROVED'),
        [applications]
    );

    const latestApplication = applications.length > 0 ? applications[0] : null;

    const fetchApplications = async () => {
        if (!studentNumber) return;
        const response = await fetch(`${API_BASE}/api/labour-applications?studentNumber=${encodeURIComponent(studentNumber)}`);
        const data = await response.json().catch(() => []);
        const parsed = Array.isArray(data) ? data : [];
        parsed.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setApplications(parsed);
    };

    const fetchLogs = async () => {
        if (!studentNumber) return;
        const response = await fetch(`${API_BASE}/api/labour-daily-logs?studentNumber=${encodeURIComponent(studentNumber)}`);
        const data = await response.json().catch(() => []);
        const parsed = Array.isArray(data) ? data : [];
        parsed.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
        setLogs(parsed);
    };

    const fetchReminders = async () => {
        if (!studentNumber) return;
        const response = await fetch(`${API_BASE}/api/labour-daily-logs/reminders?studentNumber=${encodeURIComponent(studentNumber)}`);
        const data = await response.json().catch(() => []);
        setReminders(Array.isArray(data) ? data : []);
    };

    const fetchActivities = async () => {
        const response = await fetch(`${API_BASE}/api/labour-activities?activeOnly=true`);
        const data = await response.json().catch(() => []);
        const parsed = Array.isArray(data) ? data : [];
        setActivities(parsed);
    };

    useEffect(() => {
        fetchApplications();
        fetchLogs();
        fetchActivities();
        fetchReminders();
    }, [studentNumber]);

    const isLateLogDate = logDate < new Date().toISOString().split('T')[0];
    const computedHours = useMemo(() => {
        if (!workStartTime || !workEndTime) return '';
        const [sh, sm] = workStartTime.split(':').map(Number);
        const [eh, em] = workEndTime.split(':').map(Number);
        if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return '';
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        if (endMinutes <= startMinutes) return '';
        const hours = (endMinutes - startMinutes) / 60;
        return (Math.round(hours * 10) / 10).toFixed(1);
    }, [workStartTime, workEndTime]);

    const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported on this browser.');
        }
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }),
                () => reject(new Error('Unable to get your location. Please allow location access and try again.')),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    };

    const getEligibilityReasons = (activity: LabourActivityItem) => {
        const reasons: string[] = [];
        if (semester < Number(activity.minSemester || 1)) {
            reasons.push(`minimum semester is ${activity.minSemester}`);
        }
        if (numericGpa < Number(activity.minGpa || 0)) {
            reasons.push(`minimum GPA is ${activity.minGpa}`);
        }
        if (activity.requiresSatisfactoryDiscipline && disciplineStatus !== 'SATISFACTORY') {
            reasons.push('discipline status must be SATISFACTORY');
        }
        return reasons;
    };

    const handleSelectActivity = (activity: LabourActivityItem) => {
        if (hasActivePosition) {
            setEligibilityPopupTitle('Position Already Assigned');
            setEligibilityPopupMessage('You already have a current labour position or a pending application. You cannot apply for another position right now.');
            setEligibilityPopupOpen(true);
            return;
        }

        const reasons = getEligibilityReasons(activity);
        if (reasons.length > 0) {
            setEligibilityPopupTitle('Not Eligible for This Role');
            setEligibilityPopupMessage(`You are not eligible to apply for "${activity.title}" because ${reasons.join(', ')}.`);
            setEligibilityPopupOpen(true);
            return;
        }

        setSelectedActivity(activity);
        setEligibilityPopupTitle('Eligible to Apply');
        setEligibilityPopupMessage(`You can apply for "${activity.title}". The role has been filled in your application form.`);
        setEligibilityPopupOpen(true);
        const el = document.getElementById('labour-application-form');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplicationError('');
        setApplicationMessage('');
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('studentNumber', studentNumber);
            formData.append('department', selectedActivity?.department ?? '');
            formData.append('roleTitle', selectedActivity?.title ?? '');
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
            setCoverLetterText('');
            setCoverLetterFile(null);
            setTranscriptFile(null);
            setSelectedActivity(null);
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
            const coords = await getCurrentLocation();
            const response = await fetch(`${API_BASE}/api/labour-daily-logs/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber,
                    logDate,
                    hoursWorked: computedHours,
                    workStartTime,
                    workEndTime,
                    taskDescription,
                    latitude: String(coords.latitude),
                    longitude: String(coords.longitude),
                    lateSubmissionReason: lateSubmissionReason.trim() || undefined,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Daily log submission failed.');
            }

            setLogMessage('Daily log recorded successfully.');
            setWorkStartTime('');
            setWorkEndTime('');
            setTaskDescription('');
            setLateSubmissionReason('');
            await fetchLogs();
            await fetchReminders();
        } catch (err) {
            setLogMessage('');
            setLogError(err instanceof Error ? err.message : 'Daily log submission failed.');
        }
    };

    const handleDownloadMyReport = () => {
        if (!studentNumber) return;
        const params = new URLSearchParams({ studentNumber });
        window.open(`${API_BASE}/api/labour-daily-logs/report/student/pdf?${params.toString()}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="student-labour-page">
            <div className="labour-top-tabs">
                <button className={activeTab === 'apply' ? 'active' : ''} onClick={() => setActiveTab('apply')}>Find Jobs</button>
                <button className={activeTab === 'daily-log' ? 'active' : ''} onClick={() => setActiveTab('daily-log')}>Daily Log</button>
                <button className={activeTab === 'tracking' ? 'active' : ''} onClick={() => setActiveTab('tracking')}>Applications</button>
            </div>

            {!studentNumber && (
                <div className="alert warn">Please login to access student labour services.</div>
            )}

            <div className="labour-hero">
                <span className="portal-label">Student Labour Portal</span>
                <h1>Academic Work Opportunities</h1>
                <p>Browse available campus roles, submit your application, and track your progress in one place.</p>
            </div>

            {activeTab === 'apply' && (
                <>
                    <div className="eligibility-banner">
                        <div className="eligibility-left">
                            <CheckCircle2 size={20} />
                            <div>
                                <h3>Labour Eligibility Status</h3>
                                <p>
                                    Semester {semester}, GPA {numericGpa.toFixed(2)}, discipline: {disciplineStatus || 'Unknown'}
                                </p>
                            </div>
                        </div>
                        <div className={`eligibility-pill ${isEligible ? 'ok' : 'not-ok'}`}>
                            {isEligible ? 'Target Met' : 'Not Eligible Yet'}
                        </div>
                    </div>

                    <div className="labour-layout">
                        <section className="labour-main">
                            <div className="section-row">
                                <h2>Available Labour Activities</h2>
                                <div className="filters">
                                    <button className="filter-btn active">Dean Created Activities</button>
                                </div>
                            </div>

                            <div className="job-list">
                                {activities.length === 0 && (
                                    <article className="job-card simplified">
                                        <div className="job-head">
                                            <h3>No Activities Yet</h3>
                                            <p>The dean has not published labour activities yet.</p>
                                        </div>
                                    </article>
                                )}
                                {activities.map((activity) => (
                                    <article key={activity.id} className="job-card simplified">
                                        <div className="job-head">
                                            <h3>{activity.title}</h3>
                                            <p>{activity.description || 'Dean approved campus labour activity.'}</p>
                                        </div>
                                        <div className="job-tags">
                                            <span>{activity.department}</span>
                                            <span>Sem {activity.minSemester}+</span>
                                            <span>GPA {activity.minGpa}+</span>
                                        </div>
                                        <button className="job-apply-btn" onClick={() => handleSelectActivity(activity)}>
                                            {hasActivePosition ? 'Already Have Position' : 'Apply for this role'}
                                        </button>
                                    </article>
                                ))}
                            </div>

                            {applications.length > 0 && (
                                <div className="recent-applications">
                                    <h3>My Recent Applications</h3>
                                    {applications.slice(0, 3).map((app) => (
                                        <div key={app.id} className="application-row">
                                            <span>{app.department || 'Dean assignment pending'}</span>
                                            <span>{app.roleTitle || 'Role pending'}</span>
                                            <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                                            <strong>{app.status}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <aside className="labour-side">
                            <div className="panel">
                                <div className="panel-head">
                                    <h3>Application</h3>
                                    <span>Step 1 of 3</span>
                                </div>

                                {applicationError && <div className="alert error">{applicationError}</div>}
                                {applicationMessage && <div className="alert success">{applicationMessage}</div>}

                                {!isEligible && (
                                    <div className="alert warn">You are currently not eligible for student labour. The application form is available only to eligible students.</div>
                                )}

                                {isEligible && !selectedActivity && (
                                    <div className="alert warn">Select a labour role above first to open the application form.</div>
                                )}

                                {isEligible && selectedActivity && (
                                    <form id="labour-application-form" className="application-form" onSubmit={handleSubmitApplication}>
                                        <label>Selected Role</label>
                                        <input value={selectedActivity.title} disabled />

                                        <label>Department Assignment</label>
                                        <input value={selectedActivity.department} disabled />

                                        <label>Cover Letter Text</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Write your motivation..."
                                            value={coverLetterText}
                                            onChange={(e) => setCoverLetterText(e.target.value)}
                                        />

                                        <label>Cover Letter (PDF)</label>
                                        <div className="file-input-wrap">
                                            <Upload size={16} />
                                            <span>{coverLetterFile ? coverLetterFile.name : 'Upload cover letter PDF'}</span>
                                            <input type="file" accept="application/pdf" onChange={(e) => setCoverLetterFile(e.target.files?.[0] ?? null)} />
                                        </div>

                                        <label>Transcript (PDF)</label>
                                        <div className="file-input-wrap">
                                            <FileText size={16} />
                                            <span>{transcriptFile ? transcriptFile.name : 'Upload transcript PDF'}</span>
                                            <input type="file" accept="application/pdf" onChange={(e) => setTranscriptFile(e.target.files?.[0] ?? null)} />
                                        </div>

                                        <button type="submit" disabled={isSubmitting || !studentNumber}>
                                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className="panel">
                                <h3>Live Status Tracker</h3>
                                <div className="tracker-step done">
                                    <span className="dot" />
                                    <div>
                                        <strong>Submission Received</strong>
                                        <small>{latestApplication ? new Date(latestApplication.submittedAt).toLocaleString() : 'Waiting for submission'}</small>
                                    </div>
                                </div>
                                <div className="tracker-step in-progress">
                                    <span className="dot" />
                                    <div>
                                        <strong>Department Review</strong>
                                        <small>{latestApplication ? (latestApplication.status === 'PENDING' ? 'Under review' : latestApplication.status) : 'Pending'}</small>
                                    </div>
                                </div>
                                <div className="tracker-step">
                                    <span className="dot" />
                                    <div>
                                        <strong>Interview Scheduling</strong>
                                        <small>Pending approval</small>
                                    </div>
                                </div>
                                <div className="tracker-step">
                                    <span className="dot" />
                                    <div>
                                        <strong>Onboarding</strong>
                                        <small>Final stage of hiring</small>
                                    </div>
                                </div>
                                <button className="download-report-btn live-tracker-report-btn" onClick={handleDownloadMyReport}>
                                    Generate My Labour Report
                                </button>
                            </div>
                        </aside>
                    </div>
                </>
            )}

            {activeTab === 'daily-log' && (
                <div className="daily-log-layout">
                    <div className="panel wide">
                        <h3>Record Daily Entry</h3>
                        {logError && <div className="alert error">{logError}</div>}
                        {logMessage && <div className="alert success">{logMessage}</div>}
                        {reminders.length > 0 && (
                            <div className="reminders-box">
                                {reminders.map((item, idx) => (
                                    <p key={`${item}-${idx}`}>{item}</p>
                                ))}
                            </div>
                        )}

                        <form className="log-form" onSubmit={handleSubmitLog}>
                            <div className="log-grid">
                                <div>
                                    <label>Log Date</label>
                                    <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                                </div>
                                <div>
                                    <label>Work Start Time</label>
                                    <input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Work End Time</label>
                                    <input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} required />
                                </div>
                            </div>
                            <label>Calculated Hours</label>
                            <input value={computedHours ? `${computedHours} hours` : 'Choose valid time range'} disabled />
                            <label>Task Description</label>
                            <textarea
                                rows={5}
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                placeholder="Describe work completed"
                                required
                            />
                            {isLateLogDate && (
                                <>
                                    <label>Reason for Late Submission (required for backfill)</label>
                                    <textarea
                                        rows={3}
                                        value={lateSubmissionReason}
                                        onChange={(e) => setLateSubmissionReason(e.target.value)}
                                        placeholder="Example: network issue prevented submission yesterday."
                                        required
                                    />
                                </>
                            )}
                            <button type="submit" disabled={!computedHours}>
                                Record Daily Entry
                            </button>
                        </form>
                    </div>

                    <div className="panel wide">
                        <h3>Recent Logs</h3>
                        {logs.length === 0 && <p className="muted">No logs yet.</p>}
                        {logs.slice(0, 10).map((log) => (
                            <div key={log.id} className="application-row">
                                <span>{new Date(log.logDate).toLocaleDateString()}</span>
                                <span>{log.hoursWorked} hrs</span>
                                <strong>{log.status.replace('_', ' ')}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tracking' && (
                <div className="tracking-layout">
                    <div className="stats-cards">
                        <div className="stat-card">
                            <span>Total Hours</span>
                            <strong>{totalHours.toFixed(1)}</strong>
                            <small><Clock size={14} /> Logged work time</small>
                        </div>
                        <div className="stat-card">
                            <span>Applications</span>
                            <strong>{applications.length}</strong>
                            <small><ClipboardList size={14} /> Submitted requests</small>
                        </div>
                        <div className="stat-card">
                            <span>Current Stage</span>
                            <strong>{latestApplication?.status ?? 'NOT SUBMITTED'}</strong>
                            <small><FileText size={14} /> Dean decision workflow</small>
                        </div>
                    </div>

                    <div className="panel wide">
                        <h3>Application History</h3>
                        {applications.length === 0 && <p className="muted">No applications submitted yet.</p>}
                        {applications.map((app) => (
                            <div key={app.id} className="application-row">
                                <span>{app.roleTitle || 'Role pending'}</span>
                                <span>{app.department || 'Dean assignment pending'}</span>
                                <span>{new Date(app.submittedAt).toLocaleString()}</span>
                                <strong>{app.status}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {eligibilityPopupOpen && (
                <div className="eligibility-modal-overlay" onClick={() => setEligibilityPopupOpen(false)}>
                    <div className="eligibility-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{eligibilityPopupTitle}</h3>
                        <p>{eligibilityPopupMessage}</p>
                        <button type="button" onClick={() => setEligibilityPopupOpen(false)}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLabour;
