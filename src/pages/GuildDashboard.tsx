import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck2, CalendarClock, CheckCircle2, CircleCheckBig, ClipboardList, Clock3, ImagePlus, Inbox, Megaphone, SendHorizontal, Sparkles, Timer, Users, Vote, X } from 'lucide-react';
import './GuildDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

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

    const ticketPreview = useMemo(() => tickets.slice(0, 3), [tickets]);
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
                    <span className="hero-kicker">Guild Console</span>
                    <h1>Guild Dashboard</h1>
                    <p>
                        Track issues, attendance, notices, and election activity in one clear view.
                    </p>
                </div>
                <div className="guild-hero-status-chip">
                    <Users size={16} />
                    <span>{isLoading ? 'Loading...' : 'Live overview'}</span>
                </div>
            </section>

            <section className="guild-action-row">
                <button type="button" onClick={() => onNavigate?.('guild-inbox')}>
                    <Megaphone size={16} />
                    Review Requests
                </button>
                <button type="button" className="ghost" onClick={() => onNavigate?.('attendance-review')}>
                    <CalendarClock size={16} />
                    Check Attendance
                </button>
                <button type="button" className="ghost" onClick={() => setShowNoticeModal(true)}>
                    <ImagePlus size={16} />
                    Add Notice
                </button>
                <button type="button" className="ghost" onClick={() => onNavigate?.('aucasa-plan')}>
                    <ClipboardList size={16} />
                    Aucasa Plan
                </button>
            </section>

            {error && <div className="guild-dash-alert">{error}</div>}

            <section className="guild-kpi-grid">
                <article className="guild-kpi">
                    <div className="guild-kpi-icon"><Inbox size={20} /></div>
                    <div>
                        <small>Need Review</small>
                        <strong>{isLoading ? '...' : ticketMetrics.open}</strong>
                        <span>Student requests waiting</span>
                    </div>
                </article>
                <article className="guild-kpi">
                    <div className="guild-kpi-icon teal"><SendHorizontal size={20} /></div>
                    <div>
                        <small>Sent to Staff</small>
                        <strong>{isLoading ? '...' : ticketMetrics.escalated}</strong>
                        <span>{isLoading ? '...' : `${ticketMetrics.escalationRate}%`} of requests</span>
                    </div>
                </article>
                <article className="guild-kpi">
                    <div className="guild-kpi-icon green"><CheckCircle2 size={20} /></div>
                    <div>
                        <small>Solved</small>
                        <strong>{isLoading ? '...' : ticketMetrics.resolved}</strong>
                        <span>{isLoading ? '...' : `${ticketMetrics.resolutionRate}%`} completed</span>
                    </div>
                </article>
                <article className="guild-kpi">
                    <div className="guild-kpi-icon amber"><Clock3 size={20} /></div>
                    <div>
                        <small>Average Wait</small>
                        <strong>{isLoading ? '...' : `${ticketMetrics.avgHours}h`}</strong>
                        <span>How long requests wait</span>
                    </div>
                </article>
                <article className="guild-kpi">
                    <div className="guild-kpi-icon indigo"><CalendarCheck2 size={20} /></div>
                    <div>
                        <small>Attendance</small>
                        <strong>{isLoading ? '...' : sessions.length}</strong>
                        <span>Active check-ins</span>
                    </div>
                </article>
                <article className="guild-kpi">
                    <div className="guild-kpi-icon purple"><Vote size={20} /></div>
                    <div>
                        <small>Voting</small>
                        <strong>{isLoading ? '...' : `${turnoutRate}%`}</strong>
                        <span>{activeElection?.status ?? 'No active election'}</span>
                    </div>
                </article>
            </section>

            <section className="guild-summary-row guild-members-notices-row">
                <article className="guild-summary-card guild-member-card">
                    <div className="guild-card-heading">
                        <div className="guild-feature-icon"><Users size={22} /></div>
                        <div>
                            <span>Members</span>
                            <h3>Total AUCASA Members</h3>
                        </div>
                    </div>
                    <div className="member-card-main">
                        <strong>{memberCount > 0 ? memberCount : students.length}</strong>
                        <span>Registered members</span>
                    </div>
                    <div className="score-bar">
                        <span style={{ width: '100%' }} />
                    </div>
                    <div className="member-card-footer">
                        <span>Active body</span>
                        <strong>AUCASA</strong>
                    </div>
                </article>
                <article className="guild-summary-card guild-notices-card">
                    <div className="guild-card-heading">
                        <div className="guild-feature-icon notice"><Sparkles size={22} /></div>
                        <div>
                            <span>Notice Board</span>
                            <h3>Posted Notices</h3>
                        </div>
                    </div>
                    <div className="preview-list">
                        {notices.slice(0, 6).map((notice) => (
                            <div key={notice.id} className="notice-row">
                                <div className="notice-date-badge">
                                    <strong>{new Date(notice.eventDate).getDate()}</strong>
                                    <span>{new Date(notice.eventDate).toLocaleString(undefined, { month: 'short' })}</span>
                                </div>
                                <div className="notice-row-main">
                                    <strong>{notice.title}</strong>
                                    <span>{notice.location || 'Campus notice'}</span>
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
                <article className="guild-summary-card guild-actions-card">
                    <div className="guild-card-heading">
                        <div className="guild-feature-icon actions"><Megaphone size={22} /></div>
                        <div>
                            <span>Shortcuts</span>
                            <h3>Quick Actions</h3>
                        </div>
                    </div>
                    <div className="quick-action-stack">
                        <button type="button" onClick={() => onNavigate?.('guild-inbox')}>
                            <Megaphone size={16} />
                            <span>Reply to Requests</span>
                        </button>
                        <button type="button" onClick={() => onNavigate?.('attendance-review')}>
                            <CalendarClock size={16} />
                            <span>Review Attendance</span>
                        </button>
                        <button type="button" onClick={() => onNavigate?.('aucasa-plan')}>
                            <ClipboardList size={16} />
                            <span>Aucasa Plan</span>
                        </button>
                    </div>
                </article>
            </section>

            <section className="guild-insight-row">
                <article className="guild-summary-card attention-card">
                    <div className="review-card-head">
                        <div className="review-card-icon"><AlertTriangle size={20} /></div>
                        <div>
                            <span>Student Support</span>
                            <h3>Requests to Review</h3>
                        </div>
                        <strong>{isLoading ? '...' : ticketMetrics.open}</strong>
                    </div>
                    <p className="review-card-note">Requests waiting for guild action</p>
                    <div className="preview-list review-list">
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
                            <div className="preview-empty">No assigned requests right now.</div>
                        )}
                    </div>
                    {!isLoading && ticketPreview.length > 0 && (
                        <button type="button" className="review-more-btn" onClick={() => onNavigate?.('guild-inbox')}>
                            Open full inbox
                            {tickets.length > 3 && <span>{tickets.length - 3}</span>}
                        </button>
                    )}
                </article>

                <article className="guild-summary-card">
                    <h3>Attendance and Voting</h3>
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
                            <span>Voting Summary</span>
                        </div>
                        {activeElection ? (
                            <>
                                <strong>{activeElection.title}</strong>
                                <div className="turnout-row">
                                    <span>{turnoutRate}% voted</span>
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
                    <h3>Reply Target</h3>
                    <div className="deadline-row">
                        <Clock3 size={15} />
                        <span>Try to reply to urgent student requests within 24 hours.</span>
                    </div>
                </article>
            </section>
        </div>
        {showNoticeModal && (
            <div className="guild-modal-overlay" onClick={() => setShowNoticeModal(false)}>
                <div className="guild-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="guild-modal-head">
                        <h3>Add Guild Notice</h3>
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



