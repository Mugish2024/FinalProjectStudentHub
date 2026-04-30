import { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Bell,
    UserCircle2,
    QrCode,
    Clock3,
    Users,
    RotateCcw,
    MapPin,
} from 'lucide-react';
import gishushuImage from '../assets/gishushu-campus.jpg';
import masoroImage from '../assets/masoro-campus.png';
import './Attendance.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type AttendanceRecord = {
    id: number;
    date: string;
    location: string;
    time: string;
    method: string;
    status: 'Present' | 'Absent';
    verificationStatus?: string;
    wifiSsid?: string | null;
};

type AttendanceSession = {
    id: number;
    title: string;
    campus: string;
    startsAt: string;
    endsAt: string;
    active: boolean;
};

interface AttendanceProps {
    studentNumber: string;
    onOpenCheckIn?: (sessionId?: number) => void;
}

const Attendance = ({ studentNumber, onOpenCheckIn }: AttendanceProps) => {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [sessionSearch, setSessionSearch] = useState('');
    const [activeQrPayload, setActiveQrPayload] = useState('');
    const [activeQrExpiry, setActiveQrExpiry] = useState('');

    const attendanceRate = useMemo(() => {
        if (records.length === 0) return 0;
        const presentCount = records.filter((r) => r.status === 'Present').length;
        return Number(((presentCount / records.length) * 100).toFixed(1));
    }, [records]);

    const sessionsAttended = useMemo(
        () => records.filter((r) => r.status === 'Present').length,
        [records]
    );

    const filteredSessions = useMemo(() => {
        const q = sessionSearch.trim().toLowerCase();
        if (!q) return sessions;
        return sessions.filter((s) =>
            `${s.title} ${s.campus}`.toLowerCase().includes(q)
        );
    }, [sessions, sessionSearch]);

    const activeSessions = filteredSessions.filter((s) => s.active);
    const upcomingSessions = filteredSessions.filter((s) => !s.active);
    const nextUpcoming = upcomingSessions[0] ?? null;

    const fetchSessions = async () => {
        const response = await fetch(`${API_BASE}/api/attendance/sessions?active=false`);
        const data = await response.json().catch(() => []);
        setSessions(Array.isArray(data) ? data : []);
    };

    const fetchActiveQr = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions/active/qr-token`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setActiveQrPayload('');
                setActiveQrExpiry('');
                return;
            }
            setActiveQrPayload(data.payload ?? '');
            setActiveQrExpiry(data.expiresAt ?? '');
        } catch {
            setActiveQrPayload('');
            setActiveQrExpiry('');
        }
    };

    const fetchRecords = async () => {
        if (!studentNumber) {
            setRecords([]);
            return;
        }
        const response = await fetch(
            `${API_BASE}/api/attendance/records?studentNumber=${encodeURIComponent(studentNumber)}`
        );
        const data = await response.json().catch(() => []);
        const parsed = Array.isArray(data) ? data : [];
        const mapped: AttendanceRecord[] = parsed.map((record: any) => ({
            id: record.id,
            date: record.date,
            location: record.location,
            time: record.time,
            method: record.method,
            status: record.status === 'PRESENT' ? 'Present' : 'Absent',
            verificationStatus: record.verificationStatus ?? 'PENDING',
            wifiSsid: record.wifiSsid ?? '',
        }));
        setRecords(mapped);
    };

    useEffect(() => {
        fetchSessions();
        fetchActiveQr();
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [studentNumber]);

    useEffect(() => {
        if (!sessions.length) return;
        const firstActive = sessions.find((s) => s.active);
        if (!firstActive) return;
        const key = `attendance-session-notified-${firstActive.id}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Attendance session is now open', {
                    body: `${firstActive.title} (${firstActive.campus}) is active now.`,
                });
            } else if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => undefined);
            }
        }
        alert(`Attendance session opened: ${firstActive.title} (${firstActive.campus}).`);
    }, [sessions]);

    return (
        <div className="attendance-portal-v2">
            <div className="attendance-topbar">
                <span className="portal-label">Attendance Portal</span>
                <div className="topbar-actions">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            placeholder="Search sessions..."
                            value={sessionSearch}
                            onChange={(e) => setSessionSearch(e.target.value)}
                        />
                    </div>
                    <Bell size={18} />
                    <UserCircle2 size={22} />
                </div>
            </div>

            {!studentNumber && (
                <div className="warn-strip">Please login to check in and view your attendance records.</div>
            )}

            <section className="welcome-row">
                <div>
                    <span className="welcome-kicker">Scholar Attendance Dashboard</span>
                    <h1>Welcome back, Distinguished Scholar</h1>
                </div>
                <button
                    className="checkin-now"
                    onClick={() => {
                        if (activeSessions[0]) {
                            onOpenCheckIn?.(activeSessions[0].id);
                        } else {
                            onOpenCheckIn?.();
                        }
                    }}
                    disabled={activeSessions.length === 0 || !studentNumber}
                >
                    <QrCode size={18} /> Check In Now
                </button>
            </section>

            <section className="summary-grid">
                <article className="summary-card">
                    <h4>Overall Attendance</h4>
                    <div className="value-row">
                        <strong>{attendanceRate}%</strong>
                        <span>~2.4%</span>
                    </div>
                    <div className="mini-bar"><div style={{ width: `${Math.min(attendanceRate, 100)}%` }} /></div>
                    <p>Excellent standing. Keep maintaining your consistency.</p>
                </article>

                <article className="summary-card">
                    <h4>Sessions Attended</h4>
                    <div className="value-row">
                        <strong>{sessionsAttended}</strong>
                        <span>/{Math.max(sessions.length, sessionsAttended)}</span>
                    </div>
                    <div className="dot-row">
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                    <p>You are on track to exceed your previous semester goal.</p>
                </article>

                <article className="upcoming-card">
                    <h5>Upcoming Session</h5>
                    <h3>{nextUpcoming?.title ?? 'No upcoming sessions'}</h3>
                    <p>
                        <Clock3 size={14} />
                        {nextUpcoming ? `Starts at ${new Date(nextUpcoming.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Check back later'}
                    </p>
                    <div className="chip-row">
                        <span>{nextUpcoming?.campus ?? 'Campus'}</span>
                        <span>{nextUpcoming ? new Date(nextUpcoming.startsAt).toLocaleDateString() : 'TBD'}</span>
                    </div>
                </article>
            </section>

            <section className="assemblies-section">
                <div className="section-head">
                    <h2>Today&apos;s Assemblies</h2>
                    <div className="view-pill">
                        <button className="active">Active</button>
                        <button>Calendar</button>
                    </div>
                </div>

                <div className="assemblies-grid">
                    {activeSessions.map((session) => (
                        <article key={session.id} className="assembly-card active-card">
                            <div
                                className="assembly-image active"
                                style={{
                                    backgroundImage: `url(${session.campus?.toLowerCase().includes('gish') ? gishushuImage : masoroImage})`,
                                }}
                            />
                            <div className="assembly-info">
                                <span className="session-badge active">Active Session</span>
                                <h3>{session.title}</h3>
                                <p className="meta"><Users size={14} /> {session.campus}</p>
                                <p className="meta secondary"><Clock3 size={14} /> Started {new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <div className="actions">
                                    <button
                                        onClick={() => onOpenCheckIn?.(session.id)}
                                        disabled={!studentNumber}
                                    >
                                        Check In
                                    </button>
                                    <button className="icon-btn"><RotateCcw size={16} /></button>
                                </div>
                            </div>
                        </article>
                    ))}

                    {upcomingSessions.slice(0, 2).map((session) => (
                        <article key={session.id} className="assembly-card">
                            <div
                                className="assembly-image upcoming"
                                style={{
                                    backgroundImage: `url(${session.campus?.toLowerCase().includes('gish') ? gishushuImage : masoroImage})`,
                                }}
                            />
                            <div className="assembly-info">
                                <span className="session-badge upcoming">Upcoming</span>
                                <h3>{session.title}</h3>
                                <p className="meta"><Clock3 size={14} /> Opens at {new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="meta secondary"><MapPin size={14} /> {session.campus}</p>
                                <div className="actions">
                                    <button disabled>Locked</button>
                                    <button className="icon-btn"><RotateCcw size={16} /></button>
                                </div>
                            </div>
                        </article>
                    ))}

                    {activeSessions.length === 0 && upcomingSessions.length === 0 && (
                        <article className="assembly-empty">No sessions available right now.</article>
                    )}
                </div>
            </section>

            {activeQrPayload && (
                <section className="history-section">
                    <div className="section-head">
                        <h2>Session QR</h2>
                        <button
                            className="checkin-now"
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(activeQrPayload)}`;
                                a.download = 'attendance-session-qr.png';
                                a.click();
                            }}
                        >
                            Download QR
                        </button>
                    </div>
                    <div className="history-table-wrap" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(activeQrPayload)}`}
                            alt="Active attendance QR"
                            style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                        />
                        <div>
                            <p className="meta secondary">Use this QR for current session attendance.</p>
                            <p className="meta secondary">Expires: {activeQrExpiry || 'N/A'}</p>
                        </div>
                    </div>
                </section>
            )}

            <section className="history-section">
                <div className="section-head">
                    <h2>Recent History</h2>
                    <a href="#top">View full report</a>
                </div>
                <div className="history-table-wrap">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Session Name</th>
                                <th>Location</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.slice(0, 8).map((record) => (
                                <tr key={record.id}>
                                    <td>{record.date}</td>
                                    <td>{record.method}</td>
                                    <td>{record.location}</td>
                                    <td>
                                        <span className={record.status === 'Present' ? 'pill present' : 'pill absent'}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="no-data">No attendance records yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Attendance;
