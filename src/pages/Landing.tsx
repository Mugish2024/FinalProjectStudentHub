import React from 'react';
import { Vote, Calendar, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import './Landing.css';

interface LandingProps {
    onEnter: () => void;
}

const Landing: React.FC<LandingProps> = ({ onEnter }) => {
    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="logo">
                        <img
                            src={aucaLogo}
                            alt="AUCA Logo"
                            className="auca-logo-img-landing"
                            onError={(e) => {
                                e.currentTarget.src = "https://ui-avatars.com/api/?name=A&background=01447B&color=fff";
                            }}
                        />
                        <span>STUDENTHUB</span>
                    </div>
                    <button className="btn-portal" onClick={onEnter}>Login</button>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="hero-content">
                    <div className="badge">OFFICIAL AUCASA PORTAL</div>
                    <h1>Welcome to AUCA Student Association</h1>
                    <p>
                        Experience a seamless, secure, and modern way to manage your campus life at AUCA.
                        From elections to finance and attendance, everything you need is just a click away.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary-large" onClick={onEnter}>
                            Access Student Portal <ArrowRight size={20} />
                        </button>
                        <button className="btn-outline-large">Learn More</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="mock-dashboard">
                        <div className="mock-sidebar"></div>
                        <div className="mock-content">
                            <div className="mock-nav"></div>
                            <div className="mock-card-row">
                                <div className="mock-card-sm"></div>
                                <div className="mock-card-sm"></div>
                            </div>
                            <div className="mock-card-lg"></div>
                        </div>
                    </div>
                    <div className="floating-card c1">
                        <CheckCircle2 size={24} color="var(--secondary)" />
                        <span>Attendance Verified</span>
                    </div>
                    <div className="floating-card c2">
                        <Vote size={24} color="var(--primary)" />
                        <span>Active Election</span>
                    </div>
                </div>
            </section>

            <section className="features-grid">
                <div className="feature-item">
                    <div className="feature-icon"><Vote /></div>
                    <h3>Secure Elections</h3>
                    <p>Vote for your representatives with confidence using our encrypted system.</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><DollarSign /></div>
                    <h3>Easy Payments</h3>
                    <p>Settle your AUCASA fees and tuition without any hassle.</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><Calendar /></div>
                    <h3>Event Tracking</h3>
                    <p>Never miss a campus activity with our real-time calendar.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2024 AUCASA - Adventist University of Central Africa Student Association</p>
            </footer>
        </div>
    );
};

export default Landing;
