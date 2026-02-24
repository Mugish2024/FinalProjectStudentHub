import {
    GraduationCap,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Briefcase,
    BookOpen,
    UserCheck,
} from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
    onExplore: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onExplore }) => {
    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="lp-navbar">
                <div className="lp-logo">
                    <GraduationCap size={42} strokeWidth={2.5} />
                    <div className="lp-logo-text">
                        <span className="lp-logo-main">AUCASA</span>
                        <span className="lp-logo-sub">Student Association</span>
                    </div>
                </div>

                <div className="lp-nav-links">
                    <a href="#services" className="lp-nav-link">
                        Student Services
                    </a>
                    <a href="#contact" className="lp-nav-link">
                        Contact Us
                    </a>
                    <button className="lp-apply-btn" onClick={onExplore}>
                        Access Portal
                        <ArrowRight size={18} />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="lp-hero">
                <button className="lp-slider-control lp-slider-prev">
                    <ChevronLeft size={24} />
                </button>

                <div className="lp-hero-content">
                    <h1 className="lp-hero-title">
                        ELEVATING YOUR<br />STUDENT EXPERIENCE
                    </h1>
                    <div className="lp-hero-line"></div>
                    <p className="lp-hero-description">
                        The Adventist University of Central Africa Student Association (AUCASA) is dedicated to resolving student issues and providing seamless payment management.
                    </p>
                    <div className="lp-hero-actions">
                        <button className="lp-explore-btn" onClick={onExplore}>
                            Manage My Payments
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                <button className="lp-slider-control lp-slider-next">
                    <ChevronRight size={24} />
                </button>
            </main>

            {/* Features Bar */}
            <section className="lp-features-bar">
                <div className="lp-feature-item">
                    <div className="lp-feature-icon">
                        <Calendar size={32} />
                    </div>
                    <div className="lp-feature-text">
                        <span className="lp-feature-title">Short Courses</span>
                        <span className="lp-feature-desc">Brief focused learning</span>
                    </div>
                </div>

                <div className="lp-feature-item">
                    <div className="lp-feature-icon">
                        <Briefcase size={32} />
                    </div>
                    <div className="lp-feature-text">
                        <span className="lp-feature-title">Professional Upskil...</span>
                        <span className="lp-feature-desc">Career-focused learning path</span>
                    </div>
                </div>

                <div className="lp-feature-item">
                    <div className="lp-feature-icon">
                        <BookOpen size={32} />
                    </div>
                    <div className="lp-feature-text">
                        <span className="lp-feature-title">Long Training</span>
                        <span className="lp-feature-desc">In-depth extended learning</span>
                    </div>
                </div>

                <div className="lp-feature-item">
                    <div className="lp-feature-icon">
                        <UserCheck size={32} />
                    </div>
                    <div className="lp-feature-text">
                        <span className="lp-feature-title">Train the Trainer</span>
                        <span className="lp-feature-desc">Teaching skills for instructors</span>
                    </div>
                </div>

                <div className="lp-feature-item">
                    <div className="lp-feature-icon">
                        <GraduationCap size={32} />
                    </div>
                    <div className="lp-feature-text">
                        <span className="lp-feature-title">View All Trainings</span>
                        <span className="lp-feature-desc">Explore our varied trainings</span>
                    </div>
                </div>

                <div className="lp-feature-item" onClick={onExplore} style={{ cursor: 'pointer' }}>
                    <div className="lp-feature-icon">
                        <ArrowRight size={32} />
                    </div>
                    <div className="lp-feature-text">
                        <span className="lp-feature-title">Apply Now</span>
                        <span className="lp-feature-desc">Start your application process</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
