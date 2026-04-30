import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CircleCheckBig, Clock3, Megaphone, Timer, Users, Vote } from 'lucide-react';
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

    return (
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
                            <small>Election Votes</small>
                            <strong>{isLoading ? '...' : `${activeElection?.totalVotes ?? 0}`}</strong>
                        </div>
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
    );
};

export default GuildDashboard;
