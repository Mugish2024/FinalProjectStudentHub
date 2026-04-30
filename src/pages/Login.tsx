import React, { useState } from 'react';
import { User, Lock, ArrowLeft } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

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
    role: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president';
    gpa: string;
    semester: number;
    disciplineStatus: string;
};

interface LoginProps {
    onLogin: (profile: LoginProfile) => void;
    onBack: () => void;
    onSignUp: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, onSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernameOrEmail: email,
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
            <button className="back-to-landing" onClick={onBack} style={{
                position: 'fixed',
                top: '2rem',
                left: '2rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer'
            }}>
                <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="login-card">
                <div className="login-brand">
                    <img
                        src={aucaLogo}
                        alt="AUCA Logo"
                        className="login-logo"
                    />
                    <h2>Student Portal Login</h2>
                    <p>Enter your institutional credentials</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {error}
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
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="********"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
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
