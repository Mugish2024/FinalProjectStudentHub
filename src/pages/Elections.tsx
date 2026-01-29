import React from 'react';
import './Elections.css';

const Elections: React.FC = () => {
    return (
        <div className="elections-container">
            {/* Page Header (Matching the screenshot's top left text, though it might be global) */}
            <div className="elections-header-text">
                AUCASA-DMS ELECTIONS <span className="sub-id">#OA24-DMS</span>
            </div>

            {/* Current Elections Section */}
            <div className="election-card">
                <h2 className="section-title" style={{ color: '#0f172a', marginBottom: '1.5rem' }}>
                    CURRENT & UPCOMING ELECTIONS
                </h2>

                <div className="election-main-info">
                    <h3 className="election-title">AUCASA GENERAL ELECTION 2024</h3>
                    <p className="election-description">
                        Vote for your next AUCASA President, Guild President, and Ministers
                    </p>
                </div>

                <div className="election-details-grid">
                    <div className="detail-row">
                        <span className="detail-label">Nomination Period:</span>
                        <span>Feb 1 - Feb 15</span>
                    </div>
                    <div className="detail-row" style={{ borderBottom: '2px solid #dcb14a', paddingBottom: '0.25rem', width: 'fit-content' }}>
                        <span className="detail-label">Campaign Period:</span>
                        <span>Feb 16 - Mar 1</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Voting Day:</span>
                        <span>Mar 2</span>
                    </div>
                    
                    <div className="stats-row">
                        <div className="detail-row">
                            <span className="detail-label">Eligible Voters:</span>
                            <span className="stats-highlight">1500</span>
                        </div>
                        <div className="detail-row">
                            <span className="stats-highlight">65%</span>
                            <span>(975 voted)</span>
                        </div>
                    </div>
                </div>

                <div className="countdown-section">
                    <div>
                        <span className="countdown-label">Voting closes in:</span>
                        <div className="countdown-timer">2 Days, 14 Hours, 32 Minutes</div>
                    </div>
                    <button className="vote-button">
                        VOTE NOW!
                    </button>
                </div>
            </div>

            {/* Past Elections Section */}
            <div className="past-elections-card" style={{ maxWidth: '400px' }}>
                <h2 className="section-title" style={{ color: '#0f172a' }}>PAST ELECTIONS</h2>
                <a href="#" className="view-all-link">View All Historical Elections</a>
            </div>
        </div>
    );
};

export default Elections;
