import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Archive,
    Building2,
    CheckCircle2,
    Clock3,
    Inbox,
    SendHorizontal,
    ShieldAlert,
    UserRound,
} from 'lucide-react';
import legacyImage from '../assets/masoro2.png';
import './GuildInbox.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type TicketItem = {
    id: number;
    studentNumber: string;
    subject: string;
    message: string;
    status: string;
    assignedToName?: string;
    responseText?: string;
    responseToAll?: boolean;
    createdAt?: string;
    respondedAt?: string;
};

type Recipient = {
    id: number;
    fullName: string;
    role: string;
};

interface GuildInboxProps {
    userId: number;
}

const GuildInbox = ({ userId }: GuildInboxProps) => {
    const [activeBucket, setActiveBucket] = useState<'INBOX' | 'ESCALATED' | 'RESOLVED' | 'ARCHIVES'>('INBOX');
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [responseText, setResponseText] = useState<Record<number, string>>({});
    const [forwardTarget, setForwardTarget] = useState<Record<number, string>>({});
    const [respondToAll, setRespondToAll] = useState<Record<number, boolean>>({});
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

    const loadTickets = async () => {
        if (!userId) return;
        const response = await fetch(`${API_BASE}/api/tickets/assigned/${userId}`);
        const data = await response.json().catch(() => []);
        if (!response.ok) {
            setError('Failed to load guild inbox.');
            return;
        }
        const list = Array.isArray(data) ? data : [];
        setTickets(list);
        setSelectedTicketId((current) => {
            if (!list.length) return null;
            if (current && list.some((ticket) => ticket.id === current)) return current;
            return list[0].id;
        });
    };

    const loadRecipients = async () => {
        const response = await fetch(`${API_BASE}/api/users/recipients?role=staff`);
        const data = await response.json().catch(() => []);
        if (response.ok) {
            setRecipients(Array.isArray(data) ? data : []);
        }
    };

    useEffect(() => {
        void loadTickets();
        void loadRecipients();
    }, [userId]);

    const categorize = (ticket: TicketItem) => {
        const status = String(ticket.status ?? '').toUpperCase();
        if (status === 'FORWARDED') return 'ESCALATED';
        if (status === 'RESPONDED' || status === 'RESOLVED') return 'RESOLVED';
        if (status === 'CLOSED' || status === 'ARCHIVED') return 'ARCHIVES';
        return 'INBOX';
    };

    const bucketCounts = useMemo(() => {
        const counts = { INBOX: 0, ESCALATED: 0, RESOLVED: 0, ARCHIVES: 0 };
        tickets.forEach((ticket) => {
            counts[categorize(ticket)] += 1;
        });
        return counts;
    }, [tickets]);

    const filteredTickets = useMemo(
        () => tickets.filter((ticket) => categorize(ticket) === activeBucket),
        [tickets, activeBucket]
    );

    useEffect(() => {
        if (!filteredTickets.length) {
            setSelectedTicketId(null);
            return;
        }
        if (!selectedTicketId || !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
            setSelectedTicketId(filteredTickets[0].id);
        }
    }, [filteredTickets, selectedTicketId]);

    const selectedTicket = useMemo(
        () => filteredTickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
        [filteredTickets, selectedTicketId]
    );

    const formatElapsed = (createdAt?: string) => {
        if (!createdAt) return 'N/A';
        const created = new Date(createdAt).getTime();
        const now = Date.now();
        const diffMs = Math.max(now - created, 0);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        if (hours < 1) return 'Under 1 hour';
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    };

    const urgencyRatio = (createdAt?: string) => {
        if (!createdAt) return 15;
        const created = new Date(createdAt).getTime();
        const now = Date.now();
        const hours = Math.max((now - created) / (1000 * 60 * 60), 0);
        return Math.min(100, Math.max(12, Math.round((hours / 24) * 100)));
    };

    const initials = (name?: string) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    };

    const handleRespond = async (ticketId: number) => {
        setError('');
        setStatusMessage('');
        const message = (responseText[ticketId] ?? '').trim();
        if (!message) {
            setError('Please write a response before sending.');
            return;
        }
        const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                message,
                respondToAll: respondToAll[ticketId] ?? false,
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to respond.');
            return;
        }
        setResponseText((prev) => ({ ...prev, [ticketId]: '' }));
        setStatusMessage('Response sent successfully.');
        await loadTickets();
    };

    const handleForward = async (ticketId: number) => {
        setError('');
        setStatusMessage('');
        const targetId = forwardTarget[ticketId];
        if (!targetId) {
            setError('Select a staff member to forward to.');
            return;
        }
        const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/forward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                forwardToUserId: Number(targetId),
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to forward.');
            return;
        }
        setStatusMessage('Issue forwarded successfully.');
        await loadTickets();
    };

    const bucketItems = [
        { id: 'INBOX' as const, label: 'Inbox', icon: Inbox, count: bucketCounts.INBOX },
        { id: 'ESCALATED' as const, label: 'Escalated', icon: AlertTriangle, count: bucketCounts.ESCALATED },
        { id: 'RESOLVED' as const, label: 'Resolved', icon: CheckCircle2, count: bucketCounts.RESOLVED },
        { id: 'ARCHIVES' as const, label: 'Archives', icon: Archive, count: bucketCounts.ARCHIVES },
    ];

    const queueCount = bucketCounts.INBOX + bucketCounts.ESCALATED;

    return (
        <div className="guild-board">
            <header className="guild-board__top">
                <div className="guild-profile guild-profile--top">
                    <div className="guild-profile__avatar">
                        <UserRound size={20} />
                    </div>
                    <div>
                        <h3>Guild President</h3>
                        <p>Student Guild Council</p>
                    </div>
                </div>

                <nav className="guild-top-nav">
                    {bucketItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`guild-top-nav__item ${activeBucket === item.id ? 'active' : ''}`}
                                onClick={() => setActiveBucket(item.id)}
                            >
                                <Icon size={17} />
                                <span>{item.label}</span>
                                <small>{item.count}</small>
                            </button>
                        );
                    })}
                </nav>

                <div className="guild-top-actions">
                    <button
                        type="button"
                        className="guild-top-actions__compose"
                        onClick={() => {
                            const box = document.getElementById('guild-response-box') as HTMLTextAreaElement | null;
                            if (box) box.focus();
                        }}
                    >
                        <SendHorizontal size={15} />
                        Compose Response
                    </button>
                </div>
            </header>

            <main className="guild-board__main">
                <header className="guild-main__head">
                    <p>REVIEW BOARD</p>
                    <h1>Guild President Inbox</h1>
                    <span>Review student issues, respond directly, or escalate to staff.</span>
                </header>

                {error && <div className="guild-inbox__alert">{error}</div>}
                {statusMessage && <div className="guild-inbox__success">{statusMessage}</div>}

                {!selectedTicket && <div className="guild-empty">No tickets in this queue right now.</div>}

                {selectedTicket && (
                    <section className="guild-case-card">
                        <div className="guild-card__header">
                            <div>
                                <div className="guild-row-meta">
                                    <span className={`status-pill status-pill--${selectedTicket.status?.toLowerCase()}`}>{selectedTicket.status}</span>
                                    <span>Case ID: #GR-{selectedTicket.id}</span>
                                </div>
                                <h3>{selectedTicket.subject}</h3>
                            </div>
                            <div className="guild-elapsed">
                                <span>Time Elapsed</span>
                                <strong>{formatElapsed(selectedTicket.createdAt)}</strong>
                            </div>
                        </div>

                        <div className="guild-case-actors">
                            <div>
                                <span>Student Submitter</span>
                                <strong>{selectedTicket.studentNumber}</strong>
                            </div>
                            <div>
                                <span>Assigned Desk</span>
                                <strong>{selectedTicket.assignedToName ?? 'Guild President Office'}</strong>
                            </div>
                            <div>
                                <span>Created</span>
                                <strong>{selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'N/A'}</strong>
                            </div>
                        </div>

                        <p className="guild-message">{selectedTicket.message}</p>

                        <div className="guild-actions">
                            <div className="guild-response">
                                <div className="guild-response__title">Official President Response</div>
                                <textarea
                                    id="guild-response-box"
                                    rows={6}
                                    value={responseText[selectedTicket.id] ?? ''}
                                    onChange={(e) => setResponseText((prev) => ({ ...prev, [selectedTicket.id]: e.target.value }))}
                                    placeholder="Address the concerns and outline the next steps for the student body..."
                                />
                                <label className="guild-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={respondToAll[selectedTicket.id] ?? false}
                                        onChange={(e) => setRespondToAll((prev) => ({ ...prev, [selectedTicket.id]: e.target.checked }))}
                                    />
                                    Send response to all related students
                                </label>
                                <button type="button" onClick={() => handleRespond(selectedTicket.id)}>
                                    <SendHorizontal size={16} />
                                    Send Response
                                </button>
                            </div>

                            <div className="guild-forward">
                                <h4>Staff Assignment</h4>
                                <div className="guild-forward__assigned">
                                    <div className="avatar-chip">{initials(selectedTicket.assignedToName)}</div>
                                    <div>
                                        <strong>{selectedTicket.assignedToName ?? 'Not Assigned Yet'}</strong>
                                        <span>Dean of Students</span>
                                    </div>
                                </div>
                                <select
                                    value={forwardTarget[selectedTicket.id] ?? ''}
                                    onChange={(e) => setForwardTarget((prev) => ({ ...prev, [selectedTicket.id]: e.target.value }))}
                                >
                                    <option value="">Select staff member</option>
                                    {recipients.map((recipient) => (
                                        <option key={recipient.id} value={recipient.id}>
                                            {recipient.fullName} ({recipient.role})
                                        </option>
                                    ))}
                                </select>
                                <button type="button" className="btn-secondary" onClick={() => handleForward(selectedTicket.id)}>
                                    <ShieldAlert size={15} />
                                    Forward Issue
                                </button>

                                <div className="guild-urgency">
                                    <h5>Urgency Level</h5>
                                    <div className="urgency-track">
                                        <span style={{ width: `${urgencyRatio(selectedTicket.createdAt)}%` }} />
                                    </div>
                                    <p>Academic continuity cases are prioritized with a 24-hour response mandate.</p>
                                </div>

                                <div className="guild-quick-stats">
                                    <article>
                                        <small>Queue</small>
                                        <strong>{queueCount}</strong>
                                    </article>
                                    <article>
                                        <small>Resolved</small>
                                        <strong>{bucketCounts.RESOLVED}</strong>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <aside className="guild-board__right">
                <div className="guild-mini-card">
                    <h4>Ticket Queue</h4>
                    {filteredTickets.slice(0, 6).map((ticket) => (
                        <button
                            type="button"
                            key={ticket.id}
                            className={`queue-row ${selectedTicketId === ticket.id ? 'active' : ''}`}
                            onClick={() => setSelectedTicketId(ticket.id)}
                        >
                            <div>
                                <strong>{ticket.subject}</strong>
                                <span>{ticket.studentNumber}</span>
                            </div>
                            <small>{formatElapsed(ticket.createdAt)}</small>
                        </button>
                    ))}
                    {!filteredTickets.length && <div className="queue-empty">No items in this section.</div>}
                </div>

                <div
                    className="guild-mini-card guild-mini-card--accent"
                    style={{
                        backgroundImage: `linear-gradient(145deg, rgba(7, 28, 70, 0.86), rgba(8, 64, 116, 0.76)), url('${legacyImage}')`,
                    }}
                >
                    <small>Legacy of Excellence</small>
                    <h3>University Accountability Board</h3>
                </div>

                <div className="guild-mini-card stats stats--compact">
                    <article>
                        <Clock3 size={13} />
                        <small>Open Queue</small>
                        <strong>{queueCount}</strong>
                    </article>
                    <article>
                        <Building2 size={13} />
                        <small>Total Resolved</small>
                        <strong>{bucketCounts.RESOLVED + bucketCounts.ARCHIVES}</strong>
                    </article>
                </div>
            </aside>
        </div>
    );
};

export default GuildInbox;
