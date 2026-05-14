import { useEffect, useMemo, useState } from 'react';
import { Clock3, QrCode as QrIcon, Users } from 'lucide-react';
import './DeanAttendance.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type SessionItem = {
    id: number;
    title: string;
    campus: string;
    startsAt: string;
    endsAt: string;
    active: boolean;
};

type AttendanceAdminRecord = {
    id: number;
    studentName: string;
    studentNumber: string;
    sessionTitle: string;
    campus: string;
    checkInAt: string;
    method: string;
    status: string;
    verificationStatus: string;
};

const DeanAttendance = () => {
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [sessionId, setSessionId] = useState<string>('');
    const [presentCount, setPresentCount] = useState(0);
    const [qrPayload, setQrPayload] = useState('');
    const [qrExpiry, setQrExpiry] = useState('');
    const [error, setError] = useState('');
    const [now, setNow] = useState(new Date());
    const [presentRecords, setPresentRecords] = useState<AttendanceAdminRecord[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [isPresentModalOpen, setIsPresentModalOpen] = useState(false);
    const [presentPage, setPresentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const loadSessions = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions?active=false`);
            const data = await response.json().catch(() => []);
            const list = Array.isArray(data) ? data : [];
            setSessions(list);
            if (!sessionId && list.length > 0) {
                const active = list.find((s: SessionItem) => s.active);
                setSessionId(String((active ?? list[0]).id));
            }
        } catch {
            setError('Failed to load sessions.');
        }
    };

    const loadPresentCount = async (selectedSessionId: string) => {
        if (!selectedSessionId) {
            setPresentCount(0);
            return;
        }
        try {
            const response = await fetch(
                `${API_BASE}/api/attendance/admin/records?sessionId=${selectedSessionId}&status=PRESENT`
            );
            const data = await response.json().catch(() => []);
            setPresentCount(Array.isArray(data) ? data.length : 0);
        } catch {
            setError('Failed to load attendance count.');
        }
    };

    const loadPresentRecords = async (selectedSessionId: string) => {
        if (!selectedSessionId) {
            setPresentRecords([]);
            return;
        }
        setRecordsLoading(true);
        try {
            const response = await fetch(
                `${API_BASE}/api/attendance/admin/records?sessionId=${selectedSessionId}&status=PRESENT`
            );
            const data = await response.json().catch(() => []);
            setPresentRecords(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load present student records.');
            setPresentRecords([]);
        } finally {
            setRecordsLoading(false);
        }
    };

    useEffect(() => {
        void loadSessions();
        const poll = setInterval(() => {
            void loadSessions();
            if (sessionId) {
                void loadPresentCount(sessionId);
            }
        }, 15000);
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        void loadPresentCount(sessionId);
    }, [sessionId]);

    const handleGenerateQr = async () => {
        if (!sessionId) return;
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions/${sessionId}/qr-token`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to generate QR token.');
            }
            setQrPayload(data.payload ?? '');
            setQrExpiry(data.expiresAt ?? '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR token.');
        }
    };

    const handleToggleSession = async (active: boolean) => {
        if (!sessionId) return;
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions/${sessionId}/active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? `Failed to ${active ? 'open' : 'close'} session.`);
            }
            await loadSessions();
            await loadPresentCount(sessionId);
            if (!active) {
                setQrPayload('');
                setQrExpiry('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${active ? 'open' : 'close'} session.`);
        }
    };

    const selectedSession = sessions.find((s) => String(s.id) === sessionId);

    const elapsedLabel = useMemo(() => {
        if (!selectedSession?.startsAt || !selectedSession.active) return '00:00:00';
        const start = new Date(selectedSession.startsAt).getTime();
        const diff = Math.max(0, Math.floor((now.getTime() - start) / 1000));
        const hh = String(Math.floor(diff / 3600)).padStart(2, '0');
        const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const ss = String(diff % 60).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }, [selectedSession, now]);

    const dateTimeLabel = useMemo(
        () =>
            now.toLocaleString([], {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        [now]
    );

    const totalPages = Math.max(1, Math.ceil(presentRecords.length / pageSize));
    const pagedPresentRecords = useMemo(() => {
        const start = (presentPage - 1) * pageSize;
        return presentRecords.slice(start, start + pageSize);
    }, [presentPage, presentRecords]);

    const openPresentModal = async () => {
        if (!sessionId) {
            setError('Select a session first.');
            return;
        }
        setPresentPage(1);
        setIsPresentModalOpen(true);
        await loadPresentRecords(sessionId);
    };

    const handleDownloadPresentPdf = () => {
        if (!sessionId) {
            setError('Select a session first.');
            return;
        }
        window.open(`${API_BASE}/api/attendance/report/pdf?sessionId=${encodeURIComponent(sessionId)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="dean-attendance-simple">
            <header className="dean-simple-head">
                <h1>Attendance Review</h1>
                <p>Session control, live attendance count, and real-time timing.</p>
            </header>

            {error && <div className="dean-simple-error">{error}</div>}

            <section className="dean-simple-controls">
                <div className="control-group">
                    <label>Session</label>
                    <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title} ({s.campus}) {s.active ? '- Open' : '- Closed'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="control-buttons">
                    {selectedSession?.active ? (
                        <>
                            <button className="btn-dark" onClick={handleGenerateQr}>
                                <QrIcon size={16} /> Generate QR
                            </button>
                            <button className="btn-danger" onClick={() => handleToggleSession(false)}>
                                Close Session
                            </button>
                        </>
                    ) : (
                        <button className="btn-success" onClick={() => handleToggleSession(true)}>
                            Open Session (Auto-closes in 1h)
                        </button>
                    )}
                </div>
            </section>

            <section className="simple-metrics-grid">
                <article className="metric-card dark clickable" onClick={() => void openPresentModal()}>
                    <span className="kicker">Live Attendance</span>
                    <strong><Users size={18} /> {presentCount}</strong>
                    <p>Students marked present in this session (tap to view list)</p>
                </article>

                <article className="metric-card green">
                    <span className="kicker">Exact Date & Time</span>
                    <strong><Clock3 size={18} /> {dateTimeLabel}</strong>
                    <p>Live clock for attendance oversight</p>
                </article>

                <article className="metric-card">
                    <span className="kicker">Session Running Time</span>
                    <strong>{elapsedLabel}</strong>
                    <p>Elapsed since session was opened</p>
                </article>
            </section>

            {qrPayload && (
                <section className="simple-qr-panel">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(qrPayload)}`}
                        alt="Attendance QR"
                    />
                    <div className="qr-meta">
                        <h3>Current Session QR</h3>
                        <p>Expires at: {qrExpiry || 'N/A'}</p>
                        <button
                            className="btn-dark"
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&data=${encodeURIComponent(qrPayload)}`;
                                a.download = 'attendance-session-qr.png';
                                a.click();
                            }}
                        >
                            Download QR
                        </button>
                    </div>
                </section>
            )}

            {isPresentModalOpen && (
                <div className="attendance-modal-overlay" onClick={() => setIsPresentModalOpen(false)}>
                    <section className="attendance-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="attendance-modal-head">
                            <h3>Present Students - {selectedSession?.title ?? 'Selected Session'}</h3>
                            <button className="btn-dark" type="button" onClick={handleDownloadPresentPdf}>
                                Generate PDF Report
                            </button>
                        </div>

                        <div className="attendance-modal-body">
                            {recordsLoading && <p>Loading present students...</p>}
                            {!recordsLoading && presentRecords.length === 0 && <p>No present students found for this session.</p>}
                            {!recordsLoading && presentRecords.length > 0 && (
                                <div className="attendance-table-wrap">
                                    <table className="attendance-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Student ID</th>
                                                <th>Check-in</th>
                                                <th>Method</th>
                                                <th>Verification</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedPresentRecords.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{(presentPage - 1) * pageSize + index + 1}</td>
                                                    <td>{item.studentName || '-'}</td>
                                                    <td>{item.studentNumber || '-'}</td>
                                                    <td>{item.checkInAt || '-'}</td>
                                                    <td>{item.method || '-'}</td>
                                                    <td>{item.verificationStatus || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="attendance-modal-foot">
                            <button
                                className="btn-dark"
                                type="button"
                                disabled={presentPage <= 1}
                                onClick={() => setPresentPage((p) => Math.max(1, p - 1))}
                            >
                                Prev
                            </button>
                            <span>Page {presentPage} of {totalPages}</span>
                            <button
                                className="btn-dark"
                                type="button"
                                disabled={presentPage >= totalPages}
                                onClick={() => setPresentPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default DeanAttendance;
