import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './Discipline.css';

// Define types for discipline status
type DisciplineStatus = 'unsatisfactory' | 'satisfaction' | 'grand-distinction';

interface DisciplineData {
    status: DisciplineStatus;
    score: number;
    reasons: {
        title: string;
        description: string;
        type: 'negative' | 'neutral' | 'positive';
        date: string;
    }[];
    actionPlan: string;
    tips: string[];
}

const Discipline: React.FC = () => {
    // Mock Data - In a real app, this would come from an API
    const [disciplineData] = useState<DisciplineData>({
        status: 'satisfaction',
        score: 75,
        reasons: [
            {
                title: 'Partial Attendance',
                description: 'Missed 3 morning sessions in February without valid excuse.',
                type: 'negative',
                date: 'Feb 2024'
            },
            {
                title: 'Library Books Overdue',
                description: 'Returned 2 books late, minor penalty applied.',
                type: 'neutral',
                date: 'Jan 2024'
            },
            {
                title: 'Volunteering',
                description: 'Participated in campus cleanup drive.',
                type: 'positive',
                date: 'Jan 2024'
            }
        ],
        actionPlan: 'Your conduct is generally good, but attendance issues are holding you back from Grand Distinction.',
        tips: [
            'Ensure 100% attendance next month to boost your score.',
            'Clear all library dues immediately.',
            'Participate in one more community event.'
        ]
    });

    const getStatusConfig = (status: DisciplineStatus) => {
        switch (status) {
            case 'grand-distinction':
                return {
                    label: 'Grand Distinction',
                    icon: ShieldCheck,
                    colorClass: 'status-grand-distinction',
                    description: 'Exemplary behavior. You are a role model for other students.'
                };
            case 'satisfaction':
                return {
                    label: 'Satisfaction',
                    icon: Shield,
                    colorClass: 'status-satisfaction',
                    description: 'Good behavior. Meets expectations but there is room for improvement.'
                };
            case 'unsatisfactory':
                return {
                    label: 'Unsatisfactory',
                    icon: ShieldAlert,
                    colorClass: 'status-unsatisfactory',
                    description: 'Below expectations. Immediate corrective action is required.'
                };
        }
    };

    const config = getStatusConfig(disciplineData.status);
    const StatusIcon = config.icon;
    const statusLabelClass =
        disciplineData.status === 'grand-distinction'
            ? 'status-text-grand-distinction'
            : disciplineData.status === 'satisfaction'
                ? 'status-text-satisfaction'
                : 'status-text-unsatisfactory';

    const statusIndex =
        disciplineData.status === 'unsatisfactory'
            ? 0
            : disciplineData.status === 'satisfaction'
                ? 1
                : 2;

    return (
        <div className="discipline-container">
            <header className="discipline-header">
                <h1 className="discipline-title">Discipline Record</h1>
                <p className="discipline-subtitle">Review your behavioral standing and recommendations.</p>
            </header>

            {/* Hero Status Section */}
            <section className="status-hero">
                <div className="status-badge-container">
                    <div className={`status-badge ${config.colorClass}`}>
                        <StatusIcon size={58} />
                    </div>
                </div>

                <h2 className={`status-label ${statusLabelClass}`}>
                    {config.label}
                </h2>
                <p className="status-desc">{config.description}</p>

                {/* Progress Stepper */}
                <div className="status-stepper">
                    <div className={`step-item ${statusIndex === 0 ? 'active' : ''} ${statusIndex > 0 ? 'completed' : ''}`}>
                        <div className="step-dot"></div>
                        <span className="step-label">Unsatisfactory</span>
                    </div>
                    <div className={`step-item ${statusIndex === 1 ? 'active' : ''} ${statusIndex > 1 ? 'completed' : ''}`}>
                        <div className="step-dot"></div>
                        <span className="step-label">Satisfaction</span>
                    </div>
                    <div className={`step-item ${statusIndex === 2 ? 'active' : ''}`}>
                        <div className="step-dot"></div>
                        <span className="step-label">Grand Distinction</span>
                    </div>
                </div>
            </section>

            <div className="discipline-grid">
                {/* Reason Analysis */}
                <div className="info-card">
                    <div className="card-header">
                        <Info size={24} color="#dcb14a" />
                        <h3 className="card-title">Status Analysis</h3>
                    </div>
                    <p className="card-lead">Why do I have this status?</p>

                    <div className="reason-list">
                        {disciplineData.reasons.map((reason, index) => (
                            <div key={index} className="reason-item">
                                <div className="reason-icon" style={{
                                    backgroundColor: reason.type === 'negative' ? 'rgba(248, 113, 113, 0.2)' : (reason.type === 'positive' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'),
                                    color: reason.type === 'negative' ? '#f87171' : (reason.type === 'positive' ? '#22c55e' : '#94a3b8')
                                }}>
                                    {reason.type === 'negative' ? <AlertTriangle size={18} /> : (reason.type === 'positive' ? <CheckCircle size={18} /> : <Info size={18} />)}
                                </div>
                                <div className="reason-content">
                                    <h4>{reason.title}</h4>
                                    <p>{reason.description}</p>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>{reason.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Improvement Plan */}
                <div className="info-card">
                    <div className="card-header">
                        <TrendingUp size={24} color="#22c55e" />
                        <h3 className="card-title">Path to Improvement</h3>
                    </div>

                    <div className="action-box">
                        <div className="action-title">
                            <ShieldCheck size={20} />
                            <span>Action Plan</span>
                        </div>
                        <p className="action-text">
                            {disciplineData.actionPlan}
                        </p>
                    </div>

                    <div className="tips-section">
                        <h4 className="tips-title">Steps to achieve Grand Distinction:</h4>
                        <ul className="tip-list">
                            {disciplineData.tips.map((tip, index) => (
                                <li key={index} className="tip-item">{tip}</li>
                            ))}
                        </ul>
                    </div>

                    {disciplineData.status !== 'grand-distinction' && (
                        <button className="policy-btn">
                            View Full Policy
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Discipline;
