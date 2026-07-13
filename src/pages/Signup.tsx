import React, { useState } from 'react';
import { ArrowLeft, IdCard, Lock, Eye, EyeOff } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { getPasswordStrength } from '../utils/passwordPolicy';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

interface SignupProps {
    onBack: () => void;
    onLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBack, onLogin }) => {
    const [studentNumber, setStudentNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        if (!getPasswordStrength(password).isValid) {
            setError('Please create a stronger password that meets all requirements.');
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
        <div className="login-container signup-container">
            <button className="back-to-landing" onClick={onBack}>
                <ArrowLeft size={16} /> Back to Home
            </button>
            <div className="login-card signup-card">
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
                        <div className="input-wrapper has-password-toggle">
                            <Lock size={18} className="input-icon" />
                            <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <PasswordStrengthMeter password={password} />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-wrapper has-password-toggle">
                            <Lock size={18} className="input-icon" />
                            <input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
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
