import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarClock, CheckCircle2, Loader2, RefreshCcw, ShieldAlert, TrendingUp, X } from 'lucide-react';
import './SemesterManagement.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type Semester = {
    id: number;
    name: string;
    academicYear: string;
    semesterNumber: number;
    startDate: string;
    endDate: string;
    active: boolean;
    createdAt?: string;
};

type Snapshot = {
    activeSemester: Semester | null;
    semesters: Semester[];
    resettableCounts: Record<string, number>;
};

interface SemesterManagementProps {
    currentUserName?: string;
    currentUserRole?: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
}

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const defaultAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const nextYear = year + 1;
    return `${year}/${nextYear}`;
};

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const countValue = (counts: Record<string, number> | undefined, keys: string[]) => (
    keys.reduce((sum, key) => sum + Number(counts?.[key] || 0), 0)
);

const SemesterManagement = ({ currentUserName = 'User', currentUserRole = null }: SemesterManagementProps) => {
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        academicYear: defaultAcademicYear(),
        semesterNumber: 1,
        startDate: toInputDate(new Date()),
        endDate: toInputDate(new Date(new Date().setMonth(new Date().getMonth() + 4))),
    });

    const totalResetItems = useMemo(() => {
        if (!snapshot?.resettableCounts) return 0;
        return Object.values(snapshot.resettableCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    }, [snapshot]);

    const activityData = useMemo(() => {
        const counts = snapshot?.resettableCounts;
        return [
            { name: 'Fees', value: countValue(counts, ['payments', 'paymentTransactions']) },
            { name: 'Labour', value: countValue(counts, ['labourApplications', 'labourDailyLogs', 'labourBackfillApprovals']) },
            { name: 'Attendance', value: countValue(counts, ['attendanceSessions', 'attendanceRecords']) },
            { name: 'Finance', value: countValue(counts, ['financeBudgets', 'financeFundRequests', 'financeExpenses', 'financeUpdates']) },
            { name: 'Elections', value: countValue(counts, ['elections', 'electionCandidates', 'votes']) },
            { name: 'Academic', value: countValue(counts, ['registrationRecords', 'courseGroups', 'claims', 'disciplineRecords', 'disciplineEntries']) },
            { name: 'Support', value: countValue(counts, ['supportTickets', 'events']) },
        ];
    }, [snapshot]);

    const semesterProgress = useMemo(() => {
        const active = snapshot?.activeSemester;
        if (!active) return { elapsed: 0, remainingDays: 0, totalDays: 0 };

        const start = new Date(`${active.startDate}T00:00:00`);
        const end = new Date(`${active.endDate}T23:59:59`);
        const now = new Date();
        const totalMs = Math.max(1, end.getTime() - start.getTime());
        const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
        const remainingMs = Math.max(end.getTime() - now.getTime(), 0);

        return {
            elapsed: Math.round((elapsedMs / totalMs) * 100),
            remainingDays: Math.ceil(remainingMs / 86400000),
            totalDays: Math.max(1, Math.ceil(totalMs / 86400000)),
        };
    }, [snapshot]);

    const topActivity = useMemo(() => {
        return [...activityData].sort((a, b) => b.value - a.value)[0] ?? { name: 'None', value: 0 };
    }, [activityData]);

    const loadSnapshot = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/semesters`);
            if (!response.ok) {
                throw new Error(`Unable to load semester management data (${response.status})`);
            }
            const data = await response.json() as Snapshot;
            setSnapshot(data);
            if (!form.name && data.activeSemester) {
                const nextNumber = (data.activeSemester.semesterNumber || 0) + 1;
                setForm((current) => ({
                    ...current,
                    name: `Semester ${nextNumber} ${current.academicYear}`,
                    semesterNumber: nextNumber,
                }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load semester data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSnapshot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((current) => ({
            ...current,
            [field]: field === 'semesterNumber' ? Number(value) : value,
        }));
    };

    const openCreateModal = () => {
        setCreateStep(1);
        setShowCreatePanel(true);
    };

    const createSemester = async () => {
        setStatus('');
        setError('');

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/api/semesters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    createdBy: currentUserName,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Unable to create new semester.');
            }
            setStatus(data?.message || 'New semester created successfully.');
            setShowCreatePanel(false);
            setCreateStep(1);
            await loadSnapshot();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create new semester.');
        } finally {
            setSubmitting(false);
        }
    };

    const activeSemester = snapshot?.activeSemester;
    const canManage = currentUserRole === 'dean' || currentUserRole === 'staff' || currentUserRole === 'guild_president';
    const chartColors = ['#2F4F86', '#1f9d8a', '#f59e0b', '#7c3aed', '#dc2626', '#0f766e', '#64748b'];
    const maxActivityValue = Math.max(1, ...activityData.map((item) => item.value));
    const hasActivity = activityData.some((item) => item.value > 0);
    const linePoints = activityData.map((item, index) => {
        const x = 36 + index * (328 / Math.max(1, activityData.length - 1));
        const y = 180 - (item.value / maxActivityValue) * 120;
        return { ...item, x, y, color: chartColors[index % chartColors.length] };
    });
    const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const lineFillPath = linePoints.length > 0
        ? `${linePath} L ${linePoints[linePoints.length - 1].x} 180 L ${linePoints[0].x} 180 Z`
        : '';
    const pieSegments = activityData.map((item, index) => ({
        ...item,
        color: chartColors[index % chartColors.length],
        percent: totalResetItems > 0 ? Math.round((item.value / totalResetItems) * 100) : 0,
    }));

    return (
        <div className="semester-page">
            <header className="semester-head">
                <div>
                    <span className="semester-eyebrow"><CalendarClock size={16} /> Semester Management</span>
                    <h1>{activeSemester?.name ?? 'Current Semester'}</h1>
                    <p>{activeSemester ? `${activeSemester.academicYear} / Semester ${activeSemester.semesterNumber}` : 'No active semester is currently available.'}</p>
                </div>
                <div className="semester-head-actions">
                    <button className="semester-refresh" onClick={loadSnapshot} disabled={loading}>
                        {loading ? <Loader2 size={16} className="spin" /> : <RefreshCcw size={16} />}
                        Refresh
                    </button>
                    <button className="semester-create compact" onClick={openCreateModal} disabled={!canManage}>
                        <CalendarClock size={16} />
                        New Semester
                    </button>
                </div>
            </header>

            {status && <div className="semester-alert success"><CheckCircle2 size={18} /> {status}</div>}
            {error && <div className="semester-alert error"><ShieldAlert size={18} /> {error}</div>}

            <section className="semester-overview-grid">
                <article className="semester-stat-card primary">
                    <div className="semester-stat-head">
                        <span>Semester progress</span>
                        <CalendarClock size={18} />
                    </div>
                    <strong>{semesterProgress.elapsed}%</strong>
                    <div className="semester-progress-track">
                        <div style={{ width: `${semesterProgress.elapsed}%` }} />
                    </div>
                    <small>{semesterProgress.remainingDays} days remaining of {semesterProgress.totalDays}</small>
                </article>
                <article className="semester-stat-card">
                    <div className="semester-stat-head">
                        <span>Current activity</span>
                        <Activity size={18} />
                    </div>
                    <strong>{formatNumber(totalResetItems)}</strong>
                    <small>records active in this semester</small>
                </article>
                <article className="semester-stat-card">
                    <div className="semester-stat-head">
                        <span>Highest movement</span>
                        <TrendingUp size={18} />
                    </div>
                    <strong>{topActivity.name}</strong>
                    <small>{formatNumber(topActivity.value)} records</small>
                </article>
            </section>

            <section className="semester-insights-layout">
                <article className="semester-card chart-card wide">
                        <div className="chart-title-row">
                            <div>
                                <span className="card-label">Current semester behavior</span>
                                <h3>Activity by Area</h3>
                                <p className="chart-helper">Number of records currently active in each service area.</p>
                            </div>
                        </div>
                        <div className="semester-line-chart" aria-label="Current semester activity by area">
                            <svg viewBox="0 0 400 230" role="img">
                                <text x="18" y="104" textAnchor="middle" className="axis-title" transform="rotate(-90 18 104)">
                                    Records
                                </text>
                                <text x="204" y="224" textAnchor="middle" className="axis-title">
                                    Service area
                                </text>
                                <line x1="36" y1="24" x2="36" y2="180" className="line-axis" />
                                <line x1="36" y1="180" x2="372" y2="180" className="line-axis" />
                                {[0, 1, 2, 3, 4].map((line) => {
                                    const y = 180 - line * 30;
                                    const value = Math.round((line / 4) * maxActivityValue);
                                    return (
                                        <g key={line}>
                                            <line x1="36" y1={y} x2="372" y2={y} className="line-grid" />
                                            <text x="30" y={y + 3} textAnchor="end" className="line-scale">
                                                {formatNumber(value)}
                                            </text>
                                        </g>
                                    );
                                })}
                                <path d={lineFillPath} className="semester-line-fill" />
                                <path d={linePath} className="semester-line-path" />
                                {linePoints.map((point) => (
                                    <g key={point.name}>
                                        <circle cx={point.x} cy={point.y} r="4.6" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
                                        <text x={point.x} y={point.y - 11} textAnchor="middle" className="line-value">
                                            {formatNumber(point.value)}
                                        </text>
                                        <text x={point.x} y="202" textAnchor="middle" className="line-label">
                                            {point.name}
                                        </text>
                                    </g>
                                ))}
                            </svg>
                            <div className="semester-line-legend">
                                <span><i /> One point equals the total records in that area</span>
                            </div>
                        </div>
                        {!hasActivity && (
                            <div className="semester-chart-empty">
                                This semester is currently at zero. New activity will appear here as records are created.
                            </div>
                        )}
                </article>

                <article className="semester-card chart-card">
                        <span className="card-label">Distribution</span>
                        <h3>Record Breakdown</h3>
                        <div className="semester-donut-wrap">
                            <div className="semester-donut" style={{
                                background: hasActivity
                                    ? `conic-gradient(${pieSegments.map((item, index) => {
                                        const previous = pieSegments.slice(0, index).reduce((sum, segment) => sum + segment.percent, 0);
                                        return `${item.color} ${previous}% ${previous + item.percent}%`;
                                    }).join(', ')})`
                                    : 'conic-gradient(#d8e2f2 0% 100%)',
                            }}>
                                <div>
                                    <strong>{formatNumber(totalResetItems)}</strong>
                                    <span>records</span>
                                </div>
                            </div>
                            <div className="semester-donut-legend">
                                {pieSegments.map((item) => (
                                    <div key={item.name}>
                                        <i style={{ background: item.color }} />
                                        <span>{item.name}</span>
                                        <strong>{item.percent}%</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                </article>

                <section className="semester-card history-card">
                    <h3>Semester History</h3>
                    <div className="semester-table">
                        <div className="semester-table-head">
                            <span>Name</span>
                            <span>Academic year</span>
                            <span>Dates</span>
                            <span>Status</span>
                        </div>
                        {(snapshot?.semesters ?? []).map((semester) => (
                            <div className="semester-table-row" key={semester.id}>
                                <strong>{semester.name}</strong>
                                <span>{semester.academicYear} / S{semester.semesterNumber}</span>
                                <span>{semester.startDate} - {semester.endDate}</span>
                                <span className={semester.active ? 'term-pill active' : 'term-pill'}>{semester.active ? 'Active' : 'Closed'}</span>
                            </div>
                        ))}
                        {snapshot?.semesters?.length === 0 && <p>No semesters have been created yet.</p>}
                    </div>
                </section>
            </section>

            {showCreatePanel && (
                <div className="semester-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="semester-modal-title" onClick={() => setShowCreatePanel(false)}>
                    <section className="semester-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="semester-modal-head">
                            <div>
                                <span className="card-label">Create after review</span>
                                <h3 id="semester-modal-title">New Semester Setup</h3>
                                <p>Complete each step before creating the next academic semester.</p>
                            </div>
                            <button type="button" className="semester-modal-close" aria-label="Close semester setup" onClick={() => setShowCreatePanel(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="semester-stepper" aria-label="Semester setup progress">
                            {['Details', 'Dates', 'Review'].map((label, index) => {
                                const step = index + 1;
                                return (
                                    <button
                                        type="button"
                                        key={label}
                                        className={createStep === step ? 'active' : createStep > step ? 'done' : ''}
                                        onClick={() => setCreateStep(step)}
                                    >
                                        <span>{step}</span>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {createStep === 1 && (
                            <div className="semester-form-grid semester-step-panel">
                                <label>
                                    <span>Semester name</span>
                                    <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Harmattan 2026" />
                                </label>
                                <label>
                                    <span>Academic year</span>
                                    <input value={form.academicYear} onChange={(event) => updateField('academicYear', event.target.value)} placeholder="2026/2027" />
                                </label>
                                <label>
                                    <span>Semester number</span>
                                    <input type="number" min="1" value={form.semesterNumber} onChange={(event) => updateField('semesterNumber', event.target.value)} />
                                </label>
                            </div>
                        )}

                        {createStep === 2 && (
                            <div className="semester-form-grid semester-step-panel">
                                <label>
                                    <span>Start date</span>
                                    <input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} />
                                </label>
                                <label>
                                    <span>End date</span>
                                    <input type="date" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} />
                                </label>
                            </div>
                        )}

                        {createStep === 3 && (
                            <div className="semester-review-panel">
                                <div>
                                    <span>Semester name</span>
                                    <strong>{form.name || 'Not provided'}</strong>
                                </div>
                                <div>
                                    <span>Academic year</span>
                                    <strong>{form.academicYear}</strong>
                                </div>
                                <div>
                                    <span>Semester number</span>
                                    <strong>S{form.semesterNumber}</strong>
                                </div>
                                <div>
                                    <span>Dates</span>
                                    <strong>{form.startDate} to {form.endDate}</strong>
                                </div>
                                <p>This will open a new semester and reset semester-based records for the new period.</p>
                            </div>
                        )}

                        <div className="semester-modal-foot">
                            <button type="button" className="semester-refresh" onClick={() => setShowCreatePanel(false)}>
                                Cancel
                            </button>
                            <div>
                                <button type="button" className="semester-refresh" onClick={() => setCreateStep((step) => Math.max(1, step - 1))} disabled={createStep === 1}>
                                    Back
                                </button>
                                {createStep < 3 ? (
                                    <button type="button" className="semester-create" onClick={() => setCreateStep((step) => Math.min(3, step + 1))}>
                                        Continue
                                    </button>
                                ) : (
                                    <button className="semester-create" onClick={createSemester} disabled={submitting || loading || !canManage}>
                                        {submitting ? <Loader2 size={18} className="spin" /> : <RefreshCcw size={18} />}
                                        Create Semester
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
};

export default SemesterManagement;
