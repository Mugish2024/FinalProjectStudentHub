import { useEffect, useState } from 'react';
import './SettingsCenter.css';

interface SettingsCenterProps {
    fullName?: string;
    userId?: string;
    userRole?: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
}

const SETTINGS_KEY = 'aucasa_user_settings';

const SettingsCenter = ({ fullName = 'User', userId = 'N/A', userRole = null }: SettingsCenterProps) => {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [paymentAlerts, setPaymentAlerts] = useState(true);
    const [attendanceAlerts, setAttendanceAlerts] = useState(true);
    const [securityTimeout, setSecurityTimeout] = useState('15');
    const [status, setStatus] = useState('');

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(SETTINGS_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as {
                emailAlerts?: boolean;
                paymentAlerts?: boolean;
                attendanceAlerts?: boolean;
                securityTimeout?: string;
            };
            setEmailAlerts(parsed.emailAlerts ?? true);
            setPaymentAlerts(parsed.paymentAlerts ?? true);
            setAttendanceAlerts(parsed.attendanceAlerts ?? true);
            setSecurityTimeout(parsed.securityTimeout ?? '15');
        } catch {
            // ignore invalid settings cache
        }
    }, []);

    const save = () => {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            emailAlerts,
            paymentAlerts,
            attendanceAlerts,
            securityTimeout,
        }));
        setStatus('Settings saved successfully.');
        window.setTimeout(() => setStatus(''), 2500);
    };

    return (
        <div className="settings-page">
            <header className="settings-head">
                <h1>Settings</h1>
                <p>Manage your account preferences, alerts, and session security.</p>
            </header>

            {status && <div className="settings-status">{status}</div>}

            <section className="settings-grid">
                <article className="settings-card">
                    <h3>Account Profile</h3>
                    <div className="kv"><span>Full Name</span><strong>{fullName}</strong></div>
                    <div className="kv"><span>Identifier</span><strong>{userId}</strong></div>
                    <div className="kv"><span>Role</span><strong>{userRole ?? 'N/A'}</strong></div>
                </article>

                <article className="settings-card">
                    <h3>Notification Preferences</h3>
                    <label><input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} /> Email alerts</label>
                    <label><input type="checkbox" checked={paymentAlerts} onChange={(e) => setPaymentAlerts(e.target.checked)} /> Payment updates</label>
                    <label><input type="checkbox" checked={attendanceAlerts} onChange={(e) => setAttendanceAlerts(e.target.checked)} /> Attendance reminders</label>
                </article>

                <article className="settings-card">
                    <h3>Security</h3>
                    <label className="stacked">
                        <span>Auto-lock timeout (minutes)</span>
                        <select value={securityTimeout} onChange={(e) => setSecurityTimeout(e.target.value)}>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">60 minutes</option>
                        </select>
                    </label>
                    <p>For password changes, use Admin/User account setup workflow in your authorized module.</p>
                </article>
            </section>

            <button className="settings-save" onClick={save}>Save Settings</button>
        </div>
    );
};

export default SettingsCenter;
