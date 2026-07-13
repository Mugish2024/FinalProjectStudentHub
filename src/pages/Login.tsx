import React, { useState } from 'react';
import { User, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type LoginProfile = {
    userId: number;
    studentId?: number | null;
    username: string;
    fullName: string;
    studentNumber: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
    role: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs';
    gpa: string;
    semester: number;
    disciplineStatus: string;
};

interface LoginProps {
    onLogin: (profile: LoginProfile) => void;
    onBack: () => void;
    onSignUp: () => void;
    onForgotPassword: () => void;
    attendanceNotice?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, onSignUp, onForgotPassword, attendanceNotice = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernameOrEmail: email.trim(),
                    password,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Login failed.');
            }

            onLogin(data as LoginProfile);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <button className="back-to-landing" onClick={onBack}>
                <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="login-card">
                <div className="login-brand">
                    <img
                        src={aucaLogo}
                        alt="AUCA Logo"
                        className="login-logo"
                    />
                    <h2>{attendanceNotice ? 'Attendance Check-In' : 'Student Portal Login'}</h2>
                    <p>{attendanceNotice ? 'Attendance QR detected. Sign in to confirm your presence.' : 'Enter your institutional credentials'}</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {attendanceNotice && (
                        <div className="attendance-login-notice">
                            <strong>QR scan received</strong>
                            <span>After signing in, the system will open the attendance validation screen automatically.</span>
                        </div>
                    )}
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
                    <div className="form-group">
                        <label>Email / ID Number</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="e.g. 26701@auca.ac.rw"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper has-password-toggle">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="********"
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
                    </div>

                    <div className="login-form-options">
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={onForgotPassword}
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button type="submit" className="btn-login" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account?
                        <button className="signup-link" onClick={onSignUp}>
                            Register Here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
