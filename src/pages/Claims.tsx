import { useState } from 'react';
import {
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    HelpCircle,
    Info
} from 'lucide-react';
import './Claims.css';

// --- Mock Data ---

const FACULTIES = [
    'Information Technology',
    'Business Administration',
    'Theology',
    'Education'
];

interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    faculty: string;
}

const MOCK_COURSES: Course[] = [
    { id: '1', code: 'IT101', name: 'Web Programming', credits: 4, faculty: 'Information Technology' },
    { id: '2', code: 'IT102', name: 'Database Management Systems', credits: 4, faculty: 'Information Technology' },
    { id: '3', code: 'IT103', name: 'System Analysis and Design', credits: 3, faculty: 'Information Technology' },
    { id: '4', code: 'IT104', name: 'Network Security', credits: 4, faculty: 'Information Technology' },
    { id: '5', code: 'IT105', name: 'Java Programming', credits: 4, faculty: 'Information Technology' },
    { id: '6', code: 'IT201', name: 'Data Structures', credits: 3, faculty: 'Information Technology' },
    { id: '7', code: 'BUS101', name: 'Business Ethics', credits: 2, faculty: 'Business Administration' },
    { id: '8', code: 'BUS102', name: 'Marketing Principles', credits: 3, faculty: 'Business Administration' },
    { id: '9', code: 'BUS103', name: 'Financial Accounting', credits: 4, faculty: 'Business Administration' },
    { id: '10', code: 'BUS104', name: 'Strategic Management', credits: 3, faculty: 'Business Administration' },
    { id: '11', code: 'THEO101', name: 'Intro to Holy Scriptures', credits: 2, faculty: 'Theology' },
    { id: '12', code: 'THEO102', name: 'Christian Life & Service', credits: 2, faculty: 'Theology' },
];

const CLAIM_REASONS = [
    'Group Full - Request Spot Increase',
    'Timetable Clash / Overlap',
    'Prerequisite Missing Error',
    'Course Not Visible in Portal',
    'System Error / Technical Issue',
    'Other'
];

// --- Types ---

type Step = 1 | 2 | 3;

interface ClaimFormState {
    faculty: string;
    semester: string;
    selectedCourseId: string | null;
    reason: string;
    description: string;
}

const Claims = () => {
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState<ClaimFormState>({
        faculty: '',
        semester: '',
        selectedCourseId: null,
        reason: '',
        description: ''
    });

    const handleNext = () => {
        // Validation
        if (currentStep === 1) {
            if (!formData.faculty || !formData.semester) return alert('Please select both faculty and semester.');
        } else if (currentStep === 2) {
            if (!formData.selectedCourseId) return alert('Please select a course to check/claim details for.');
        }
        setCurrentStep((prev) => (prev + 1) as Step);
    };

    const handleBack = () => {
        setCurrentStep((prev) => (prev - 1) as Step);
    };

    const handleSubmit = () => {
        if (!formData.reason || !formData.description) return alert('Please fill in all details.');
        setIsSubmitted(true);
    };

    // Filter courses based on selected faculty (if any)
    const filteredCourses = formData.faculty
        ? MOCK_COURSES.filter(c => c.faculty === formData.faculty)
        : MOCK_COURSES;

    if (isSubmitted) {
        return (
            <div className="claims-page">
                <div className="claim-form-container success-view">
                    <div className="success-icon-container">
                        <CheckCircle size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Claim Submitted Successfully!</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                        Your issue has been logged with the Academic Registry. You will receive a notification once the group size has been adjusted or the issue resolved.
                    </p>

                    <div className="claim-id">REF: CLM-{Math.floor(Math.random() * 10000)}</div>

                    <button
                        className="btn-primary"
                        style={{ margin: '2rem auto 0' }}
                        onClick={() => {
                            setIsSubmitted(false);
                            setCurrentStep(1);
                            setFormData({ faculty: '', semester: '', selectedCourseId: null, reason: '', description: '' });
                        }}
                    >
                        Start New Claim
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="claims-page">
            <div className="claims-header">
                <h2>Submit a Claim / Issue</h2>
                <p>Report registration issues, request group expansions, or resolve technical errors.</p>
            </div>

            <div className="claims-layout">
                {/* Main Form Area */}
                <div className="claim-form-container">
                    {/* Progress Indicator */}
                    <div className="steps-indicator">
                        <div className={`step-bubble ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>1</div>
                        <div className={`step-bubble ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>2</div>
                        <div className={`step-bubble ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>3</div>
                    </div>

                    {/* STEP 1: Faculty & Context */}
                    {currentStep === 1 && (
                        <div className="form-step">
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Academic Context</h3>

                            <div className="form-group">
                                <label>Select Faculty</label>
                                <select
                                    className="form-select"
                                    value={formData.faculty}
                                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                >
                                    <option value="">-- Choose Faculty --</option>
                                    {FACULTIES.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Current Semester</label>
                                <select
                                    className="form-select"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                >
                                    <option value="">-- Choose Semester --</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Course Selection */}
                    {currentStep === 2 && (
                        <div className="form-step">
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Select Affected Course</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Found {filteredCourses.length} courses for {formData.faculty}. Select the one you are trying to register.
                            </p>

                            <div className="course-selection-grid">
                                {filteredCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className={`course-option-card ${formData.selectedCourseId === course.id ? 'selected' : ''}`}
                                        onClick={() => setFormData({ ...formData, selectedCourseId: course.id })}
                                    >
                                        <div className="course-check"></div>
                                        <div className="course-details">
                                            <h4>{course.name}</h4>
                                            <div className="course-meta">
                                                <span className="meta-tag">{course.code}</span>
                                                <span className="meta-tag">{course.credits} Credits</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Issue Details */}
                    {currentStep === 3 && (
                        <div className="form-step">
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Describe the Issue</h3>

                            <div className="form-group">
                                <label>Reason for Claim</label>
                                <select
                                    className="form-select"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                >
                                    <option value="">-- Select Main Reason --</option>
                                    {CLAIM_REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Detailed Description</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Please describe exactly what error you are seeing or why you need this course..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Provide as much detail as possible to speed up the resolution.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="form-actions">
                        <button
                            className="btn-secondary"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            style={{ opacity: currentStep === 1 ? 0 : 1, pointerEvents: currentStep === 1 ? 'none' : 'auto' }}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        {currentStep < 3 ? (
                            <button className="btn-primary" onClick={handleNext}>
                                Next Step <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={handleSubmit}>
                                Submit Claim <CheckCircle size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar Help */}
                <div className="claims-sidebar">
                    <div className="info-card">
                        <h3><Info size={20} color="var(--primary)" /> How it works</h3>
                        <ul className="info-list">
                            <li>Select your Faculty and Semester to filter relevant courses.</li>
                            <li>Choose the specific course you are having trouble with.</li>
                            <li>Explain the issue (e.g. "Group Full").</li>
                            <li>Admin will review and expand capacity if authorized.</li>
                        </ul>
                    </div>

                    <div className="info-card">
                        <h3><HelpCircle size={20} color="var(--primary)" /> Common Issues</h3>
                        <ul className="info-list">
                            <li><b>Group Full:</b> All slots in the primary group are taken. Request an override.</li>
                            <li><b>Prerequisites:</b> You may need a waiver if you haven't completed a prior level.</li>
                            <li><b>Portal Error:</b> Technical glitches preventing addition.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Claims;
