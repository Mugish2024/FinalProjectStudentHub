import React from 'react';
import { 
    Vote, 
    Calendar, 
    DollarSign, 
    ArrowLeft,
    Handshake
} from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import campusView from '../assets/campus-view.png';
import './Landing.css';

interface ServicesProps {
    onBack: () => void;
}

const Services: React.FC<ServicesProps> = ({ onBack }) => {
    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="nav-logo-group" onClick={onBack} style={{ cursor: 'pointer' }}>
                        <img src={aucaLogo} alt="Logo" className="auca-logo-img-landing" />
                    </div>
                    <div className="nav-links">
                        <a onClick={onBack} style={{ cursor: 'pointer' }}>Home</a>
                        <a href="#">About</a>
                        <a className="active">Services</a>
                    </div>
                    <button className="btn-portal-outline" onClick={onBack}>
                        <ArrowLeft size={20} />
                        Back Home
                    </button>
                </div>
            </nav>

            <section className="landing-hero" style={{ paddingTop: '100px', gridTemplateColumns: '1fr 1fr' }}>
                <div className="hero-left">
                    <div className="badge">STUDENT EMPOWERMENT</div>
                    <h1 style={{ fontSize: '3.8rem' }}>OUR SERVICES</h1>
                    <p>
                        StudentHub provides the essential digital tools for every AUCA student to manage their 
                        campus responsibilities and engage with student leadership.
                    </p>
                    
                    <button className="btn-more" onClick={onBack}>Get Started Now</button>
                </div>

                <div className="hero-right">
                    <div className="visual-container">
                        <div className="large-image-shape" style={{ borderRadius: '30px' }}>
                            <img src={campusView} alt="AUCA Campus" />
                        </div>
                    </div>
                </div>
            </section>

            <section style={{ padding: '80px 4rem', background: '#fff' }}>
                <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4rem' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className="pill-icon" style={{ background: 'var(--soft-blue)', minWidth: '64px', height: '64px', borderRadius: '16px' }}>
                            <Vote color="var(--reb-blue)" size={32} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem' }}>E-Voting System</h3>
                            <p style={{ color: 'var(--reb-muted)', lineHeight: '1.6' }}>Participate in secure, encrypted elections for your class representatives and AUCASA cabinet members from anywhere.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className="pill-icon" style={{ background: 'var(--soft-blue)', minWidth: '64px', height: '64px', borderRadius: '16px' }}>
                            <Calendar color="var(--reb-blue)" size={32} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem' }}>Smart Attendance</h3>
                            <p style={{ color: 'var(--reb-muted)', lineHeight: '1.6' }}>Verify your attendance at general assemblies and special events using precise QR-based and geo-fenced technology.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className="pill-icon" style={{ background: 'var(--soft-blue)', minWidth: '64px', height: '64px', borderRadius: '16px' }}>
                            <DollarSign color="var(--reb-blue)" size={32} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem' }}>Financial Transparency</h3>
                            <p style={{ color: 'var(--reb-muted)', lineHeight: '1.6' }}>Settle student association fees, track your payment history, and download official receipts instantly.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className="pill-icon" style={{ background: 'var(--soft-blue)', minWidth: '64px', height: '64px', borderRadius: '16px' }}>
                            <Handshake color="var(--reb-blue)" size={32} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem' }}>Student Advocacy</h3>
                            <p style={{ color: 'var(--reb-muted)', lineHeight: '1.6' }}>Submit claims, issues, or suggestions directly to the Guild President's office for a swifter response.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer" style={{ padding: '60px 4rem', background: 'var(--reb-blue)', color: '#fff', textAlign: 'center' }}>
                <p>&copy; 2024 AUCASA - Digital Transformation of Student Life</p>
            </footer>
        </div>
    );
};

export default Services;
