import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Clock, FileText, CheckCircle2, ClipboardList, X, BriefcaseBusiness, MapPin, GraduationCap, Award } from 'lucide-react';
import './StudentLabour.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

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

const replaceAssistantWithSupporting = (text: string) =>
    text.replace(/\bassistant\b/gi, (match) => {
        if (match === match.toUpperCase()) return 'SUPPORTING';
        return match[0] === match[0].toUpperCase() ? 'Supporting' : 'supporting';
    });

const isRegistrarActivity = (activity: LabourActivityItem) => {
    const text = `${activity.title} ${activity.description || ''}`.toLowerCase();
    return text.includes('registrar') || text.includes('registration office');
};

const isLibraryActivity = (activity: LabourActivityItem) => {
    const text = `${activity.title} ${activity.description || ''}`.toLowerCase();
    return text.includes('library') || text.includes('librarian');
};

const formatRoleTitle = (activity: LabourActivityItem) => {
    if (isRegistrarActivity(activity)) return 'Supporting registrar';
    if (isLibraryActivity(activity)) return 'Supporting library';
    return replaceAssistantWithSupporting(activity.title);
};

const formatRoleDescription = (activity: LabourActivityItem) => {
    if (isRegistrarActivity(activity)) return 'Registrar office';
    if (isLibraryActivity(activity)) return 'Library';
    return activity.description ? replaceAssistantWithSupporting(activity.description) : 'Dean approved campus labour activity.';
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
    fullName?: string;
    gpa: string;
    semester: number;
    disciplineStatus: string;
}

