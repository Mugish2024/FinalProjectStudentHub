import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    FileText,
    Send,
    Wifi,
} from 'lucide-react';
import './StudentIssues.css';

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

interface StudentIssuesProps {
    studentNumber: string;
}

const CATEGORY_OPTIONS = [
    'Academic Inquiry',
    'Registration',
    'Housing & Dormitory',
    'Finance & Fees',
    'IT Support',
    'Other',
];

const normalizeStatus = (status?: string) => {
    const value = (status ?? '').toLowerCase();

    if (['responded', 'resolved', 'closed'].includes(value)) return 'resolved';
    if (['forwarded', 'in_review', 'in review', 'pending'].includes(value)) return 'in-review';
    return 'open';
};

const getStatusLabel = (status?: string) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'resolved') return 'Resolved';
    if (normalized === 'in-review') return 'In Review';
    return 'Open';
};

const formatTicketDate = (value?: string) => {
    if (!value) return 'Recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getTicketIcon = (subject: string) => {
    const lowered = subject.toLowerCase();

    if (lowered.includes('wifi') || lowered.includes('internet') || lowered.includes('network')) {
        return Wifi;
    }

    if (lowered.includes('transcript') || lowered.includes('grade') || lowered.includes('course')) {
        return CheckCircle2;
    }

    return FileText;
};

const StudentIssues = ({ studentNumber }: StudentIssuesProps) => {
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
    const [message, setMessage] = useState('');
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadTickets = async () => {
        if (!studentNumber) return;

        try {
            const response = await fetch(`${API_BASE}/api/tickets/student/${studentNumber}`);
            const data = await response.json().catch(() => []);

            if (!response.ok) {
                setError('Failed to load issues.');
                return;
            }

            setTickets(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load issues.');
        }
    };

    useEffect(() => {
        loadTickets();
    }, [studentNumber]);

    const submitIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const trimmedSubject = subject.trim();
        const trimmedMessage = message.trim();

        if (!trimmedSubject || !trimmedMessage) {
            setError('Please provide both subject and description.');
            return;
        }

        const response = await fetch(`${API_BASE}/api/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentNumber,
                subject: trimmedSubject,
                message: `[Category: ${category}]\n${trimmedMessage}`,
            }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to submit issue.');
            return;
        }

        setSuccess('Issue submitted. The Guild President will review it.');
        setSubject('');
        setMessage('');
        setCategory(CATEGORY_OPTIONS[0]);
        await loadTickets();
    };

    const sortedTickets = useMemo(
        () =>
            [...tickets].sort(
                (a, b) =>
                    new Date(b.createdAt ?? b.respondedAt ?? 0).getTime() -
                    new Date(a.createdAt ?? a.respondedAt ?? 0).getTime(),
            ),
        [tickets],
    );

    const recentTickets = sortedTickets.slice(0, 3);
    const totalIssues = tickets.length;
    const resolvedIssues = tickets.filter((ticket) => normalizeStatus(ticket.status) === 'resolved').length;
    const pendingIssues = Math.max(0, totalIssues - resolvedIssues);
    const resolutionRate = totalIssues === 0 ? 0 : Math.round((resolvedIssues / totalIssues) * 100);

    return (
        <div className="student-issues-page">
            <header className="issues-hero">
                <span className="issues-eyebrow">Student Services</span>
                <h1>Student Issues & Support</h1>
                <p>
                    Encountered a technical hurdle or an academic discrepancy? Share the details below.
                    Our support team typically responds within 24 business hours.
                </p>
            </header>

            {error && <div className="student-issues__alert error">{error}</div>}
            {success && <div className="student-issues__alert success">{success}</div>}

            <div className="issues-layout">
                <section className="issues-left-column">
                    <form className="issue-request-card" onSubmit={submitIssue}>
                        <div className="request-head">
                            <span className="request-icon">
                                <Send size={18} />
                            </span>
                            <div>
                                <h3>New Request</h3>
                                <p>Submit your issue and track updates in real time.</p>
                            </div>
                        </div>

                        <label htmlFor="issue-subject">Subject</label>
                        <input
                            id="issue-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            placeholder="e.g. Grades not reflecting for History"
                        />

                        <label htmlFor="issue-category">Category</label>
                        <select
                            id="issue-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {CATEGORY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="issue-description">Description</label>
                        <textarea
                            id="issue-description"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={6}
                            placeholder="Provide a detailed description of your issue..."
                        />

                        <button type="submit">Submit Ticket</button>
                    </form>

                    <div className="escalation-card">
                        <AlertTriangle size={18} />
                        <div>
                            <strong>Urgent Escalation?</strong>
                            <p>For immediate safety or security concerns, contact emergency support directly.</p>
                        </div>
                    </div>
                </section>

                <section className="issues-right-column">
                    <div className="recent-header">
                        <div>
                            <h3>My Recent Tickets</h3>
                            <p>Tracking your recent interactions with support.</p>
                        </div>
                        <button type="button" className="view-all-btn">
                            View All Tickets
                        </button>
                    </div>

                    <div className="recent-ticket-list">
                        {recentTickets.length === 0 && (
                            <div className="ticket-empty">No issues submitted yet. Your new ticket will appear here.</div>
                        )}

                        {recentTickets.map((ticket) => {
                            const Icon = getTicketIcon(ticket.subject);
                            const statusClass = normalizeStatus(ticket.status);

                            return (
                                <article key={ticket.id} className="ticket-card">
                                    <div className="ticket-icon">
                                        <Icon size={18} />
                                    </div>
                                    <div className="ticket-content">
                                        <h4>{ticket.subject}</h4>
                                        <p>
                                            ID: #SP-{ticket.id} <span>•</span> {formatTicketDate(ticket.createdAt)}
                                        </p>
                                    </div>
                                    <div className={`ticket-status ticket-status--${statusClass}`}>
                                        {getStatusLabel(ticket.status)}
                                    </div>
                                    <ChevronRight size={18} className="ticket-arrow" />
                                </article>
                            );
                        })}
                    </div>

                    <div className="analytics-card">
                        <div className="analytics-head">
                            <h3>Support Analytics</h3>
                            <BarChart3 size={20} />
                        </div>

                        <div className="analytics-grid">
                            <div className="analytics-stat">
                                <div className="value">{String(totalIssues).padStart(2, '0')}</div>
                                <span>Total Issues</span>
                            </div>
                            <div className="analytics-stat">
                                <div className="value pending">{String(pendingIssues).padStart(2, '0')}</div>
                                <span>Pending</span>
                            </div>
                            <div className="analytics-stat">
                                <div className="value resolved">{String(resolvedIssues).padStart(2, '0')}</div>
                                <span>Resolved</span>
                            </div>
                        </div>

                        <div className="resolution-row">
                            <div className="resolution-label">
                                <span>Issue Resolution Rate</span>
                                <strong>{resolutionRate}%</strong>
                            </div>
                            <div className="resolution-track">
                                <span style={{ width: `${resolutionRate}%` }} />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudentIssues;

