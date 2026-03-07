import React, { useState } from 'react';
import { User, Lock, Info, ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Login.css';

interface LoginProps {
    onLogin: (isStaff: boolean) => void;
    onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
    const [showSignUpInfo, setShowSignUpInfo] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isStaff, setIsStaff] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, validation would happen here
        onLogin(isStaff);
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
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="staff-checkbox-container">
                        <input
                            type="checkbox"
                            id="staffCheck"
                            checked={isStaff}
                            onChange={(e) => setIsStaff(e.target.checked)}
                        />
                        <label htmlFor="staffCheck">I am a Staff Member / Dean</label>
                    </div>

                    <button type="submit" className="btn-login">Sign In</button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account?
                        <button className="signup-link" onClick={() => setShowSignUpInfo(true)}>
                            Register Here
                        </button>
                    </p>
                </div>
            </div>

            {showSignUpInfo && (
                <div className="signup-info-overlay">
                    <div className="info-modal">
                        <div className="info-icon-wrapper">
                            <Info size={32} />
                        </div>
                        <h3>Account Registration</h3>
                        <p>
                            Credentials are issued manually. Please contact the <strong>AUCASA Office</strong> to verify your identity and set up your account.
                        </p>

                        <div className="signup-contact-info">
                            <div className="contact-item">
                                <Phone size={16} />
                                <strong>Phone:</strong> <span>+250 788 000 000</span>
                            </div>
                            <div className="contact-item">
                                <Mail size={16} />
                                <strong>Email:</strong> <span>aucasa@auca.ac.rw</span>
                            </div>
                            <div className="contact-item">
                                <MapPin size={16} />
                                <strong>Office:</strong> <span>Main Campus, Block B, Room 102</span>
                            </div>
                        </div>

                        <button className="btn-close-info" onClick={() => setShowSignUpInfo(false)} style={{ marginTop: '1rem' }}>
                            Got it, thanks
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