const StudentLabour: React.FC<StudentLabourProps> = ({ studentNumber, fullName = '', gpa, semester, disciplineStatus }) => {
    const [activeTab, setActiveTab] = useState<'apply' | 'daily-log' | 'tracking'>('apply');
    const [coverLetterText, setCoverLetterText] = useState('');
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
    const [applicationModalOpen, setApplicationModalOpen] = useState(false);
    const [applicationStep, setApplicationStep] = useState(0);
    const [applicantFullName, setApplicantFullName] = useState('');
    const [applicantEmail, setApplicantEmail] = useState('');
    const [applicantPhone, setApplicantPhone] = useState('+250');
    const [interestSummary, setInterestSummary] = useState('');
    const [availabilitySummary, setAvailabilitySummary] = useState('');
    const [commitmentSummary, setCommitmentSummary] = useState('');
    const [showApplicationWarnings, setShowApplicationWarnings] = useState(false);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [applicationError, setApplicationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [activities, setActivities] = useState<LabourActivityItem[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<LabourActivityItem | null>(null);
    const [eligibilityPopupOpen, setEligibilityPopupOpen] = useState(false);
    const [eligibilityPopupTitle, setEligibilityPopupTitle] = useState('');
    const [eligibilityPopupMessage, setEligibilityPopupMessage] = useState('');
    const [withdrawTargetId, setWithdrawTargetId] = useState<number | null>(null);

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
            setEligibilityPopupMessage(`You are not eligible to apply for "${formatRoleTitle(activity)}" because ${reasons.join(', ')}.`);
            setEligibilityPopupOpen(true);
            return;
        }

        setSelectedActivity(activity);
        setApplicationStep(0);
        setApplicationModalOpen(true);
    };

    const composeApplicationText = () => {
        const sections = [
            `Selected role: ${selectedActivity?.title ?? 'N/A'}`,
            `Department: ${selectedActivity?.department ?? 'N/A'}`,
        `Full names: ${fullName || applicantFullName || 'N/A'}`,
        `Student number: ${studentNumber || 'N/A'}`,
        `Semester: ${semester || 'N/A'}`,
        `GPA: ${numericGpa.toFixed(2)}`,
        `Discipline status: ${disciplineStatus || 'N/A'}`,
        `Email: ${applicantEmail || 'N/A'}`,
        `Telephone: ${applicantPhone || 'N/A'}`,
        `Role interest: ${interestSummary || 'N/A'}`,
        `Availability: ${availabilitySummary || 'N/A'}`,
            `Motivation and commitment: ${commitmentSummary || coverLetterText || 'N/A'}`,
        ];
        return sections.join('\n\n');
    };

    const resetApplicationWizard = () => {
        setApplicationStep(0);
        setShowApplicationWarnings(false);
        setApplicantFullName('');
        setApplicantEmail('');
        setApplicantPhone('+250');
        setInterestSummary('');
        setAvailabilitySummary('');
        setCommitmentSummary('');
        setCoverLetterText('');
        setCoverLetterFile(null);
        setTranscriptFile(null);
    };

    const stepWarnings = useMemo(() => {
        const warnings: Record<number, string[]> = {
            0: [],
            1: [],
            2: [],
        };
        if (!applicantEmail.trim()) warnings[0].push('Email is required.');
        if (!applicantPhone.trim() || applicantPhone.trim() === '+250') warnings[0].push('Telephone number is required.');
        if (!interestSummary.trim()) warnings[1].push('Role interest is required.');
        if (!availabilitySummary.trim()) warnings[1].push('Availability is required.');
        if (!commitmentSummary.trim()) warnings[2].push('Motivation and commitment is required.');
        return warnings;
    }, [applicantEmail, applicantPhone, interestSummary, availabilitySummary, commitmentSummary]);

    const hasStepWarning = (step: number) => showApplicationWarnings && (stepWarnings[step]?.length ?? 0) > 0;

    const goToApplicationStep = (step: number) => {
        setApplicationStep(step);
    };

    const goToNextApplicationStep = () => {
        if ((stepWarnings[applicationStep]?.length ?? 0) > 0) {
            setShowApplicationWarnings(true);
            return;
        }
        setApplicationStep((step) => Math.min(2, step + 1));
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplicationError('');
        setApplicationMessage('');

        const allWarnings = Object.values(stepWarnings).flat();
        if (allWarnings.length > 0) {
            setShowApplicationWarnings(true);
            const firstInvalidStep = Number(Object.entries(stepWarnings).find(([, warnings]) => warnings.length > 0)?.[0] ?? 0);
            setApplicationStep(firstInvalidStep);
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('studentNumber', studentNumber);
            formData.append('department', selectedActivity?.department ?? '');
            formData.append('roleTitle', selectedActivity?.title ?? '');
            formData.append('coverLetterText', composeApplicationText());
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
            resetApplicationWizard();
            setApplicationModalOpen(false);
            setSelectedActivity(null);
            await fetchApplications();
            window.setTimeout(() => {
                document.querySelector('.labour-submit-success')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 80);
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

    const handleWithdrawApplication = async (applicationId: number) => {
        setApplicationError('');
        setApplicationMessage('');

        try {
            const response = await fetch(`${API_BASE}/api/labour-applications/${applicationId}/withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentNumber }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to withdraw application.');
            }
            setApplicationMessage('Application withdrawn successfully.');
            await fetchApplications();
            window.setTimeout(() => {
                document.querySelector('.labour-submit-success')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 80);
        } catch (err) {
            setApplicationError(err instanceof Error ? err.message : 'Failed to withdraw application.');
        }
    };

    const handleDownloadMyReport = () => {
        if (!studentNumber || logs.length === 0) {
            setEligibilityPopupTitle('No Report Available');
            setEligibilityPopupMessage('No labour report is available yet because you do not have approved or submitted daily labour logs.');
            setEligibilityPopupOpen(true);
            return;
        }
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

            {applicationMessage && (
                <div className="labour-submit-success" role="status">
                    <CheckCircle2 size={18} />
                    <span>{applicationMessage}</span>
                </div>
            )}

            {applicationError && (
                <div className="alert error">{applicationError}</div>
            )}

            <div className="labour-hero">
                <span className="portal-label">Student Labour Portal</span>
                <h1>Academic Work Opportunities</h1>
                <p>Browse available campus roles, submit your application, and track your progress in one place.</p>
            </div>

            {activeTab === 'apply' && (
                <>
                    <div className="labour-layout">
                        <section className="labour-main">
                            <div className="section-row">
                                <h2>Available Labour Activities</h2>
                                <div className="filters">
                                    <button className="filter-btn active">Director of Student Services Created Activities</button>
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
                                        <div className="job-card-top">
                                            <div className="job-icon">
                                                <BriefcaseBusiness size={20} />
                                            </div>
                                            <div className="job-head">
                                                <h3>{formatRoleTitle(activity)}</h3>
                                                <p>{formatRoleDescription(activity)}</p>
                                            </div>
                                        </div>
                                        <div className="job-tags">
                                            <span><MapPin size={13} /> {activity.department}</span>
                                            <span><GraduationCap size={13} /> Sem {activity.minSemester}+</span>
                                            <span><Award size={13} /> GPA {activity.minGpa}+</span>
                                        </div>
                                        <button className="job-apply-btn" onClick={() => handleSelectActivity(activity)} disabled={hasActivePosition}>
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
                                    <div className="application-row-actions">
                                                <strong>{app.status}</strong>
                                                {app.status === 'PENDING' && (
                                                    <button type="button" onClick={() => setWithdrawTargetId(app.id)}>Withdraw</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <aside className="labour-side">
                            <div className="panel">
                                <div className="panel-head">
                                    <h3>Application</h3>
                                </div>

                                {applicationError && <div className="alert error">{applicationError}</div>}
                                {applicationMessage && <div className="alert success">{applicationMessage}</div>}

                                {selectedActivity && (
                                    <div className="selected-role-card">
                                        <strong>{formatRoleTitle(selectedActivity)}</strong>
                                        <span>{selectedActivity.department}</span>
                                        <button type="button" onClick={() => setApplicationModalOpen(true)}>Continue Application</button>
                                    </div>
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
                                <div className="application-row-actions">
                                    <strong>{app.status}</strong>
                                    {app.status === 'PENDING' && (
                                        <button type="button" onClick={() => setWithdrawTargetId(app.id)}>Withdraw</button>
                                    )}
                                </div>
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

            {withdrawTargetId !== null && (
                <div className="eligibility-modal-overlay" onClick={() => setWithdrawTargetId(null)}>
                    <div className="eligibility-modal withdraw-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirm Withdrawal</h3>
                        <p>Do you want to withdraw this labour application? You can apply again after it is withdrawn.</p>
                        <div className="withdraw-modal-actions">
                            <button type="button" className="secondary" onClick={() => setWithdrawTargetId(null)}>Cancel</button>
                            <button
                                type="button"
                                onClick={() => {
                                    const id = withdrawTargetId;
                                    setWithdrawTargetId(null);
                                    void handleWithdrawApplication(id);
                                }}
                            >
                                OK, Withdraw
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {applicationModalOpen && selectedActivity && (
                <div className="labour-application-modal-overlay" onClick={() => setApplicationModalOpen(false)}>
                    <div className="labour-application-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="labour-application-modal-head">
                            <div>
                                <span>Application for {formatRoleTitle(selectedActivity)}</span>
                                <h3>Student Labour Application</h3>
                            </div>
                            <button type="button" onClick={() => setApplicationModalOpen(false)} aria-label="Close application">
                                <X size={18} />
                            </button>
                        </div>

                        <form className="labour-stepper-form labour-stepper-form--accordion" onSubmit={handleSubmitApplication}>
                            <div className="application-accordion">
                                <section className={`accordion-step ${applicationStep === 0 ? 'active' : ''} ${applicationStep > 0 ? 'complete' : ''} ${hasStepWarning(0) ? 'warning' : ''}`}>
                                    <button type="button" className="accordion-step-head" onClick={() => goToApplicationStep(0)}>
                                        <span>{applicationStep > 0 ? <CheckCircle2 size={15} /> : 1}</span>
                                        <strong>Personal Info</strong>
                                        {hasStepWarning(0) && <small>{stepWarnings[0][0]}</small>}
                                    </button>
                                    {applicationStep === 0 && (
                                        <div className="accordion-step-body">
                                            <div className="step-grid">
                                                <label>
                                                    <span>Full Names</span>
                                                    <input value={fullName || applicantFullName || 'Student User'} onChange={(e) => setApplicantFullName(e.target.value)} disabled={Boolean(fullName)} />
                                                </label>
                                                <label>
                                                    <span>Email</span>
                                                    <input className={hasStepWarning(0) && !applicantEmail.trim() ? 'field-warning' : ''} type="email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} placeholder="name@example.com" required />
                                                    {showApplicationWarnings && !applicantEmail.trim() && <em>Email is required.</em>}
                                                </label>
                                                <label>
                                                    <span>Telephone Number</span>
                                                    <input className={hasStepWarning(0) && (!applicantPhone.trim() || applicantPhone.trim() === '+250') ? 'field-warning' : ''} value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} placeholder="+250..." required />
                                                    {showApplicationWarnings && (!applicantPhone.trim() || applicantPhone.trim() === '+250') && <em>Telephone number is required.</em>}
                                                </label>
                                                <label>
                                                    <span>Student Number</span>
                                                    <input value={studentNumber || 'N/A'} disabled />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section className={`accordion-step ${applicationStep === 1 ? 'active' : ''} ${applicationStep > 1 ? 'complete' : ''} ${hasStepWarning(1) ? 'warning' : ''}`}>
                                    <button type="button" className="accordion-step-head" onClick={() => goToApplicationStep(1)}>
                                        <span>{applicationStep > 1 ? <CheckCircle2 size={15} /> : 2}</span>
                                        <strong>Role Interest</strong>
                                        {hasStepWarning(1) && <small>{stepWarnings[1][0]}</small>}
                                    </button>
                                    {applicationStep === 1 && (
                                        <div className="accordion-step-body">
                                            <div className="selected-role-summary">
                                                <strong>{formatRoleTitle(selectedActivity)}</strong>
                                                <span>{selectedActivity.department} / Sem {selectedActivity.minSemester}+ / GPA {selectedActivity.minGpa}+</span>
                                                <p>{formatRoleDescription(selectedActivity)}</p>
                                            </div>
                                            <div className="step-grid one-column">
                                                <label>
                                                    <span>Why are you interested in this role?</span>
                                                    <textarea className={hasStepWarning(1) && !interestSummary.trim() ? 'field-warning' : ''} rows={4} value={interestSummary} onChange={(e) => setInterestSummary(e.target.value)} required />
                                                    {showApplicationWarnings && !interestSummary.trim() && <em>Role interest is required.</em>}
                                                </label>
                                                <label>
                                                    <span>Availability</span>
                                                    <textarea className={hasStepWarning(1) && !availabilitySummary.trim() ? 'field-warning' : ''} rows={3} value={availabilitySummary} onChange={(e) => setAvailabilitySummary(e.target.value)} placeholder="Mention days/times you can work." required />
                                                    {showApplicationWarnings && !availabilitySummary.trim() && <em>Availability is required.</em>}
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section className={`accordion-step ${applicationStep === 2 ? 'active' : ''} ${hasStepWarning(2) ? 'warning' : ''}`}>
                                    <button type="button" className="accordion-step-head" onClick={() => goToApplicationStep(2)}>
                                        <span>3</span>
                                        <strong>Motivation and Commitment</strong>
                                        {hasStepWarning(2) && <small>{stepWarnings[2][0]}</small>}
                                    </button>
                                    {applicationStep === 2 && (
                                        <div className="accordion-step-body">
                                            <div className="step-grid one-column">
                                                <label>
                                                    <span>Motivation and commitment</span>
                                                    <textarea className={hasStepWarning(2) && !commitmentSummary.trim() ? 'field-warning' : ''} rows={5} value={commitmentSummary} onChange={(e) => setCommitmentSummary(e.target.value)} placeholder="Explain how you will serve responsibly in this position." required />
                                                    {showApplicationWarnings && !commitmentSummary.trim() && <em>Motivation and commitment is required.</em>}
                                                </label>
                                                <div className="step-grid">
                                                    <label>
                                                        <span>Cover Letter (PDF)</span>
                                                        <div className="file-input-wrap">
                                                            <Upload size={16} />
                                                            <span>{coverLetterFile ? coverLetterFile.name : 'Upload cover letter PDF'}</span>
                                                            <input type="file" accept="application/pdf" onChange={(e) => setCoverLetterFile(e.target.files?.[0] ?? null)} />
                                                        </div>
                                                    </label>
                                                    <label>
                                                        <span>Transcript (PDF)</span>
                                                        <div className="file-input-wrap">
                                                            <FileText size={16} />
                                                            <span>{transcriptFile ? transcriptFile.name : 'Upload transcript PDF'}</span>
                                                            <input type="file" accept="application/pdf" onChange={(e) => setTranscriptFile(e.target.files?.[0] ?? null)} />
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="stepper-actions">
                                <button type="button" className="secondary" onClick={() => setApplicationStep((step) => Math.max(0, step - 1))} disabled={applicationStep === 0}>
                                    <ArrowLeft size={16} />
                                    Back
                                </button>
                                {applicationStep < 2 ? (
                                    <button type="button" onClick={goToNextApplicationStep}>
                                        Next
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isSubmitting || !studentNumber}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLabour;
