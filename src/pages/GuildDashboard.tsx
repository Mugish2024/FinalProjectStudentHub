import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CircleCheckBig, Clock3, ImagePlus, Megaphone, Timer, Users, Vote, X } from 'lucide-react';
import './GuildDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type TicketItem = {
    id: number;
    subject: string;
    studentNumber: string;
    status: string;
    createdAt?: string;
};

type AttendanceSession = {
    id: number;
    title: string;
    campus?: string;
    startsAt?: string;
};

type ElectionInfo = {
    id: number;
    title: string;
    status: string;
    eligibleVoters?: number;
    totalVotes?: number;
    votingEnd?: string;
};

type StudentSummary = {
    studentId: number;
    studentNumber: string;
    fullName: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
};

type GuildNotice = {
    id: number;
    title: string;
    organizer: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    description: string;
    imagePath?: string;
    status?: string;
};

interface GuildDashboardProps {
    userId: number;
    onNavigate?: (page: string) => void;
}

const GuildDashboard = ({ userId, onNavigate }: GuildDashboardProps) => {
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [activeElection, setActiveElection] = useState<ElectionInfo | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeDate, setNoticeDate] = useState('');
    const [noticeTime, setNoticeTime] = useState('');
    const [noticeLocation, setNoticeLocation] = useState('');
    const [noticeDescription, setNoticeDescription] = useState('');
    const [noticeImage, setNoticeImage] = useState<File | null>(null);
    const [noticeError, setNoticeError] = useState('');
    const [isPostingNotice, setIsPostingNotice] = useState(false);
    const [notices, setNotices] = useState<GuildNotice[]>([]);
    const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
    const [removeNoticeImage, setRemoveNoticeImage] = useState(false);

    const loadData = async () => {
        setError('');
        setIsLoading(true);
        try {
            const [ticketRes, sessionRes, electionRes] = await Promise.all([
                fetch(`${API_BASE}/api/tickets/assigned/${userId}`),
                fetch(`${API_BASE}/api/attendance/sessions?active=true`),
                fetch(`${API_BASE}/api/elections/active`),
            ]);

            const ticketData = await ticketRes.json().catch(() => []);
            const sessionData = await sessionRes.json().catch(() => []);
            const electionData = await electionRes.json().catch(() => null);

            if (ticketRes.ok) setTickets(Array.isArray(ticketData) ? ticketData : []);
            if (sessionRes.ok) setSessions(Array.isArray(sessionData) ? sessionData : []);
            if (electionRes.ok && electionData && typeof electionData === 'object') {
                setActiveElection(electionData as ElectionInfo);
            } else {
                setActiveElection(null);
            }

            if (!ticketRes.ok || !sessionRes.ok) {
                setError('Some dashboard data could not be loaded.');
            }
        } catch {
            setError('Failed to load guild dashboard.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        void loadData();
    }, [userId]);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/students/ims/all`);
                const data = await response.json().catch(() => ({}));
                const rows = Array.isArray((data as { data?: unknown[] }).data)
                    ? ((data as { data: unknown[] }).data as StudentSummary[])
                    : [];
                if (response.ok) {
                    setStudents(rows);
                }
            } catch {
                setStudents([]);
            }
        };
        void loadStudents();
    }, []);

    useEffect(() => {
        const loadMemberCount = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/students/ims/count`);
                const data = await response.json().catch(() => ({}));
                if (response.ok) {
                    const count = Number((data as { count?: number }).count ?? 0);
                    setMemberCount(Number.isFinite(count) ? count : 0);
                } else {
                    setMemberCount(0);
                }
            } catch {
                setMemberCount(0);
            }
        };
        void loadMemberCount();
    }, []);

    useEffect(() => {
        const loadNotices = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/events`);
                const data = await response.json().catch(() => []);
                if (!response.ok || !Array.isArray(data)) {
                    setNotices([]);
                    return;
                }
                const mapped = (data as GuildNotice[])
                    .filter((item) => {
                        const organizer = (item.organizer ?? '').toLowerCase();
                        return organizer.includes('guild');
                    })
                    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
                setNotices(mapped);
            } catch {
                setNotices([]);
            }
        };
        void loadNotices();
    }, []);

    const ticketMetrics = useMemo(() => {
        const open = tickets.filter((t) => {
            const status = String(t.status ?? '').toUpperCase();
            return status === 'OPEN' || status === 'FORWARDED';
        }).length;
        const escalated = tickets.filter((t) => String(t.status ?? '').toUpperCase() === 'FORWARDED').length;
        const resolved = tickets.filter((t) => {
            const status = String(t.status ?? '').toUpperCase();
            return status === 'RESPONDED' || status === 'RESOLVED' || status === 'CLOSED' || status === 'ARCHIVED';
        }).length;

        const totalHours = tickets.reduce((sum, ticket) => {
            if (!ticket.createdAt) return sum;
            const ageMs = Date.now() - new Date(ticket.createdAt).getTime();
            return sum + Math.max(ageMs / (1000 * 60 * 60), 0);
        }, 0);
        const avgHours = tickets.length ? (totalHours / tickets.length).toFixed(1) : '0.0';
        const resolutionRate = tickets.length ? Math.round((resolved / tickets.length) * 100) : 0;
        const escalationRate = tickets.length ? Math.round((escalated / tickets.length) * 100) : 0;

        return { open, escalated, resolved, avgHours, resolutionRate, escalationRate, totalTickets: tickets.length };
    }, [tickets]);

    const turnoutRate = useMemo(() => {
        if (!activeElection?.eligibleVoters || activeElection.eligibleVoters <= 0) return 0;
        return Math.min(100, Math.round(((activeElection.totalVotes ?? 0) / activeElection.eligibleVoters) * 100));
    }, [activeElection]);

    const governanceHealth = useMemo(() => {
        const attendanceWeight = Math.min(100, sessions.length * 25);
        const queuePenalty = Math.min(35, ticketMetrics.open * 4);
        return Math.max(
            0,
            Math.min(
                100,
                Math.round(ticketMetrics.resolutionRate * 0.5 + turnoutRate * 0.35 + attendanceWeight * 0.15 - queuePenalty * 0.2)
            )
        );
    }, [ticketMetrics.resolutionRate, ticketMetrics.open, turnoutRate, sessions.length]);

    const ticketPreview = useMemo(() => tickets.slice(0, 5), [tickets]);
    const sessionPreview = useMemo(() => sessions.slice(0, 4), [sessions]);
    const postGuildNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setNoticeError('');
        if (!noticeTitle || !noticeDate || !noticeDescription) {
            setNoticeError('Title, date, and description are required.');
            return;
        }
        setIsPostingNotice(true);
        try {
            const form = new FormData();
            form.append('title', noticeTitle);
            form.append('organizer', 'Guild President');
            form.append('eventDate', noticeDate);
            if (noticeTime) form.append('eventTime', noticeTime);
            if (noticeLocation) form.append('location', noticeLocation);
            form.append('description', noticeDescription);
            if (noticeImage) form.append('image', noticeImage);
            if (editingNoticeId) {
                form.append('removeImage', String(removeNoticeImage));
            }

            const targetUrl = editingNoticeId
                ? `${API_BASE}/api/events/notices/${editingNoticeId}`
                : `${API_BASE}/api/events/notices`;
            const response = await fetch(targetUrl, {
                method: editingNoticeId ? 'PUT' : 'POST',
                body: form,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to post notice.');
            }

            setShowNoticeModal(false);
            setNoticeTitle('');
            setNoticeDate('');
            setNoticeTime('');
            setNoticeLocation('');
            setNoticeDescription('');
            setNoticeImage(null);
            setEditingNoticeId(null);
            setRemoveNoticeImage(false);
            const noticesRes = await fetch(`${API_BASE}/api/events`);
            const noticesData = await noticesRes.json().catch(() => []);
            if (noticesRes.ok && Array.isArray(noticesData)) {
                setNotices(
                    (noticesData as GuildNotice[])
                        .filter((item) => (item.organizer ?? '').toLowerCase().includes('guild'))
                        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                );
            }
        } catch (err) {
            setNoticeError(err instanceof Error ? err.message : 'Failed to post notice.');
        } finally {
            setIsPostingNotice(false);
        }
    };

    const startEditNotice = (notice: GuildNotice) => {
        setEditingNoticeId(notice.id);
        setNoticeTitle(notice.title ?? '');
        setNoticeDate(notice.eventDate ?? '');
        setNoticeTime(notice.eventTime ?? '');
        setNoticeLocation(notice.location ?? '');
        setNoticeDescription(notice.description ?? '');
        setNoticeImage(null);
        setRemoveNoticeImage(false);
        setNoticeError('');
        setShowNoticeModal(true);
    };

    const deleteNotice = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to delete notice.');
            }
            setNotices((prev) => prev.filter((n) => n.id !== id));
        } catch {
            setError('Failed to delete one notice.');
        }
    };

    return (
        <>
        <div className="guild-command-dashboard">
            <section className="guild-command-hero">
                <div>
                    <span className="hero-kicker">Guild President Console</span>
                    <h1>Guild Operations Dashboard</h1>
                    <p>
                        A focused summary of guild operations: issue response workflow, attendance oversight, and election
                        participation metrics.
                    </p>
                </div>
                <div className="guild-hero-status-chip">
                    <Users size={16} />
                    <span>{isLoading ? 'Loading governance metrics...' : 'Live governance analytics'}</span>
                </div>
            </section>

            <section className="guild-action-row">
                <button type="button" onClick={() => onNavigate?.('guild-inbox')}>
                    <Megaphone size={16} />
                    Open Inbox
                </button>
                <button type="button" className="ghost" onClick={() => onNavigate?.('attendance-review')}>
                    <CalendarClock size={16} />
                    Attendance Review
                </button>
                <button type="button" className="ghost" onClick={() => setShowNoticeModal(true)}>
                    <ImagePlus size={16} />
                    Post Notice
                </button>
            </section>

            {error && <div className="guild-dash-alert">{error}</div>}

            <section className="guild-kpi-grid">
                <article className="guild-kpi">
                    <small>Open Queue</small>
                    <strong>{isLoading ? '...' : ticketMetrics.open}</strong>
                    <span>Tickets awaiting action</span>
                </article>
                <article className="guild-kpi">
                    <small>Escalated Cases</small>
                    <strong>{isLoading ? '...' : ticketMetrics.escalated}</strong>
                    <span>{isLoading ? '...' : `${ticketMetrics.escalationRate}%`} escalation rate</span>
                </article>
                <article className="guild-kpi">
                    <small>Resolved</small>
                    <strong>{isLoading ? '...' : ticketMetrics.resolved}</strong>
                    <span>{isLoading ? '...' : `${ticketMetrics.resolutionRate}%`} closure rate</span>
                </article>
                <article className="guild-kpi">
                    <small>Avg Response Age</small>
                    <strong>{isLoading ? '...' : `${ticketMetrics.avgHours}h`}</strong>
                    <span>Average queue age</span>
                </article>
                <article className="guild-kpi">
                    <small>Attendance Sessions</small>
                    <strong>{isLoading ? '...' : sessions.length}</strong>
                    <span>Live check-in windows</span>
                </article>
                <article className="guild-kpi">
                    <small>Election Turnout</small>
                    <strong>{isLoading ? '...' : `${turnoutRate}%`}</strong>
                    <span>{activeElection?.status ?? 'No active election'}</span>
                </article>
            </section>

            <section className="guild-summary-row">
                <article className="guild-summary-card">
                    <h3>Governance Health Score</h3>
                    <div className="score-row">
                        <strong>{isLoading ? '...' : `${governanceHealth}/100`}</strong>
                        <span>Composite of response, turnout, and attendance readiness</span>
                    </div>
                    <div className="score-bar">
                        <span style={{ width: `${isLoading ? 0 : governanceHealth}%` }} />
                    </div>
                </article>

                <article className="guild-summary-card">
                    <h3>Operational Snapshot</h3>
                    <div className="snap-grid">
                        <div>
                            <small>Total Tickets</small>
                            <strong>{isLoading ? '...' : ticketMetrics.totalTickets}</strong>
                        </div>
                        <div>
                            <small>Escalation Rate</small>
                            <strong>{isLoading ? '...' : `${ticketMetrics.escalationRate}%`}</strong>
                        </div>
                        <div>
                            <small>Attendance Sessions</small>
                            <strong>{isLoading ? '...' : sessions.length}</strong>
                        </div>
                        <div>
                            <small>Total Association Students</small>
                            <strong>{students.length}</strong>
                        </div>
                        <div>
                            <small>Election Votes</small>
                            <strong>{isLoading ? '...' : `${activeElection?.totalVotes ?? 0}`}</strong>
                        </div>
                    </div>
                </article>
            </section>

            <section className="guild-summary-row">
                <article className="guild-summary-card">
                    <h3>Total AUCASA Members</h3>
                    <div className="score-row">
                        <strong>{memberCount > 0 ? memberCount : students.length}</strong>
                        <span>Registered members</span>
                    </div>
                    <div className="score-bar">
                        <span style={{ width: '100%' }} />
                    </div>
                </article>
            </section>

            <section className="guild-summary-row">
                <article className="guild-summary-card">
                    <h3>Posted Guild Notices</h3>
                    <div className="preview-list">
                        {notices.slice(0, 6).map((notice) => (
                            <div key={notice.id} className="notice-row">
                                <div className="notice-row-main">
                                    <strong>{notice.title}</strong>
                                    <span>{new Date(notice.eventDate).toLocaleDateString()} {notice.location ? `â€¢ ${notice.location}` : ''}</span>
                                </div>
                                <div className="notice-row-actions">
                                    <button type="button" onClick={() => startEditNotice(notice)}>Edit</button>
                                    <button type="button" className="danger" onClick={() => void deleteNotice(notice.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                        {notices.length === 0 && (
                            <div className="preview-empty">No guild notices posted yet.</div>
                        )}
                    </div>
                </article>
            </section>

            <section className="guild-insight-row">
                <article className="guild-summary-card attention-card">
                    <h3><AlertTriangle size={15} /> Priority Ticket Queue</h3>
                    <div className="score-row">
                        <strong>{isLoading ? '...' : ticketMetrics.open}</strong>
                        <span>Cases pending guild action</span>
                    </div>
                    <div className="preview-list">
                        {isLoading ? null : ticketPreview.map((ticket) => (
                            <div key={ticket.id} className="preview-row">
                                <div>
                                    <strong>{ticket.subject}</strong>
                                    <span>{ticket.studentNumber}</span>
                                </div>
                                <em>{ticket.status}</em>
                            </div>
                        ))}
                        {!isLoading && ticketPreview.length === 0 && (
                            <div className="preview-empty">No assigned tickets right now.</div>
                        )}
                    </div>
                </article>

                <article className="guild-summary-card">
                    <h3>Attendance & Election Insight</h3>
                    <div className="preview-list">
                        {isLoading ? null : sessionPreview.map((session) => (
                            <div key={session.id} className="preview-row">
                                <div>
                                    <strong>{session.title}</strong>
                                    <span>{session.campus ?? 'Campus not specified'}</span>
                                </div>
                                <em>{session.startsAt ? new Date(session.startsAt).toLocaleDateString() : 'Live'}</em>
                            </div>
                        ))}
                        {!isLoading && sessionPreview.length === 0 && (
                            <div className="preview-empty">No active attendance sessions currently.</div>
                        )}
                    </div>

                    <div className="election-box">
                        <div className="election-head">
                            <Vote size={16} />
                            <span>Election Snapshot</span>
                        </div>
                        {activeElection ? (
                            <>
                                <strong>{activeElection.title}</strong>
                                <div className="turnout-row">
                                    <span>{turnoutRate}% turnout</span>
                                    <small>{activeElection.totalVotes ?? 0} / {activeElection.eligibleVoters ?? 0}</small>
                                </div>
                                <div className="mini-bar">
                                    <i style={{ width: `${turnoutRate}%` }} />
                                </div>
                                <div className="election-meta">
                                    <div><CircleCheckBig size={13} /> {activeElection.status}</div>
                                    <div><Timer size={13} /> {activeElection.votingEnd ? new Date(activeElection.votingEnd).toLocaleString() : 'End date not set'}</div>
                                </div>
                            </>
                        ) : (
                            <p className="preview-empty">No active election found.</p>
                        )}
                    </div>
                </article>
            </section>

            <section className="guild-quick-row">
                <article className="guild-summary-card quick-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-grid">
                        <button type="button" onClick={() => onNavigate?.('guild-inbox')}>
                            <Megaphone size={14} />
                            Respond to Issues
                        </button>
                        <button type="button" onClick={() => onNavigate?.('attendance-review')}>
                            <CalendarClock size={14} />
                            Review Attendance
                        </button>
                    </div>
                </article>

                <article className="guild-summary-card quick-card">
                    <h3>Response Window</h3>
                    <div className="deadline-row">
                        <Clock3 size={15} />
                        <span>24-hour response target for escalated academic cases.</span>
                    </div>
                </article>
            </section>
        </div>
        {showNoticeModal && (
            <div className="guild-modal-overlay" onClick={() => setShowNoticeModal(false)}>
                <div className="guild-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="guild-modal-head">
                        <h3>Post Guild Notice</h3>
                        <button type="button" onClick={() => setShowNoticeModal(false)}><X size={15} /></button>
                    </div>
                    <form className="guild-notice-form" onSubmit={postGuildNotice}>
                        <input placeholder="Notice title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} required />
                        <div className="guild-form-grid">
                            <input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} required />
                            <input type="time" value={noticeTime} onChange={(e) => setNoticeTime(e.target.value)} />
                        </div>
                        <input placeholder="Location (e.g. Masoro Campus)" value={noticeLocation} onChange={(e) => setNoticeLocation(e.target.value)} />
                        <textarea placeholder="Notice details..." value={noticeDescription} onChange={(e) => setNoticeDescription(e.target.value)} required />
                        <input type="file" accept="image/*" onChange={(e) => setNoticeImage(e.target.files?.[0] ?? null)} />
                        {editingNoticeId && (
                            <label className="guild-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={removeNoticeImage}
                                    onChange={(e) => setRemoveNoticeImage(e.target.checked)}
                                />
                                Remove current image
                            </label>
                        )}
                        {noticeError && <div className="guild-dash-alert">{noticeError}</div>}
                        <button type="submit" disabled={isPostingNotice}>
                            {isPostingNotice ? (editingNoticeId ? 'Saving...' : 'Posting...') : (editingNoticeId ? 'Save Changes' : 'Publish Notice')}
                        </button>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default GuildDashboard;


