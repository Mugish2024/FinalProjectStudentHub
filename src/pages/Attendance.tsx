import { useState, useEffect } from 'react';
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

interface AttendanceRecord {
    id: string;
    date: string;
    location: string;
    time: string;
    method: string;
    status: 'Present' | 'Absent';
}

const MOCK_RECORDS: AttendanceRecord[] = [
    { id: '1', date: '2023-10-25', location: 'Gishushu General Assembly', time: '14:30', method: 'Tap Card', status: 'Present' },
    { id: '2', date: '2023-10-18', location: 'Masoro General Assembly', time: '14:35', method: 'Biometric', status: 'Present' },
    { id: '3', date: '2023-10-11', location: 'Gishushu General Assembly', time: '14:30', method: 'Wifi', status: 'Present' },
    { id: '4', date: '2023-10-04', location: 'Masoro General Assembly', time: '-', method: '-', status: 'Absent' },
];

const Attendance = () => {
    const [view, setView] = useState<'dashboard' | 'records'>('dashboard');
    const [activeCheckIn, setActiveCheckIn] = useState<string | null>(null);
    const [checkInMethod, setCheckInMethod] = useState<string | null>(null);
    const [checkInStatus, setCheckInStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

    // Reset status when method changes
    useEffect(() => {
        if (checkInMethod) {
            setCheckInStatus('scanning');
            // Simulate scanning/connecting
            const timer = setTimeout(() => {
                setCheckInStatus('success');
            }, 2000); // 2s delay
            return () => clearTimeout(timer);
        }
    }, [checkInMethod]);

    const handleCheckIn = (location: string) => {
        setActiveCheckIn(location);
        setCheckInMethod(null);
        setCheckInStatus('idle');
        // Scroll to check-in section
        setTimeout(() => {
            document.getElementById('check-in-interface')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const resetCheckIn = () => {
        setActiveCheckIn(null);
        setCheckInMethod(null);
        setCheckInStatus('idle');
    };

    return (
        <div className="attendance-page">
            {/* Header */}
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

            {view === 'dashboard' ? (
                <>
                    {/* Stats Overview */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <CheckCircle size={28} />
                            </div>
                            <div className="stat-info">
                                <h3>85%</h3>
                                <p>Attendance Rate</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <TrendingUp size={28} />
                            </div>
                            <div className="stat-info">
                                <h3>12</h3>
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

                    {/* Campuses Section */}
                    <h3 style={{ marginTop: '2rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>Available Assemblies</h3>

                    <div className="campuses-section">
                        {/* Gishushu Card */}
                        <div className="campus-card">
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
                                }}>Gishushu Campus</span>
                            </div>
                            <div className="campus-content">
                                <span className="campus-badge">Active Session</span>
                                <h4 className="campus-name">Gishushu General Assembly</h4>
                                <div className="campus-status">
                                    <Clock size={16} /> <span>Started at 14:00 PM</span>
                                </div>
                                <div className="campus-actions">
                                    <button className="btn-view-records" onClick={() => setView('records')}>
                                        <History size={18} /> History
                                    </button>
                                    <button className="btn-check-in" onClick={() => handleCheckIn('Gishushu General Assembly')}>
                                        <CheckCircle size={18} /> Check In
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Masoro Card */}
                        <div className="campus-card">
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
                                }}>Masoro Campus</span>
                            </div>
                            <div className="campus-content">
                                <span className="campus-badge" style={{ background: 'rgba(220, 177, 74, 0.15)', color: 'var(--primary)' }}>Upcoming</span>
                                <h4 className="campus-name">Masoro General Assembly</h4>
                                <div className="campus-status">
                                    <Calendar size={16} /> <span>Next Session: Friday 14:00</span>
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
                    </div>

                    {/* Check In Interface (Conditional) */}
                    {activeCheckIn && (
                        <div id="check-in-interface" className="check-in-interface">
                            <button
                                onClick={resetCheckIn}
                                style={{ float: 'right', color: 'var(--text-secondary)' }}
                            >✕</button>

                            <h3 className="check-in-title">Check In to {activeCheckIn}</h3>
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
                                    <div className="methods-grid">
                                        <div
                                            className={`method-card ${checkInMethod === 'card' ? 'active' : ''}`}
                                            onClick={() => setCheckInMethod('card')}
                                        >
                                            <div className="method-icon-container">
                                                <CreditCard size={32} />
                                            </div>
                                            <span className="method-name">Tap Card</span>
                                            <span className="method-desc">Use your student ID card with NFC</span>
                                        </div>

                                        <div
                                            className={`method-card ${checkInMethod === 'biometric' ? 'active' : ''}`}
                                            onClick={() => setCheckInMethod('biometric')}
                                        >
                                            <div className="method-icon-container">
                                                <Fingerprint size={32} />
                                            </div>
                                            <span className="method-name">Biometric</span>
                                            <span className="method-desc">Scan your thumb print</span>
                                        </div>

                                        <div
                                            className={`method-card ${checkInMethod === 'wifi' ? 'active' : ''}`}
                                            onClick={() => setCheckInMethod('wifi')}
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
                                </>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Records View */
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
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_RECORDS.map((record) => (
                                <tr key={record.id}>
                                    <td>{record.date}</td>
                                    <td>{record.location}</td>
                                    <td>{record.time}</td>
                                    <td>{record.method}</td>
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
