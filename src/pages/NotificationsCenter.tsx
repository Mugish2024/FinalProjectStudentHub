import { useEffect, useMemo, useState } from 'react';
import './NotificationsCenter.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

interface NotificationsCenterProps {
    userRole: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
    studentId?: number | null;
}

type NoticeItem = {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'payment' | 'finance' | 'attendance' | 'system';
};

const NotificationsCenter = ({ userRole, studentId }: NotificationsCenterProps) => {
    const [items, setItems] = useState<NoticeItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const notices: NoticeItem[] = [];

            try {
                if (studentId) {
                    const res = await fetch(`${API_BASE}/api/payments/history/student/${studentId}`);
                    const data = await res.json().catch(() => []);
                    if (res.ok && Array.isArray(data)) {
                        data.slice(0, 4).forEach((p: any) => {
                            notices.push({
                                id: `payment-${p.id}`,
                                title: `Payment ${p.status ?? 'PENDING'}`,
                                message: `Receipt ${p.receiptNumber ?? '-'} - ${p.amount ?? 0} RWF`,
                                time: p.paidAt ? new Date(p.paidAt).toLocaleString() : 'Pending confirmation',
                                type: 'payment',
                            });
                        });
                    }
                }
            } catch {
                // ignore and continue with other sources
            }

            try {
                const res = await fetch(`${API_BASE}/api/finance/transparency/summary`);
                const data = await res.json().catch(() => null);
                if (res.ok && data?.latestUpdates?.length) {
                    data.latestUpdates.slice(0, 4).forEach((u: any) => {
                        notices.push({
                            id: `finance-${u.id}`,
                            title: u.title ?? 'Finance update',
                            message: u.message ?? 'New finance communication posted.',
                            time: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'Recently',
                            type: 'finance',
                        });
                    });
                }
            } catch {
                // ignore
            }

            if (userRole === 'staff' || userRole === 'dean' || userRole === 'guild_president') {
                try {
                    const res = await fetch(`${API_BASE}/api/attendance/sessions?active=true`);
                    const data = await res.json().catch(() => []);
                    if (res.ok && Array.isArray(data)) {
                        data.slice(0, 3).forEach((s: any) => {
                            notices.push({
                                id: `attendance-${s.id}`,
                                title: `Active attendance session`,
                                message: `${s.title ?? 'Session'} is currently active.`,
                                time: s.startsAt ? new Date(s.startsAt).toLocaleString() : 'Now',
                                type: 'attendance',
                            });
                        });
                    }
                } catch {
                    // ignore
                }
            }

            if (notices.length === 0) {
                notices.push({
                    id: 'system-empty',
                    title: 'No new notifications',
                    message: 'You are all caught up for now.',
                    time: new Date().toLocaleString(),
                    type: 'system',
                });
            }

            setItems(notices);
            setLoading(false);
        };
        void load();
    }, [studentId, userRole]);

    const grouped = useMemo(() => {
        return {
            payment: items.filter((i) => i.type === 'payment'),
            finance: items.filter((i) => i.type === 'finance'),
            attendance: items.filter((i) => i.type === 'attendance'),
            system: items.filter((i) => i.type === 'system'),
        };
    }, [items]);

    return (
        <div className="notifications-page">
            <header className="notifications-head">
                <div>
                    <h1>Notifications Center</h1>
                    <p>Track payment, finance, attendance, and system alerts relevant to your role.</p>
                </div>
                <div className="notifications-stats">
                    <span>Total: {items.length}</span>
                    <span>Payment: {grouped.payment.length}</span>
                    <span>Finance: {grouped.finance.length}</span>
                </div>
            </header>

            {loading && <div className="notifications-loading">Loading notifications...</div>}

            {!loading && (
                <section className="notifications-grid">
                    {(['payment', 'finance', 'attendance', 'system'] as const).map((bucket) => (
                        <article key={bucket} className="notifications-card">
                            <h3>{bucket.charAt(0).toUpperCase() + bucket.slice(1)}</h3>
                            {(grouped[bucket].length ? grouped[bucket] : []).map((item) => (
                                <div key={item.id} className="notice-row">
                                    <strong>{item.title}</strong>
                                    <p>{item.message}</p>
                                    <span>{item.time}</span>
                                </div>
                            ))}
                            {grouped[bucket].length === 0 && <div className="notice-empty">No items.</div>}
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
};

export default NotificationsCenter;
