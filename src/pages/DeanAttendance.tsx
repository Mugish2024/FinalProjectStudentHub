import { useEffect, useState } from 'react';
import './DeanLabourManagement.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type SessionItem = {
    id: number;
    title: string;
    campus: string;
    startsAt: string;
};

type AdminRecord = {
    id: number;
    studentName: string;
    studentNumber: string;
    sessionTitle: string;
    campus: string;
    checkInAt: string;
    method: string;
    status: string;
    verificationStatus: string;
    wifiSsid?: string;
    ipAddress?: string;
    deviceInfo?: string;
};

const DeanAttendance = () => {
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [records, setRecords] = useState<AdminRecord[]>([]);
    const [sessionId, setSessionId] = useState<string>('');
    const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');
    const [error, setError] = useState('');
    const [notes, setNotes] = useState<Record<number, string>>({});

    const loadSessions = async () => {
        const response = await fetch(`${API_BASE}/api/attendance/sessions?active=false`);
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setSessions(list);
        if (!sessionId && list.length > 0) {
            setSessionId(String(list[0].id));
        }
    };

    const loadRecords = async (sessionFilter: string, verificationFilter: string) => {
        const params = new URLSearchParams();
        if (sessionFilter) {
            params.set('sessionId', sessionFilter);
        }
        if (verificationFilter) {
            params.set('verificationStatus', verificationFilter);
        }
        const response = await fetch(`${API_BASE}/api/attendance/admin/records?${params.toString()}`);
        const data = await response.json().catch(() => []);
        setRecords(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        loadRecords(sessionId, verificationStatus);
    }, [sessionId, verificationStatus]);

    const handleVerify = async (id: number, decision: 'CONFIRMED' | 'REJECTED') => {
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/attendance/records/${id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    notes: notes[id] ?? '',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to verify attendance.');
            }
            await loadRecords(sessionId, verificationStatus);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify attendance.');
        }
    };

    return (
        <div className="dean-labour">
            <header className="dean-header">
                <h1>Attendance Review</h1>
                <p>Verify attendance records and confirm Wi-Fi submissions.</p>
            </header>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div className="dean-view-toggle" style={{ alignItems: 'center', gap: '1rem' }}>
                <span className="toggle-link active">Attendance Records</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                    <select
                        className="custom-select"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                    >
                        {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                                {session.title} ({session.campus})
                            </option>
                        ))}
                    </select>
                    <select
                        className="custom-select"
                        value={verificationStatus}
                        onChange={(e) => setVerificationStatus(e.target.value)}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="view-content fade-in">
                <div className="logs-container">
                    <table className="log-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Session</th>
                                <th>Check-in</th>
                                <th>Method</th>
                                <th>Wi-Fi</th>
                                <th>Verification</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id}>
                                    <td><strong>{record.studentName}</strong><br />{record.studentNumber}</td>
                                    <td>{record.sessionTitle}<br />{record.campus}</td>
                                    <td>{record.checkInAt}</td>
                                    <td>{record.method}</td>
                                    <td>{record.wifiSsid || '-'}</td>
                                    <td>{record.verificationStatus}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button className="view-btn" onClick={() => handleVerify(record.id, 'CONFIRMED')}>Confirm</button>
                                            <button className="view-btn" onClick={() => handleVerify(record.id, 'REJECTED')}>Reject</button>
                                        </div>
                                        <textarea
                                            className="log-textarea"
                                            rows={2}
                                            placeholder="Verification notes"
                                            value={notes[record.id] ?? ''}
                                            onChange={(e) => setNotes((prev) => ({ ...prev, [record.id]: e.target.value }))}
                                        />
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            IP: {record.ipAddress || '-'} • Device: {record.deviceInfo ? record.deviceInfo.slice(0, 35) + '...' : '-'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeanAttendance;
