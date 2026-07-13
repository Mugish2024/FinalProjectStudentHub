import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { getPasswordStrength } from '../utils/passwordPolicy';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

interface PasswordResetProps {
    token?: string;
    onBack: () => void;
    onLogin: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ token = '', onBack, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isResetMode = Boolean(token);

    const handleRequestLink = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setInfo('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Could not send reset link.');
            }
            setInfo(data.message ?? 'If that email exists, a reset link has been sent.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send reset link.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setInfo('');

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
            const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Could not reset password.');
            }
            setPassword('');
            setConfirmPassword('');
            setInfo('Password updated. You can now sign in with your new password.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not reset password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <button className="back-to-landing" onClick={onBack}>
                <ArrowLeft size={16} /> Back
            </button>

            <div className="login-card">
                <div className="login-brand">
                    <img src={aucaLogo} alt="AUCA Logo" className="login-logo" />
                    <h2>{isResetMode ? 'Reset Password' : 'Forgot Password'}</h2>
                    <p>{isResetMode ? 'Create a new password for your account' : 'Enter your email to receive a reset link'}</p>
                </div>

                <form className="login-form" onSubmit={isResetMode ? handleResetPassword : handleRequestLink}>
                    {error && (
                        <div className="login-error-message">
                            {error}
                        </div>
                    )}
                    {info && (
                        <div className="login-info-message">
                            {info}
                        </div>
                    )}

                    {!isResetMode && (
                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {isResetMode && (
                        <>
                            <div className="form-group">
                                <label>New Password</label>
                                <div className="input-wrapper has-password-toggle">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create new password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
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
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Repeat new password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
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
                        </>
                    )}

                    <button type="submit" className="btn-login" disabled={isSubmitting}>
                        {isSubmitting ? 'Please wait...' : (isResetMode ? 'Reset Password' : 'Send Reset Link')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Remember your password?
                        <button className="signup-link" onClick={onLogin}>
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;
