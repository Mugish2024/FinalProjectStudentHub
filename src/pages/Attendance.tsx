import { useEffect, useMemo, useState } from 'react';
import {
    MapPin,
    History,
    Wifi,
    Fingerprint,
    CreditCard,
    CheckCircle,
    Calendar,
    Clock,
    TrendingUp,
    ChevronLeft
} from 'lucide-react';
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
}

const Attendance = ({ studentNumber }: AttendanceProps) => {
    const [view, setView] = useState<'dashboard' | 'records'>('dashboard');
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [activeCheckIn, setActiveCheckIn] = useState<AttendanceSession | null>(null);
    const [checkInMethod, setCheckInMethod] = useState<string | null>(null);
    const [checkInStatus, setCheckInStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [wifiSsid, setWifiSsid] = useState('');

    const attendanceRate = useMemo(() => {
        if (records.length === 0) {
            return 0;
        }
        const presentCount = records.filter((r) => r.status === 'Present').length;
        return Math.round((presentCount / records.length) * 100);
    }, [records]);

    const sessionsAttended = useMemo(() => {
        return records.filter((r) => r.status === 'Present').length;
    }, [records]);

    const activeSessions = sessions.filter((s) => s.active);
    const upcomingSessions = sessions.filter((s) => !s.active);

    const fetchSessions = async () => {
        const response = await fetch(`${API_BASE}/api/attendance/sessions?active=false`);
        const data = await response.json().catch(() => []);
        setSessions(Array.isArray(data) ? data : []);
    };

    const fetchRecords = async () => {
        if (!studentNumber) {
            setRecords([]);
            return;
        }
        const response = await fetch(`${API_BASE}/api/attendance/records?studentNumber=${encodeURIComponent(studentNumber)}`);
        const data = await response.json().catch(() => []);
        const parsed = Array.isArray(data) ? data : [];
        const mapped = parsed.map((record: any) => ({
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
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [studentNumber]);

    const handleCheckIn = (session: AttendanceSession) => {
        setActiveCheckIn(session);
        setCheckInMethod(null);
        setCheckInStatus('idle');
        setErrorMessage('');
        setWifiSsid('');
        setTimeout(() => {
            document.getElementById('check-in-interface')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const resetCheckIn = () => {
        setActiveCheckIn(null);
        setCheckInMethod(null);
        setCheckInStatus('idle');
        setErrorMessage('');
    };

    const handleMethodSelect = async (method: string) => {
        if (!activeCheckIn) {
            return;
        }
        if (method === 'wifi' && !wifiSsid.trim()) {
            setCheckInStatus('error');
            setErrorMessage('Please enter your Wi-Fi network name (SSID) before checking in.');
            return;
        }
        setCheckInMethod(method);
        setCheckInStatus('scanning');
        setErrorMessage('');

        try {
            const response = await fetch(`${API_BASE}/api/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber,
                    sessionId: activeCheckIn.id,
                    method,
                    wifiSsid: method === 'wifi' ? wifiSsid : undefined,
                    deviceInfo: navigator.userAgent,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Check-in failed.');
            }
            setCheckInStatus('success');
            await fetchRecords();
        } catch (err) {
            setCheckInStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Check-in failed.');
        }
    };

    return (
        <div className="attendance-page">
            <div className="attendance-header">
                <div>
                    <h2>Attendance Portal</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your presence and join assemblies</p>
                </div>
                {view === 'records' && (
                    <button
                        onClick={() => setView('dashboard')}
                        className="btn-view-records"
                        style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
                    >
                        <ChevronLeft size={18} /> Back to Dashboard
                    </button>
                )}
            </div>

            {!studentNumber && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    Please login to check in and view your records.
                </div>
            )}

            {view === 'dashboard' ? (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <CheckCircle size={28} />
                            </div>
                            <div className="stat-info">
                                <h3>{attendanceRate}%</h3>
                                <p>Attendance Rate</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <TrendingUp size={28} />
                            </div>
                            <div className="stat-info">
                                <h3>{sessionsAttended}</h3>
                                <p>Sessions Attended</p>
                            </div>
                        </div>

                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('records')}>
                            <div className="stat-icon">
                                <History size={28} />
                            </div>
                            <div className="stat-info">
                                <h3>History</h3>
                                <p>View All Records</p>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '2rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>Available Assemblies</h3>

                    <div className="campuses-section">
                        {activeSessions.map((session) => (
                            <div key={session.id} className="campus-card">
                                <div className="campus-image-placeholder">
                                    <div className="campus-overlay"></div>
                                    <MapPin className="campus-icon" />
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '1rem',
                                        left: '1rem',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                    }}>{session.campus || 'Campus'}</span>
                                </div>
                                <div className="campus-content">
                                    <span className="campus-badge">Active Session</span>
                                    <h4 className="campus-name">{session.title}</h4>
                                    <div className="campus-status">
                                        <Clock size={16} /> <span>Started at {new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="campus-actions">
                                        <button className="btn-view-records" onClick={() => setView('records')}>
                                            <History size={18} /> History
                                        </button>
                                        <button className="btn-check-in" onClick={() => handleCheckIn(session)} disabled={!studentNumber}>
                                            <CheckCircle size={18} /> Check In
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {upcomingSessions.map((session) => (
                            <div key={session.id} className="campus-card">
                                <div className="campus-image-placeholder" style={{ background: 'linear-gradient(135deg, #232f4b 0%, #0f1525 100%)' }}>
                                    <div className="campus-overlay"></div>
                                    <MapPin className="campus-icon" />
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '1rem',
                                        left: '1rem',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                    }}>{session.campus || 'Campus'}</span>
                                </div>
                                <div className="campus-content">
                                    <span className="campus-badge" style={{ background: 'rgba(220, 177, 74, 0.15)', color: 'var(--primary)' }}>Upcoming</span>
                                    <h4 className="campus-name">{session.title}</h4>
                                    <div className="campus-status">
                                        <Calendar size={16} /> <span>Next Session: {new Date(session.startsAt).toLocaleString()}</span>
                                    </div>
                                    <div className="campus-actions">
                                        <button className="btn-view-records" onClick={() => setView('records')}>
                                            <History size={18} /> History
                                        </button>
                                        <button className="btn-check-in" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                            Not Started
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeCheckIn && (
                        <div id="check-in-interface" className="check-in-interface">
                            <button
                                onClick={resetCheckIn}
                                style={{ float: 'right', color: 'var(--text-secondary)' }}
                            >×</button>

                            <h3 className="check-in-title">Check In to {activeCheckIn.title}</h3>
                            <p className="check-in-subtitle">Please select your preferred method of verification</p>

                            {checkInStatus === 'success' ? (
                                <div className="check-in-status">
                                    <CheckCircle size={48} color="var(--secondary)" />
                                    <div>
                                        <h4 className="success-message">Successfully Checked In!</h4>
                                        <p style={{ color: 'var(--text-secondary)' }}>You have been marked present.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="form-field" style={{ marginBottom: '1rem' }}>
                                        <label>Wi-Fi Network (SSID) - only if using Wi-Fi</label>
                                        <input
                                            type="text"
                                            className="custom-select"
                                            placeholder="e.g. AUCA-Student-WiFi"
                                            value={wifiSsid}
                                            onChange={(e) => setWifiSsid(e.target.value)}
                                        />
                                    </div>
                                    <div className="methods-grid">
                                        <div
                                            className={`method-card ${checkInMethod === 'card' ? 'active' : ''}`}
                                            onClick={() => handleMethodSelect('card')}
                                        >
                                            <div className="method-icon-container">
                                                <CreditCard size={32} />
                                            </div>
                                            <span className="method-name">Tap Card</span>
                                            <span className="method-desc">Use your student ID card with NFC</span>
                                        </div>

                                        <div
                                            className={`method-card ${checkInMethod === 'biometric' ? 'active' : ''}`}
                                            onClick={() => handleMethodSelect('biometric')}
                                        >
                                            <div className="method-icon-container">
                                                <Fingerprint size={32} />
                                            </div>
                                            <span className="method-name">Biometric</span>
                                            <span className="method-desc">Scan your thumb print</span>
                                        </div>

                                        <div
                                            className={`method-card ${checkInMethod === 'wifi' ? 'active' : ''}`}
                                            onClick={() => handleMethodSelect('wifi')}
                                        >
                                            <div className="method-icon-container">
                                                <Wifi size={32} />
                                            </div>
                                            <span className="method-name">School Wi-Fi</span>
                                            <span className="method-desc">Auto-verify via network connection</span>
                                        </div>
                                    </div>

                                    {checkInStatus === 'scanning' && (
                                        <div className="check-in-status">
                                            <div className="status-spinner"></div>
                                            <span>
                                                {checkInMethod === 'wifi' ? 'Verifying Network Connection...' :
                                                    checkInMethod === 'biometric' ? 'Scanning Fingerprint...' :
                                                        'Reading Card Data...'}
                                            </span>
                                        </div>
                                    )}

                                    {checkInStatus === 'error' && (
                                        <div className="check-in-status" style={{ color: '#b91c1c' }}>
                                            {errorMessage}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="records-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Your Attendance History</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <select style={{
                                background: 'var(--background)',
                                color: 'var(--text-main)',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)'
                            }}>
                                <option>All Semesters</option>
                                <option>Semester 1</option>
                            </select>
                        </div>
                    </div>

                    <table className="records-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Event / Location</th>
                                <th>Time In</th>
                                <th>Method</th>
                                <th>Wi-Fi</th>
                                <th>Verification</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id}>
                                    <td>{record.date}</td>
                                    <td>{record.location}</td>
                                    <td>{record.time}</td>
                                    <td>{record.method}</td>
                                    <td>{record.wifiSsid || '-'}</td>
                                    <td>{record.verificationStatus ?? 'PENDING'}</td>
                                    <td>
                                        <span className={`status-pill ${record.status.toLowerCase()}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Attendance;
