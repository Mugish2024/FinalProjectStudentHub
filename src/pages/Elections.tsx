import { useEffect, useMemo, useState } from 'react';
import './Elections.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

const POSITIONS = [
    'AUCASA GUILD PRESIDENT',
    'AUCASA GUILD PRESIDENT MASORO CAMPUS',
    'AUCASA GUILD PRESIDENT GISHUSHU CAMPUS',
    'AUCASA GUILD PRESIDENT NURSING AND MIDWIFERY',
    'AUCASA PRESIDENT OF FINANCE',
    'AUCASA MINISTER OF EVANGELISM',
    'AUCASA MINISTER OF SPORT',
    'AUCASA MINISTER OF INTERNATIONAL STUDENT AND AFFAIRS',
];

const ADVENTIST_REQUIRED = new Set([
    'AUCASA GUILD PRESIDENT',
    'AUCASA GUILD PRESIDENT MASORO CAMPUS',
    'AUCASA GUILD PRESIDENT GISHUSHU CAMPUS',
    'AUCASA GUILD PRESIDENT NURSING AND MIDWIFERY',
    'AUCASA PRESIDENT OF FINANCE',
    'AUCASA MINISTER OF EVANGELISM',
]);

type Candidate = {
    id: number;
    studentName: string;
    studentNumber: string;
    position: string;
    slogan?: string;
    manifesto?: string;
    gpa?: string;
    credits?: number;
    disciplineStatus?: string;
    professionalPhotoUrl?: string;
};

interface ElectionsProps {
    studentNumber?: string;
}

