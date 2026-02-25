import React, { useState } from 'react';
import { Upload, Clock, DollarSign, Calendar, FileText, Check } from 'lucide-react';
import './StudentLabour.css';

const StudentLabour: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'apply' | 'daily-log' | 'tracking'>('apply');

    // Mock student data for eligibility check
    const studentStats = {
        semester: 4,
        gpa: 15.5,
        discipline: 'Satisfactory'
    };

    const isEligible = studentStats.semester >= 3 && studentStats.gpa >= 14 && studentStats.discipline === 'Satisfactory';

    return (
        <div className="student-labour">
            <div className="labour-header">
                <h1>Student Labour Portal</h1>
                <p>Campus employment opportunities and service management.</p>
            </div>

            <div className="labour-tabs">
                <button
                    className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
                    onClick={() => setActiveTab('apply')}
                >
                    Application
                </button>
                <button
                    className={`tab-btn ${activeTab === 'daily-log' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily-log')}
                >
                    Daily Log
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tracking')}
                >
                    My Activity
                </button>
            </div>

            {activeTab === 'apply' && (
                <div className="fade-in">
                    <section className="eligibility-check">
                        <h3>Eligibility Verification</h3>
                        <div className="eligibility-row">
                            <span className="check-label">Semester Requirements</span>
                            <span className="check-status">
                                {studentStats.semester}th Semester <Check size={16} />
                            </span>
                        </div>
                        <div className="eligibility-row">
                            <span className="check-label">Academic Threshold (Min 14/20)</span>
                            <span className="check-status">
                                {studentStats.gpa}/20 <Check size={16} />
                            </span>
                        </div>
                        <div className="eligibility-row">
                            <span className="check-label">Disciplinary Standing</span>
                            <span className="check-status">
                                {studentStats.discipline} <Check size={16} />
                            </span>
                        </div>
                    </section>

                    {isEligible && (
                        <div className="application-container">
                            <div className="form-field">
                                <label>Target Department</label>
                                <select className="custom-select">
                                    <option>Select a department...</option>
                                    <option>Academic Library</option>
                                    <option>Student IT Services</option>
                                    <option>Campus Maintenance</option>
                                    <option>Administrative Support</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Cover Letter</label>
                                <div className="upload-area">
                                    <FileText size={24} color="#94a3b8" />
                                    <span>Upload cover letter (PDF)</span>
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Official Transcript</label>
                                <div className="upload-area">
                                    <Upload size={24} color="#94a3b8" />
                                    <span>Upload latest transcript (PDF)</span>
                                </div>
                            </div>

                            <button className="primary-action-btn">Submit Application</button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'daily-log' && (
                <div className="fade-in">
                    <div className="log-entry-card">
                        <div className="daily-grid">
                            <div className="form-field">
                                <label>Log Date</label>
                                <input type="date" className="custom-select" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="form-field">
                                <label>Hours Worked</label>
                                <input type="number" step="0.5" className="custom-select" placeholder="Ex: 4.5" />
                            </div>
                        </div>
                        <div className="form-field">
                            <label>Description of Activities</label>
                            <textarea
                                className="log-textarea"
                                rows={4}
                                placeholder="Detail what you accomplished today..."
                            ></textarea>
                        </div>
                        <button className="primary-action-btn" style={{ background: '#CF6218' }}>Record Daily Entry</button>
                    </div>

                    <div className="activity-history">
                        <h3 className="section-title">Recent Logs</h3>
                        <div className="history-item">
                            <div className="item-main">
                                <span className="item-date">Monday, Feb 23</span>
                                <span className="item-meta">Library • 4 Hours • Cataloging new intake</span>
                            </div>
                            <span className="status-indicator">PENDING REVIEW</span>
                        </div>
                        <div className="history-item">
                            <div className="item-main">
                                <span className="item-date">Friday, Feb 20</span>
                                <span className="item-meta">Library • 6 Hours • Inventory management</span>
                            </div>
                            <span className="status-indicator">VERIFIED</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tracking' && (
                <div className="fade-in">
                    <div className="stats-summary">
                        <div className="stat-block">
                            <span className="stat-label">Total Hours</span>
                            <span className="stat-num">82.5 <Clock size={20} style={{ verticalAlign: 'middle', opacity: 0.5 }} /></span>
                        </div>
                        <div className="stat-block">
                            <span className="stat-label">Total Earnings</span>
                            <span className="stat-num">24,750 <span style={{ fontSize: '1rem', fontWeight: 600 }}>RWF</span></span>
                        </div>
                    </div>

                    <div className="info-box" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                            <DollarSign size={14} style={{ verticalAlign: 'middle' }} /> Student labour rate is fixed at <strong>300 RWF</strong> per hour.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLabour;
