import React from 'react';
import { ArrowRight } from 'lucide-react';
import './Landing.css';

interface LandingProps {
    onEnter: () => void;
    onNavigate: (page: string) => void;
}

const Landing: React.FC<LandingProps> = ({ onEnter, onNavigate }) => {
    return (
        <div className="landing-exact">
            <header className="landing-exact-nav">
                <div className="landing-exact-nav-inner">
                    <button type="button" className="exact-brand" onClick={() => onNavigate('landing')}>
                        <span className="brand-icon">
                            <img src="/AucaLogo.png" alt="AUCA logo" className="brand-logo" />
                        </span>
                        <span>StudentHub</span>
                    </button>

                    <nav className="exact-links">
                        <button type="button" onClick={() => onNavigate('landing')}>Home</button>
                        <button type="button" onClick={() => onNavigate('about')}>About</button>
                        <button type="button" onClick={() => onNavigate('contact')}>Contact</button>
                    </nav>

                    <div className="exact-actions">
                        <button type="button" className="btn-register" onClick={() => onNavigate('signup')}>Register</button>
                        <button type="button" className="btn-signin" onClick={onEnter}>Sign In</button>
                    </div>
                </div>
            </header>

            <main className="landing-exact-hero">
                <section className="exact-copy">
                    <div className="exact-badge">OFFICIAL PORTAL</div>
                    <h1>
                        AUCA
                        <br />
                        STUDENT
                        <br />
                        ASSOCIATION
                    </h1>
                    <div className="exact-line" />
                    <p>
                        Manage student association services in one place: pay fees, track finance
                        updates, request support, and access trusted campus tools with full
                        transparency and accountability.
                    </p>
                    <div className="exact-cta-row">
                        <button type="button" className="btn-apply" onClick={onEnter}>
                            Apply Now <ArrowRight size={16} />
                        </button>
                        <button type="button" className="btn-learn" onClick={() => onNavigate('about')}>
                            Learn More <ArrowRight size={16} />
                        </button>
                    </div>
                </section>

                <section className="exact-visual">
                    <div className="network-visual" aria-label="Network visual">
                        <svg viewBox="0 0 520 520" role="img" aria-label="Connected network">
                            <g className="net-lines">
                                <line x1="120" y1="210" x2="160" y2="186" />
                                <line x1="160" y1="186" x2="206" y2="198" />
                                <line x1="206" y1="198" x2="214" y2="240" />
                                <line x1="214" y1="240" x2="176" y2="268" />
                                <line x1="176" y1="268" x2="126" y2="252" />
                                <line x1="126" y1="252" x2="120" y2="210" />
                                <line x1="160" y1="186" x2="214" y2="240" />
                                <line x1="206" y1="198" x2="176" y2="268" />
                                <line x1="126" y1="252" x2="240" y2="180" />
                                <line x1="214" y1="240" x2="260" y2="252" />
                                <line x1="68" y1="230" x2="120" y2="190" />
                                <line x1="120" y1="190" x2="180" y2="155" />
                                <line x1="180" y1="155" x2="240" y2="180" />
                                <line x1="240" y1="180" x2="300" y2="145" />
                                <line x1="300" y1="145" x2="360" y2="185" />
                                <line x1="360" y1="185" x2="386" y2="240" />
                                <line x1="386" y1="240" x2="365" y2="304" />
                                <line x1="365" y1="304" x2="320" y2="350" />
                                <line x1="320" y1="350" x2="260" y2="374" />
                                <line x1="260" y1="374" x2="198" y2="352" />
                                <line x1="198" y1="352" x2="150" y2="300" />
                                <line x1="150" y1="300" x2="132" y2="240" />
                                <line x1="132" y1="240" x2="180" y2="155" />
                                <line x1="132" y1="240" x2="240" y2="180" />
                                <line x1="132" y1="240" x2="198" y2="352" />
                                <line x1="180" y1="155" x2="300" y2="145" />
                                <line x1="180" y1="155" x2="260" y2="252" />
                                <line x1="240" y1="180" x2="260" y2="252" />
                                <line x1="260" y1="252" x2="300" y2="145" />
                                <line x1="260" y1="252" x2="365" y2="304" />
                                <line x1="260" y1="252" x2="150" y2="300" />
                                <line x1="150" y1="300" x2="260" y2="374" />
                                <line x1="300" y1="145" x2="320" y2="350" />
                                <line x1="198" y1="352" x2="320" y2="350" />
                                <line x1="109" y1="120" x2="180" y2="155" />
                                <line x1="58" y1="340" x2="150" y2="300" />
                                <line x1="94" y1="448" x2="198" y2="352" />
                                <line x1="284" y1="70" x2="300" y2="145" />
                                <line x1="68" y1="230" x2="132" y2="240" />
                                <line x1="120" y1="190" x2="240" y2="180" />
                                <line x1="180" y1="155" x2="150" y2="300" />
                                <line x1="240" y1="180" x2="360" y2="185" />
                                <line x1="300" y1="145" x2="386" y2="240" />
                                <line x1="260" y1="252" x2="386" y2="240" />
                                <line x1="150" y1="300" x2="320" y2="350" />
                                <line x1="198" y1="352" x2="365" y2="304" />
                                <line x1="132" y1="240" x2="260" y2="374" />
                                <line x1="109" y1="120" x2="240" y2="180" />
                                <line x1="58" y1="340" x2="198" y2="352" />
                                <line x1="284" y1="70" x2="360" y2="185" />
                            </g>
                            <g className="net-nodes">
                                <circle cx="120" cy="210" r="4.6" />
                                <circle cx="160" cy="186" r="4.2" />
                                <circle cx="206" cy="198" r="4.2" />
                                <circle cx="214" cy="240" r="4.2" />
                                <circle cx="176" cy="268" r="4.2" />
                                <circle cx="126" cy="252" r="4.2" />
                                <circle cx="68" cy="230" r="6" />
                                <circle cx="120" cy="190" r="5" />
                                <circle cx="180" cy="155" r="5" />
                                <circle cx="240" cy="180" r="5" />
                                <circle cx="300" cy="145" r="5" />
                                <circle cx="360" cy="185" r="4.5" />
                                <circle cx="386" cy="240" r="5" />
                                <circle cx="365" cy="304" r="4.5" />
                                <circle cx="320" cy="350" r="4.5" />
                                <circle cx="260" cy="374" r="4.5" />
                                <circle cx="198" cy="352" r="4.5" />
                                <circle cx="150" cy="300" r="4.5" />
                                <circle cx="132" cy="240" r="4.5" />
                                <circle cx="260" cy="252" r="5" />
                                <circle cx="109" cy="120" r="5" />
                                <circle cx="58" cy="340" r="5" />
                                <circle cx="94" cy="448" r="5" />
                                <circle cx="284" cy="70" r="5" />
                            </g>
                            <g className="net-signals">
                                <circle r="5" className="signal-dot head">
                                    <animateMotion dur="6.2s" repeatCount="indefinite" path="M109 120 L180 155 L240 180 L300 145 L360 185 L386 240 L365 304 L320 350 L260 374 L198 352 L150 300 L132 240 L180 155" />
                                </circle>
                                <circle r="4" className="signal-dot body">
                                    <animateMotion dur="6.2s" begin="-0.35s" repeatCount="indefinite" path="M109 120 L180 155 L240 180 L300 145 L360 185 L386 240 L365 304 L320 350 L260 374 L198 352 L150 300 L132 240 L180 155" />
                                </circle>
                                <circle r="3.2" className="signal-dot tail">
                                    <animateMotion dur="6.2s" begin="-0.7s" repeatCount="indefinite" path="M109 120 L180 155 L240 180 L300 145 L360 185 L386 240 L365 304 L320 350 L260 374 L198 352 L150 300 L132 240 L180 155" />
                                </circle>
                                <circle r="4.6" className="signal-dot fast-head">
                                    <animateMotion dur="3.1s" repeatCount="indefinite" path="M58 340 L150 300 L198 352 L260 374 L320 350 L365 304 L386 240 L300 145 L240 180 L132 240 L150 300" />
                                </circle>
                                <circle r="3.8" className="signal-dot fast-body">
                                    <animateMotion dur="3.1s" begin="-0.22s" repeatCount="indefinite" path="M58 340 L150 300 L198 352 L260 374 L320 350 L365 304 L386 240 L300 145 L240 180 L132 240 L150 300" />
                                </circle>
                                <circle r="3" className="signal-dot fast-tail">
                                    <animateMotion dur="3.1s" begin="-0.44s" repeatCount="indefinite" path="M58 340 L150 300 L198 352 L260 374 L320 350 L365 304 L386 240 L300 145 L240 180 L132 240 L150 300" />
                                </circle>
                            </g>
                        </svg>
                        <div className="signal-message m1">Support your student association with transparency.</div>
                        <div className="signal-message m2">Track fee usage and approved budgets in real time.</div>
                        <div className="signal-message m3">One hub for payments, reports, and student services.</div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Landing;
