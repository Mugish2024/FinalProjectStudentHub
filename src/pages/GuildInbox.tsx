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
    X,
} from 'lucide-react';
import './GuildInbox.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

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
    const [activeModal, setActiveModal] = useState<'reply' | 'forward' | null>(null);
    const [recentPage, setRecentPage] = useState(1);

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
        if (status === 'RESPONDED' || status === 'RESOLVED' || status === 'CLOSED') return 'RESOLVED';
        if (status === 'ARCHIVED') return 'ARCHIVES';
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

    const recentTickets = useMemo(
        () =>
            [...tickets].sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            }),
        [tickets]
    );

    const recentPageSize = 5;
    const recentPageCount = Math.max(1, Math.ceil(recentTickets.length / recentPageSize));
    const recentPageItems = recentTickets.slice((recentPage - 1) * recentPageSize, recentPage * recentPageSize);

    useEffect(() => {
        if (recentPage > recentPageCount) {
            setRecentPage(recentPageCount);
        }
    }, [recentPage, recentPageCount]);

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
            return false;
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
            return false;
        }
        setResponseText((prev) => ({ ...prev, [ticketId]: '' }));
        setStatusMessage('Reply sent successfully.');
        await loadTickets();
        return true;
    };

    const handleForward = async (ticketId: number) => {
        setError('');
        setStatusMessage('');
        const targetId = forwardTarget[ticketId];
        if (!targetId) {
            setError('Select a staff member to forward to.');
            return false;
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
            return false;
        }
        setStatusMessage('Issue sent to staff successfully.');
        await loadTickets();
        return true;
    };

    const handleClose = async (ticketId: number) => {
        setError('');
        setStatusMessage('');
        const response = await fetch(`${API_BASE}/api/tickets/${ticketId}/close`, {
            method: 'POST',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to mark issue as solved.');
            return;
        }
        setStatusMessage('Issue marked as solved.');
        setActiveBucket('RESOLVED');
        await loadTickets();
    };

    const bucketItems = [
        { id: 'INBOX' as const, label: 'New', icon: Inbox, count: bucketCounts.INBOX },
        { id: 'ESCALATED' as const, label: 'Sent to Staff', icon: AlertTriangle, count: bucketCounts.ESCALATED },
        { id: 'RESOLVED' as const, label: 'Solved', icon: CheckCircle2, count: bucketCounts.RESOLVED },
        { id: 'ARCHIVES' as const, label: 'Closed', icon: Archive, count: bucketCounts.ARCHIVES },
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
                        <p>Student support</p>
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
                        onClick={() => selectedTicket && setActiveModal('reply')}
                        disabled={!selectedTicket}
                    >
                        <SendHorizontal size={15} />
                        Write Reply
                    </button>
                </div>
            </header>

            <main className="guild-board__main">
                <header className="guild-main__head">
                    <div>
                        <p>STUDENT REQUESTS</p>
                        <h1>Support Inbox</h1>
                        <span>Review student requests, reply clearly, or send them to the right staff member.</span>
                    </div>
                    <div className="guild-head-summary">
                        <strong>{queueCount}</strong>
                        <span>need review</span>
                    </div>
                </header>

                {error && <div className="guild-inbox__alert">{error}</div>}
                {statusMessage && <div className="guild-inbox__success">{statusMessage}</div>}

                {!selectedTicket && <div className="guild-empty">No requests in this section right now.</div>}

                {selectedTicket && (
                    <section className="guild-case-card">
                        <div className="guild-card__header">
                            <div>
                                <div className="guild-row-meta">
                                    <span className={`status-pill status-pill--${selectedTicket.status?.toLowerCase()}`}>{selectedTicket.status}</span>
                                    <span>Request #{selectedTicket.id}</span>
                                </div>
                                <h3>{selectedTicket.subject}</h3>
                            </div>
                            <div className="guild-elapsed">
                                <span>Waiting Time</span>
                                <strong>{formatElapsed(selectedTicket.createdAt)}</strong>
                            </div>
                        </div>

                        <div className="guild-case-actors">
                            <div>
                                <span>Student</span>
                                <strong>{selectedTicket.studentNumber}</strong>
                            </div>
                            <div>
                                <span>Handled By</span>
                                <strong>{selectedTicket.assignedToName ?? 'Guild Office'}</strong>
                            </div>
                            <div>
                                <span>Created</span>
                                <strong>{selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'N/A'}</strong>
                            </div>
                        </div>

                        <p className="guild-message">{selectedTicket.message}</p>

                        <div className="guild-case-actions">
                            <button type="button" className="guild-case-actions__primary" onClick={() => setActiveModal('reply')}>
                                <SendHorizontal size={16} />
                                Reply
                            </button>
                            <button type="button" onClick={() => setActiveModal('forward')}>
                                <ShieldAlert size={16} />
                                Send to Staff
                            </button>
                            <button type="button" className="guild-case-actions__success" onClick={() => handleClose(selectedTicket.id)}>
                                <CheckCircle2 size={16} />
                                Mark Solved
                            </button>
                        </div>
                    </section>
                )}

                <div className="guild-mini-card guild-request-list-panel">
                    <h4>Request List</h4>
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
                    {!filteredTickets.length && <div className="queue-empty">No requests in this section.</div>}
                </div>

                <div className="guild-mini-card stats stats--compact guild-request-stats-panel">
                    <article>
                        <Clock3 size={13} />
                        <small>Need Review</small>
                        <strong>{queueCount}</strong>
                    </article>
                    <article>
                        <Building2 size={13} />
                        <small>Solved</small>
                        <strong>{bucketCounts.RESOLVED + bucketCounts.ARCHIVES}</strong>
                    </article>
                </div>
            </main>

            <aside className="guild-board__right">
                <div className="guild-mini-card guild-recent-problems">
                    <div className="guild-recent-problems__head">
                        <div>
                            <span>Recent Problems</span>
                            <h4>All Requests</h4>
                        </div>
                        <strong>{tickets.length}</strong>
                    </div>

                    <div className="guild-recent-table-wrap">
                        <table className="guild-recent-table">
                            <thead>
                                <tr>
                                    <th>Problem</th>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPageItems.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => {
                                            setActiveBucket(categorize(ticket));
                                            setSelectedTicketId(ticket.id);
                                        }}
                                    >
                                        <td>
                                            <strong>{ticket.subject}</strong>
                                            <span>{ticket.message}</span>
                                        </td>
                                        <td>{ticket.studentNumber}</td>
                                        <td>
                                            <span className={`recent-status recent-status--${String(ticket.status).toLowerCase()}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td>{formatElapsed(ticket.createdAt)}</td>
                                    </tr>
                                ))}
                                {!recentPageItems.length && (
                                    <tr>
                                        <td colSpan={4}>No requests submitted yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="guild-recent-pagination">
                        <button type="button" onClick={() => setRecentPage((page) => Math.max(1, page - 1))} disabled={recentPage === 1}>
                            Prev
                        </button>
                        <span>
                            Page {recentPage} of {recentPageCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => setRecentPage((page) => Math.min(recentPageCount, page + 1))}
                            disabled={recentPage === recentPageCount}
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div className="guild-mini-card guild-mini-card--guide">
                    <h4>How to Handle Requests</h4>
                    <p>Keep replies respectful, simple, and clear about what happens next.</p>
                    <div className="guild-guide-list">
                        <span>1. Read carefully</span>
                        <span>2. Reply or send to staff</span>
                        <span>3. Mark solved when done</span>
                    </div>
                </div>

            </aside>

            {selectedTicket && activeModal === 'reply' && (
                <div className="guild-action-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="guild-reply-title" onClick={() => setActiveModal(null)}>
                    <section className="guild-action-modal guild-action-modal--reply" onClick={(event) => event.stopPropagation()}>
                        <div className="guild-action-modal__head">
                            <div>
                                <span>Student reply</span>
                                <h3 id="guild-reply-title">Reply to {selectedTicket.studentNumber}</h3>
                            </div>
                            <button type="button" className="guild-modal-close" aria-label="Close reply form" onClick={() => setActiveModal(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p className="guild-action-modal__note">Write a clear response and mention the next step the student should expect.</p>
                        <textarea
                            id="guild-response-box"
                            rows={6}
                            value={responseText[selectedTicket.id] ?? ''}
                            onChange={(e) => setResponseText((prev) => ({ ...prev, [selectedTicket.id]: e.target.value }))}
                            placeholder="Write your reply here..."
                        />
                        <label className="guild-checkbox">
                            <input
                                type="checkbox"
                                checked={respondToAll[selectedTicket.id] ?? false}
                                onChange={(e) => setRespondToAll((prev) => ({ ...prev, [selectedTicket.id]: e.target.checked }))}
                            />
                            Send this reply to related students too
                        </label>
                        <div className="guild-action-modal__footer">
                            <button type="button" className="guild-modal-button guild-modal-button--light" onClick={() => setActiveModal(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="guild-modal-button guild-modal-button--primary"
                                onClick={async () => {
                                    const sent = await handleRespond(selectedTicket.id);
                                    if (sent) setActiveModal(null);
                                }}
                            >
                                <SendHorizontal size={16} />
                                Send Reply
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {selectedTicket && activeModal === 'forward' && (
                <div className="guild-action-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="guild-forward-title" onClick={() => setActiveModal(null)}>
                    <section className="guild-action-modal guild-action-modal--compact" onClick={(event) => event.stopPropagation()}>
                        <div className="guild-action-modal__head">
                            <div>
                                <span>Staff support</span>
                                <h3 id="guild-forward-title">Send request to staff</h3>
                            </div>
                            <button type="button" className="guild-modal-close" aria-label="Close staff form" onClick={() => setActiveModal(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="guild-forward__assigned">
                            <div className="avatar-chip">{initials(selectedTicket.assignedToName)}</div>
                            <div>
                                <strong>{selectedTicket.assignedToName ?? 'Not Assigned Yet'}</strong>
                                <span>Current handler</span>
                            </div>
                        </div>
                        <label className="guild-modal-label" htmlFor="guild-forward-select">
                            Choose staff member
                        </label>
                        <select
                            id="guild-forward-select"
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
                        <div className="guild-urgency guild-urgency--modal">
                            <div>
                                <h5>Priority</h5>
                                <small>{formatElapsed(selectedTicket.createdAt)}</small>
                            </div>
                            <div className="urgency-track">
                                <span style={{ width: `${urgencyRatio(selectedTicket.createdAt)}%` }} />
                            </div>
                        </div>
                        <div className="guild-action-modal__footer">
                            <button type="button" className="guild-modal-button guild-modal-button--light" onClick={() => setActiveModal(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="guild-modal-button guild-modal-button--primary"
                                onClick={async () => {
                                    const sent = await handleForward(selectedTicket.id);
                                    if (sent) setActiveModal(null);
                                }}
                            >
                                <ShieldAlert size={16} />
                                Send to Staff
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default GuildInbox;
