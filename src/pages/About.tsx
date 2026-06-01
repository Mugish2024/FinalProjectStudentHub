import React from 'react';
import aucaLogo from '../assets/auca-logo.png';
import aboutTagIcon from '../../about tag.png';
import './About.css';

interface AboutProps {
    onBack: () => void;
    onNavigate?: (page: string) => void;
    onEnter?: () => void;
    topic?: string | null;
}

const About: React.FC<AboutProps> = ({ onBack, onNavigate, onEnter, topic }) => {
    const navItems = [
        { label: 'Home', page: 'landing' },
        { label: 'About', page: 'about' },
        { label: 'Contact', page: 'contact' },
    ];

    const handleNavigate = (page: string) => {
        if (page === 'landing') {
            onBack();
            return;
        }
        onNavigate?.(page);
    };

    const cards = [
        {
            title: 'Trusted content',
            description:
                'Official AUCA Student Association updates, policies, and guides are published in one trusted place for all students.',
        },
        {
            title: 'Personalized learning',
            description:
                'Students can access services based on their needs, follow announcements, and interact with campus support from a single dashboard.',
        },
        {
            title: 'Progress tracking',
            description:
                'Attendance, service requests, and student activities are tracked clearly so progress and engagement stay transparent.',
        },
        {
            title: 'Online library',
            description:
                'The platform connects students to digital resources including books, guides, notices, and academic support materials.',
        },
    ];

    const topicDetails: Record<string, { label: string; title: string; body: string; highlight: string }> = {
        payments: {
            label: 'Payments',
            title: 'Student association fees, made simple',
            body:
                'From payment initiation to receipt validation, every stage is transparent, timestamped, and easy to follow for both students and finance teams.',
            highlight:
                'Students can pay with confidence, keep their receipt history organized, and spend less time asking where their payment stands.',
        },
        attendance: {
            label: 'Attendance',
            title: 'Fast check-ins for active campus life',
            body:
                'Attendance tools help students join sessions quickly, confirm participation, and stay connected to association activities without long manual sign-in queues.',
            highlight:
                'Every check-in becomes part of a clear record, helping students prove engagement and helping leaders understand participation better.',
        },
        services: {
            label: 'Student Services',
            title: 'Support that follows the student journey',
            body:
                'Student services bring requests, updates, registration support, and issue tracking into one place so students know what to do next.',
            highlight:
                'The goal is simple: fewer delays, clearer communication, and a smoother campus experience from the first request to the final response.',
        },
    };

    const selectedDetail = topic ? topicDetails[topic] : null;

    return (
        <div className="about-page">
            <header className="about-topbar">
                <div className="about-topbar-inner">
                    <button type="button" className="about-brand" onClick={onBack}>
                        <span className="about-brand-icon">
                            <img src={aucaLogo} alt="AUCA Logo" className="about-brand-logo" />
                        </span>
                        <span className="about-brand-text">
                            <small>Adventist University of Central Africa</small>
                        </span>
                    </button>

                    <nav className="about-nav-links" aria-label="Primary navigation">
                        {navItems.map((item) => (
                            <button
                                type="button"
                                key={item.page}
                                className={item.page === 'about' ? 'active' : ''}
                                onClick={() => handleNavigate(item.page)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="about-top-actions">
                        <button type="button" className="about-signin-btn" onClick={onEnter ?? onBack}>Sign In</button>
                    </div>
                </div>
            </header>

            <main className="about-content">
                <section className="about-layout">
                    <aside className="about-intro">
                        <div className="about-kicker">ABOUT STUDENTHUB</div>
                        <h1>
                            AUCA StudentHub
                            <br />
                            keeps services clear
                        </h1>
                        <p>
                            StudentHub brings payments, attendance, support, and campus updates into one trusted place for AUCA students.
                        </p>
                    </aside>

                    <section className="about-cards-grid">
                        {cards.map((card) => (
                            <article key={card.title} className="about-info-card">
                                <div className="about-card-icon" aria-hidden>
                                    <img src={aboutTagIcon} alt="" className="about-card-icon-img" />
                                </div>
                                <div className="about-card-copy">
                                    <h3>{card.title}</h3>
                                    <p>{card.description}</p>
                                </div>
                            </article>
                        ))}
                    </section>
                </section>
                {selectedDetail && (
                    <section className="about-detail-section" aria-label={`${selectedDetail.label} details`}>
                        <article className="about-detail-card">
                            <span className="about-detail-label">{selectedDetail.label}</span>
                            <h2>{selectedDetail.title}</h2>
                            <p>{selectedDetail.body}</p>
                            <p>{selectedDetail.highlight}</p>
                        </article>
                    </section>
                )}
            </main>
        </div>
    );
};

export default About;
