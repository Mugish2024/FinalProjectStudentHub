import React from 'react';
import { Search, Check, Upload, ArrowRight } from 'lucide-react';
import './RegistrationVerification.css';

const RegistrationVerification: React.FC = () => {
    return (
        <div className="registration-container">
            <h1 className="page-title">STUDENT REGISTRATION & VERIFICATION</h1>

            <div className="registration-grid">
                {/* Left Column */}
                <div className="left-column">

                    {/* Student Search Section */}
                    <section className="section-block">
                        <h3 className="section-title">STUDENT SEARCH</h3>
                        <div className="search-row">
                            <div className="search-input-wrapper">
                                <Search size={18} className="search-icon" />
                                <input type="text" placeholder="Enter Student ID or Name" className="search-input" />
                            </div>
                            <button className="btn-gold">Search</button>
                        </div>

                        <div className="filters-box">
                            <div className="filter-group">
                                <label>Campus</label>
                                <select><option>Masoro</option></select>
                                <div className="tag">Nursing</div>
                            </div>
                            <div className="filter-group">
                                <label>Faculty</label>
                                <div className="tags-row">
                                    <span className="tag">Business</span>
                                    <span className="tag">Nursing</span>
                                    <span className="tag">Education, IT</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Student Information Section */}
                    <section className="section-block info-card-container">
                        <h3 className="section-title">STUDENT INFORMATION</h3>
                        <div className="info-card">
                            <div className="info-main">
                                <div className="profile-large">
                                    <div className="avatar-placeholder"></div>
                                </div>
                                <div className="info-details">
                                    <div className="info-row"><strong>Name:</strong> John Doe</div>
                                    <div className="info-row"><strong>ID:</strong> AUCA/UG/123/020</div>
                                    <div className="info-row"><strong>Faculty:</strong> Theology</div>
                                    <div className="info-row"><strong>Campus:</strong> Masoro</div>
                                </div>
                            </div>

                            <div className="status-row">
                                <div className="status-pill success">
                                    <div className="check-circle"><Check size={12} /></div>
                                    <span>Registered</span>
                                </div>
                                <div className="status-pill success-dark">
                                    <span>AUCASA Fee: Paid (3,000 RWF)</span>
                                    <div className="check-circle"><Check size={12} /></div>
                                </div>
                            </div>

                            <div className="academic-info">
                                <div>Academic Year: 2023/2024</div>
                                <div>Semester: Harmattan</div>
                            </div>
                        </div>
                    </section>

                    {/* Registration Confirmation */}
                    <section className="section-block confirmation-block">
                        <div className="alert-gold">
                            <strong>REGISTRATION CONFIRMATION</strong>
                            <p>Your registration is complete!</p>
                            <div className="check-circle-large"><Check size={24} /></div>
                        </div>

                        <div className="terms-container">
                            <div className="terms-text">
                                I agree to the Terms & Conditions
                                <br /><span className="text-muted">Academic Rules</span>
                                <br /><span className="text-muted">Accept Year Receipt</span>
                            </div>

                            <div className="action-row">
                                <label className="checkbox-wrapper">
                                    <input type="checkbox" checked readOnly />
                                    <span>I agree to the Terms & Conditions</span>
                                </label>
                                <button className="btn-gold">Complete Registration</button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div className="right-column">

                    {/* Verification Process */}
                    <section className="section-block">
                        <h3 className="section-title">VERIFICATION PROCESS VISUALIZATION</h3>
                        <div className="flowchart-container">
                            <div className="flow-step">
                                <div className="step-number">1</div>
                                <span>Student ID Verification</span>
                            </div>
                            <div className="flow-arrow"><ArrowRight size={20} /></div>
                            <div className="flow-step status-check">
                                <div className="check-gold"><Check size={16} /></div>
                            </div>
                            <div className="flow-arrow"><ArrowRight size={20} /></div>
                            <div className="flow-step">
                                <div className="step-number">3</div>
                                <span>Registration Completion</span>
                            </div>

                            {/* Second Row mockup */}
                            <div className="flow-row-2">
                                <div className="flow-step">
                                    <div className="step-number">2</div>
                                    <span>AUCASA Fee Payment Confirmation</span>
                                </div>
                                <div className="flow-arrow"><ArrowRight size={20} /></div>
                                <div className="flow-step">
                                    <span>Registration Completion</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Payment Verification */}
                    <section className="section-block">
                        <h3 className="section-title">PAYMENT VERIFICATION</h3>
                        <div className="payment-card">
                            <div className="payment-form">
                                <div className="form-group">
                                    <label>Date: 2023-09-01</label>
                                </div>
                                <div className="receipt-info">
                                    <p>Receipt No: PMT-2023-001</p>
                                    <p>Amount: 3,000 RWF</p>
                                    <div className="status-success-icon"><Check size={16} /></div>
                                </div>

                                <div className="payment-actions">
                                    <button className="btn-dark-icon">
                                        <Upload size={16} /> Upload Payment Receipt
                                    </button>
                                    <button className="btn-gold">Verify Payment</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* System Integration Visualization */}
                    <section className="section-block">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="section-title">SYSTEM INTEGRATION VISUALIZATION</h3>
                        </div>
                        <div className="system-tree">
                            <div className="tree-node root">AUCASA-DMS</div>
                            <div className="tree-lines">
                                <div className="tree-node child">Student Data Sync</div>
                                <div className="tree-node child">Status Updates Verification Status</div>
                            </div>
                            <div className="tree-node root bottom">Registrar's Database</div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default RegistrationVerification;