const Elections: React.FC<ElectionsProps> = ({ studentNumber: loggedInStudentNumber }) => {
    const [activeSection, setActiveSection] = useState<'overview' | 'apply' | 'candidates'>('overview');
    const [studentNumber, setStudentNumber] = useState(loggedInStudentNumber ?? '');
    const [position, setPosition] = useState('');
    const [gpa, setGpa] = useState('');
    const [credits, setCredits] = useState('');
    const [disciplineStatus, setDisciplineStatus] = useState('');
    const [slogan, setSlogan] = useState('');
    const [manifesto, setManifesto] = useState('');
    const [adventistProof, setAdventistProof] = useState<File | null>(null);
    const [transcript, setTranscript] = useState<File | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [certificates, setCertificates] = useState<File | null>(null);
    const [submitMessage, setSubmitMessage] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approvedCandidates, setApprovedCandidates] = useState<Candidate[]>([]);
    const [voterNumber, setVoterNumber] = useState(loggedInStudentNumber ?? '');
    const [voteMessage, setVoteMessage] = useState('');
    const [voteError, setVoteError] = useState('');
    const [hasVoted, setHasVoted] = useState(false);

    const isAdventistRequired = useMemo(() => ADVENTIST_REQUIRED.has(position), [position]);

    const loadApproved = async () => {
        const response = await fetch(`${API_BASE}/api/elections/candidates/approved`);
        const data = await response.json().catch(() => []);
        setApprovedCandidates(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadApproved();
    }, []);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitMessage('');
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('studentNumber', studentNumber);
            formData.append('position', position);
            formData.append('gpa', gpa);
            formData.append('credits', credits);
            formData.append('disciplineStatus', disciplineStatus);
            if (slogan) formData.append('slogan', slogan);
            if (manifesto) formData.append('manifesto', manifesto);
            if (adventistProof) formData.append('adventistProof', adventistProof);
            if (transcript) formData.append('transcript', transcript);
            if (photo) formData.append('professionalPhoto', photo);
            if (certificates) formData.append('certificates', certificates);

            const response = await fetch(`${API_BASE}/api/elections/candidates/apply`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Application failed.');
            }

            setSubmitMessage('Application submitted. Awaiting approval.');
            setStudentNumber('');
            setPosition('');
            setGpa('');
            setCredits('');
            setDisciplineStatus('');
            setSlogan('');
            setManifesto('');
            setAdventistProof(null);
            setTranscript(null);
            setPhoto(null);
            setCertificates(null);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Application failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (candidateId: number) => {
        setVoteError('');
        setVoteMessage('');
        try {
            const response = await fetch(`${API_BASE}/api/elections/votes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber: voterNumber,
                    candidateId,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Voting failed.');
            }
            setVoteMessage('Vote recorded successfully.');
            setHasVoted(true);
        } catch (err) {
            setVoteError(err instanceof Error ? err.message : 'Voting failed.');
        }
    };

    return (
        <div className="elections-container">
            <div className="elections-hero">
                <div className="elections-hero-text">
                    <div className="elections-pill">AUCASA Elections 2026</div>
                    <h1>Lead With Purpose</h1>
                    <p>
                        Apply to represent your fellow students, or explore approved candidates in the official AUCASA elections.
                    </p>
                    <div className="elections-hero-actions">
                        <button className="vote-button" onClick={() => setActiveSection('apply')}>
                            Apply Now
                        </button>
                        <button className="ghost-button" onClick={() => setActiveSection('candidates')}>
                            View Candidates
                        </button>
                    </div>
                </div>
                <div className="elections-hero-card">
                    <div className="hero-card-title">Nomination Requirements</div>
                    <ul>
                        <li>Credits between 45 and 100</li>
                        <li>GPA 14.0 or above</li>
                        <li>Good discipline status</li>
                        <li>Adventist proof for guilds, finance, evangelism</li>
                    </ul>
                </div>
            </div>

            <div className="elections-tabs">
                <button className={`elections-tab ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>
                    Overview
                </button>
                <button className={`elections-tab ${activeSection === 'apply' ? 'active' : ''}`} onClick={() => setActiveSection('apply')}>
                    Apply
                </button>
                <button className={`elections-tab ${activeSection === 'candidates' ? 'active' : ''}`} onClick={() => setActiveSection('candidates')}>
                    Approved Candidates
                </button>
            </div>

            {activeSection === 'overview' && (
                <div className="election-card">
                    <h2 className="section-title">Positions Available</h2>
                    <div className="positions-grid">
                        {POSITIONS.map((pos) => (
                            <div key={pos} className="position-card">
                                <div className="position-title">{pos}</div>
                                <div className="position-sub">Nomination open</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSection === 'apply' && (
                <div className="election-card">
                    <h2 className="section-title">Application Form</h2>
                    <p className="election-description">
                        Submit your candidacy for the positions below. Applications are reviewed by the dean before appearing publicly.
                    </p>

                    <div className="election-details-grid">
                        <div className="detail-row">
                            <span className="detail-label">Requirements:</span>
                            <span>Adventist proof (required for guilds, finance, evangelism), credits 45-100, GPA 14+, good discipline.</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Documents:</span>
                            <span>Professional photo, certificates, transcript, discipline status.</span>
                        </div>
                    </div>

                    {submitError && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {submitError}
                        </div>
                    )}
                    {submitMessage && (
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {submitMessage}
                        </div>
                    )}

                    <form onSubmit={handleApply} className="application-container" style={{ maxWidth: '920px' }}>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Student Number</label>
                                <input
                                    className="custom-select"
                                    placeholder="AUCA/UG/001/26"
                                    value={studentNumber}
                                    onChange={(e) => setStudentNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Position</label>
                                <select
                                    className="custom-select"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    required
                                >
                                    <option value="">Select Position</option>
                                    {POSITIONS.map((pos) => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                                {position && (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        Adventist proof: {isAdventistRequired ? 'Required' : 'Optional'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label>GPA (Average)</label>
                                <input
                                    className="custom-select"
                                    type="number"
                                    step="0.01"
                                    value={gpa}
                                    onChange={(e) => setGpa(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Credits</label>
                                <input
                                    className="custom-select"
                                    type="number"
                                    value={credits}
                                    onChange={(e) => setCredits(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Discipline Status</label>
                                <select
                                    className="custom-select"
                                    value={disciplineStatus}
                                    onChange={(e) => setDisciplineStatus(e.target.value)}
                                    required
                                >
                                    <option value="">Select Status</option>
                                    <option value="Good">Good</option>
                                    <option value="Satisfactory">Satisfactory</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label>Slogan</label>
                                <input
                                    className="custom-select"
                                    value={slogan}
                                    onChange={(e) => setSlogan(e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label>Manifesto</label>
                                <textarea
                                    className="log-textarea"
                                    rows={4}
                                    value={manifesto}
                                    onChange={(e) => setManifesto(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label>Adventist Proof (Certificate)</label>
                                <input type="file" className="custom-select" onChange={(e) => setAdventistProof(e.target.files?.[0] ?? null)} />
                            </div>
                            <div className="form-field">
                                <label>Transcript</label>
                                <input type="file" className="custom-select" onChange={(e) => setTranscript(e.target.files?.[0] ?? null)} required />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label>Professional Photo</label>
                                <input type="file" className="custom-select" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} required />
                            </div>
                            <div className="form-field">
                                <label>Certificates</label>
                                <input type="file" className="custom-select" onChange={(e) => setCertificates(e.target.files?.[0] ?? null)} required />
                            </div>
                        </div>

                        <button className="vote-button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            )}

            {activeSection === 'candidates' && (
                <div className="election-card">
                    <h2 className="section-title">Approved Candidates</h2>
                    <div className="candidate-vote-bar">
                        <div className="candidate-vote-info">
                            Cast one vote only. Once recorded, you cannot vote again.
                        </div>
                        <input
                            className="custom-select"
                            placeholder="Enter your student number to vote"
                            value={voterNumber}
                            onChange={(e) => setVoterNumber(e.target.value)}
                        />
                    </div>
                    {voteError && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {voteError}
                        </div>
                    )}
                    {voteMessage && (
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            {voteMessage}
                        </div>
                    )}
                    {approvedCandidates.length === 0 ? (
                        <p className="election-description">No approved candidates yet.</p>
                    ) : (
                        <div className="candidates-grid">
                            {approvedCandidates.map((candidate) => (
                                <div key={candidate.id} className="candidate-card">
                                    <div className="candidate-photo">
                                        {candidate.professionalPhotoUrl ? (
                                            <img src={`${API_BASE}${candidate.professionalPhotoUrl}`} alt={candidate.studentName} />
                                        ) : (
                                            <div className="candidate-photo-placeholder">{candidate.studentName.slice(0, 1)}</div>
                                        )}
                                    </div>
                                    <div className="candidate-name">{candidate.studentName}</div>
                                    <div className="candidate-position">{candidate.position}</div>
                                    <div className="candidate-meta">GPA {candidate.gpa} - Credits {candidate.credits}</div>
                                    {candidate.slogan && <div className="candidate-slogan">"{candidate.slogan}"</div>}
                                    <button
                                        className="vote-button vote-candidate-btn"
                                        disabled={!voterNumber || hasVoted}
                                        onClick={() => handleVote(candidate.id)}
                                    >
                                        {hasVoted ? 'Vote Submitted' : 'Vote'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Elections;
