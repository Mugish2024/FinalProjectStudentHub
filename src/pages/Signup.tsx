import React, { useState } from 'react';
import { ArrowLeft, IdCard, Lock } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

interface SignupProps {
    onBack: () => void;
    onLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBack, onLogin }) => {
    const [studentNumber, setStudentNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/api/auth/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentNumber: studentNumber.trim(), password }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Sign up failed.');
            }
            setMessage('Account created successfully. You can now sign in.');
            setStudentNumber('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <button className="back-to-landing" onClick={onBack} style={{ position: 'fixed', top: '2rem', left: '2rem', background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Back to Home
            </button>
            <div className="login-card">
                <div className="login-brand">
                    <img src={aucaLogo} alt="AUCA Logo" className="login-logo" />
                    <h2>Create Student Account</h2>
                    <p>Use your existing student ID. If not found, account setup will fail.</p>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
                    {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}
                    <div className="form-group">
                        <label>Student ID Number</label>
                        <div className="input-wrapper">
                            <IdCard size={18} className="input-icon" />
                            <input type="text" required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="e.g. 26330" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                        </div>
                    </div>
                    <button type="submit" className="btn-login" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Already have an account?
                        <button className="signup-link" onClick={onLogin}>Sign In</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
