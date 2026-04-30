import React from 'react';
import { Search } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import aboutTagIcon from '../../about tag.png';
import './About.css';

interface AboutProps {
    onBack: () => void;
}

const About: React.FC<AboutProps> = ({ onBack }) => {
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

    return (
        <div className="about-page">
            <header className="about-topbar">
                <div className="about-topbar-inner">
                    <img src={aucaLogo} alt="AUCA Logo" className="about-top-logo" />

                    <div className="about-top-actions">
                        <button type="button" className="home-btn" onClick={onBack}>Home</button>
                        <button type="button" className="search-btn" aria-label="Search">
                            <Search size={31} />
                        </button>
                        <button type="button" className="login-btn" onClick={onBack}>Log in</button>
                    </div>
                </div>
            </header>

            <main className="about-content">
                <section className="about-layout">
                    <aside className="about-intro">
                        <h1>
                            Why AUCA student
                            <br />
                            hub is better?
                        </h1>
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
            </main>
        </div>
    );
};

export default About;
