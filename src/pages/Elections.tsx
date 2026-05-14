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

type ElectionInfo = {
    id: number;
    title: string;
    status: 'DRAFT' | 'NOMINATION' | 'CAMPAIGN' | 'VOTING' | 'CLOSED' | 'ARCHIVED';
    votingStart?: string;
    votingEnd?: string;
    eligibleVoters?: number;
    totalVotes?: number;
};

interface ElectionsProps {
    studentNumber?: string;
    gpa?: string;
    credits?: number;
    disciplineStatus?: string;
}

const Elections: React.FC<ElectionsProps> = ({ studentNumber: loggedInStudentNumber, gpa: loggedInGpa, credits: loggedInCredits, disciplineStatus: loggedInDisciplineStatus }) => {
    const [activeSection, setActiveSection] = useState<'overview' | 'apply' | 'candidates'>('overview');
    const [studentNumber, setStudentNumber] = useState(loggedInStudentNumber ?? '');
    const [position, setPosition] = useState('');
    const [gpa, setGpa] = useState(loggedInGpa ?? '');
    const [credits, setCredits] = useState(loggedInCredits != null ? String(loggedInCredits) : '');
    const [disciplineStatus, setDisciplineStatus] = useState(loggedInDisciplineStatus ?? '');
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
    const [activeElection, setActiveElection] = useState<ElectionInfo | null>(null);
    const [isVotingOpen, setIsVotingOpen] = useState(false);
    const [votingStatusMessage, setVotingStatusMessage] = useState('No active election found.');
    const [eligibilityPopupOpen, setEligibilityPopupOpen] = useState(false);
    const [eligibilityPopupTitle, setEligibilityPopupTitle] = useState('');
    const [eligibilityPopupMessage, setEligibilityPopupMessage] = useState('');
    const [canAccessApply, setCanAccessApply] = useState(false);

    const isAdventistRequired = useMemo(() => ADVENTIST_REQUIRED.has(position), [position]);
    const eligibilityForSelectedPosition = useMemo(() => {
        const reasons: string[] = [];
        const parsedGpa = Number(gpa);
        const parsedCredits = Number(credits);
        const normalizedDiscipline = disciplineStatus.trim().toLowerCase();

        if (!position) reasons.push('Please select a position.');
        if (!gpa || Number.isNaN(parsedGpa)) {
            reasons.push('GPA is missing.');
        } else if (parsedGpa < 14) {
            reasons.push('GPA must be 14.0 or above.');
        }

        if (!credits || Number.isNaN(parsedCredits)) {
            reasons.push('Credits are missing.');
        } else if (parsedCredits < 45 || parsedCredits > 100) {
            reasons.push('Credits must be between 45 and 100.');
        }

        if (!disciplineStatus) {
            reasons.push('Discipline status is missing.');
        } else if (!(normalizedDiscipline === 'good' || normalizedDiscipline === 'satisfactory')) {
            reasons.push('Discipline status must be good or satisfactory.');
        }

        return { eligible: reasons.length === 0, reasons };
    }, [position, gpa, credits, disciplineStatus]);
    const turnoutRate = useMemo(() => {
        if (!activeElection?.eligibleVoters || activeElection.eligibleVoters <= 0) return 0;
        const total = activeElection.totalVotes ?? 0;
        return Math.min(100, Math.round((total / activeElection.eligibleVoters) * 100));
    }, [activeElection]);

    const loadApproved = async () => {
        const statusFilter = activeElection?.status ? `?electionStatus=${activeElection.status}` : '';
        const response = await fetch(`${API_BASE}/api/elections/candidates/approved${statusFilter}`);
        const data = await response.json().catch(() => []);
        setApprovedCandidates(Array.isArray(data) ? data : []);
    };

    const loadActiveElection = async () => {
        const response = await fetch(`${API_BASE}/api/elections/active`);
        if (!response.ok) {
            setActiveElection(null);
            setIsVotingOpen(false);
            setVotingStatusMessage('No active election found.');
            return;
        }
        const data = await response.json().catch(() => null);
        if (!data || typeof data !== 'object') {
            setActiveElection(null);
            setIsVotingOpen(false);
            setVotingStatusMessage('No active election found.');
            return;
        }

        const election = data as ElectionInfo;
        setActiveElection(election);

        const now = new Date();
        const start = election.votingStart ? new Date(election.votingStart) : null;
        const end = election.votingEnd ? new Date(election.votingEnd) : null;
        const inWindow = (!start || now >= start) && (!end || now <= end);
        const open = election.status === 'VOTING' && inWindow;
        setIsVotingOpen(open);

        if (open) {
            setVotingStatusMessage('Voting is open now.');
        } else if (election.status === 'VOTING' && start && now < start) {
            setVotingStatusMessage(`Voting opens at ${start.toLocaleString()}.`);
        } else if (election.status === 'VOTING' && end && now > end) {
            setVotingStatusMessage('Voting period has ended.');
        } else {
            setVotingStatusMessage(`Election is currently in ${election.status} phase.`);
        }
    };

    useEffect(() => {
        void loadActiveElection();
    }, []);

    useEffect(() => {
        void loadApproved();
    }, [activeElection?.id, activeElection?.status]);

    useEffect(() => {
        setVoterNumber(loggedInStudentNumber ?? '');
    }, [loggedInStudentNumber]);

    useEffect(() => {
        setGpa(loggedInGpa ?? '');
    }, [loggedInGpa]);

    useEffect(() => {
        setCredits(loggedInCredits != null ? String(loggedInCredits) : '');
    }, [loggedInCredits]);

    useEffect(() => {
        setDisciplineStatus(loggedInDisciplineStatus ?? '');
    }, [loggedInDisciplineStatus]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitMessage('');
        if (!eligibilityForSelectedPosition.eligible) {
            setSubmitError(`You are not eligible to apply for this position: ${eligibilityForSelectedPosition.reasons.join(' ')}`);
            return;
        }
        if (isAdventistRequired && !adventistProof) {
            setSubmitError('This position requires Adventist proof. Please upload the document to continue.');
            return;
        }
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
            setGpa(loggedInGpa ?? '');
            setCredits(loggedInCredits != null ? String(loggedInCredits) : '');
            setDisciplineStatus(loggedInDisciplineStatus ?? '');
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

    const handleSelectPositionFromOverview = (selectedPosition: string) => {
        setPosition(selectedPosition);
        setSubmitMessage('');
        setSubmitError('');

        const reasons: string[] = [];
        const parsedGpa = Number(gpa);
        const parsedCredits = Number(credits);
        const normalizedDiscipline = disciplineStatus.trim().toLowerCase();

        if (!gpa || Number.isNaN(parsedGpa)) {
            reasons.push('GPA is missing.');
        } else if (parsedGpa < 14) {
            reasons.push('GPA must be 14.0 or above.');
        }

        if (!credits || Number.isNaN(parsedCredits)) {
            reasons.push('Credits are missing.');
        } else if (parsedCredits < 45 || parsedCredits > 100) {
            reasons.push('Credits must be between 45 and 100.');
        }

        if (!disciplineStatus) {
            reasons.push('Discipline status is missing.');
        } else if (!(normalizedDiscipline === 'good' || normalizedDiscipline === 'satisfactory')) {
            reasons.push('Discipline status must be good or satisfactory.');
        }

        if (reasons.length > 0) {
            setCanAccessApply(false);
            setEligibilityPopupTitle('Not Eligible for This Position');
            setEligibilityPopupMessage(`You are not eligible to apply for ${selectedPosition} because: ${reasons.join(' ')}`);
            setEligibilityPopupOpen(true);
            return;
        }

        setCanAccessApply(true);
        setEligibilityPopupTitle('Eligibility Confirmed');
        const extraDocNote = ADVENTIST_REQUIRED.has(selectedPosition)
            ? ' This role requires Adventist proof at submission time.'
            : '';
        setEligibilityPopupMessage(`Great. You are eligible to apply for ${selectedPosition}. Please complete the form.${extraDocNote}`);
        setEligibilityPopupOpen(true);
        setActiveSection('apply');
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
            await loadActiveElection();
        } catch (err) {
            setVoteError(err instanceof Error ? err.message : 'Voting failed.');
        }
    };

    return (
        <div className="elections-page">
            <div className="elections-hero-card">
                <div className="hero-left">
                    <div className="elections-pill">OFFICIAL 2026 PROCEEDINGS</div>
                    <h1>Student Association Executive Elections</h1>
                    <p>
                        Shape the future of campus leadership. Apply to serve or cast your vote for the leaders who will
                        represent your voice in the next academic year.
                    </p>
                    <div className="elections-hero-actions">
                        <button className="vote-button" onClick={() => setActiveSection('candidates')}>
                            Cast Your Vote Now
                        </button>
                        <button className="ghost-button" onClick={() => setActiveSection('overview')}>
                            View Election Charter
                        </button>
                    </div>
                </div>
                <div className="hero-right">
                    <div className="requirements-card">
                        <div className="hero-card-title">Nomination Requirements</div>
                        <ul>
                            <li>Credits between 45 and 100</li>
                            <li>GPA 14.0 or above</li>
                            <li>Good discipline status</li>
                            <li>Adventist proof for guilds, finance, evangelism</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="elections-tabs">
                <button className={`elections-tab ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>
                    Overview
                </button>
                <button
                    className={`elections-tab ${activeSection === 'apply' ? 'active' : ''}`}
                    onClick={() => {
                        if (!canAccessApply) {
                            setEligibilityPopupTitle('Eligibility Check Required');
                            setEligibilityPopupMessage('Please select a position from Current Open Elections first. The system will check eligibility and only eligible students can access the application form.');
                            setEligibilityPopupOpen(true);
                            return;
                        }
                        setActiveSection('apply');
                    }}
                >
                    Apply
                </button>
                <button className={`elections-tab ${activeSection === 'candidates' ? 'active' : ''}`} onClick={() => setActiveSection('candidates')}>
                    Approved Candidates
                </button>
            </div>

            <div className="elections-layout">
                <div className="elections-main">
                    {activeSection === 'overview' && (
                        <div className="election-card">
                            <div className="section-head">
                                <h2 className="section-title">Current Open Elections</h2>
                                <span className="live-pill">Live Now</span>
                            </div>
                            <div className="positions-grid">
                                {POSITIONS.map((pos) => (
                                    <button
                                        type="button"
                                        key={pos}
                                        className="position-card"
                                        onClick={() => handleSelectPositionFromOverview(pos)}
                                    >
                                        <div className="position-title">{pos}</div>
                                        <div className="position-sub">Nomination open</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'apply' && (
                        <div className="election-card">
                            <div className="section-head">
                                <h2 className="section-title">Application Form</h2>
                                <span className="subtle-pill">Candidate Registration</span>
                            </div>
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

                            <form onSubmit={handleApply} className="application-container">
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

                                <button className="vote-button" type="submit" disabled={isSubmitting || !eligibilityForSelectedPosition.eligible}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeSection === 'candidates' && (
                        <div className="election-card">
                            <div className="section-head">
                                <h2 className="section-title">Current Approved Candidates</h2>
                                <span className="live-pill">{isVotingOpen ? 'Voting Open' : 'Voting Closed'}</span>
                            </div>
                            <div className="candidate-vote-bar">
                                <div className="candidate-vote-info">
                                    {votingStatusMessage} Cast one vote only. Once recorded, you cannot vote again.
                                </div>
                                <input
                                    className="custom-select"
                                    placeholder="Student number used for vote"
                                    value={voterNumber}
                                    onChange={(e) => setVoterNumber(e.target.value)}
                                    readOnly={Boolean(loggedInStudentNumber)}
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
                                            {candidate.slogan && <div className="candidate-slogan">\"{candidate.slogan}\"</div>}
                                            <button
                                                className="vote-button vote-candidate-btn"
                                                disabled={!voterNumber || hasVoted || !isVotingOpen}
                                                onClick={() => handleVote(candidate.id)}
                                            >
                                                {hasVoted ? 'Vote Submitted' : isVotingOpen ? 'Vote' : 'Voting Closed'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <aside className="elections-side">
                    <div className="side-card">
                        <h3>Election Timeline</h3>
                        <div className="timeline-step active">
                            <span>Phase 1: Nominations</span>
                            <small>Applications open</small>
                        </div>
                        <div className="timeline-step">
                            <span>Phase 2: Review</span>
                            <small>Eligibility & vetting</small>
                        </div>
                        <div className="timeline-step">
                            <span>Phase 3: Voting</span>
                            <small>Polls open electronically</small>
                        </div>
                        <div className="timeline-step">
                            <span>Phase 4: Results</span>
                            <small>Official announcement</small>
                        </div>
                    </div>
                    <div className="side-card accent">
                        <h3>Current Turnout</h3>
                        <div className="turnout-value">{activeElection?.totalVotes ?? 0}</div>
                        <div className="turnout-meta">of {activeElection?.eligibleVoters ?? 0} eligible students</div>
                        <div className="turnout-bar">
                            <span style={{ width: `${turnoutRate}%` }} />
                        </div>
                        <button className="ghost-button wide">Invite Peers to Vote</button>
                    </div>
                </aside>
            </div>

            {eligibilityPopupOpen && (
                <div className="eligibility-modal-overlay" onClick={() => setEligibilityPopupOpen(false)}>
                    <div className="eligibility-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{eligibilityPopupTitle}</h3>
                        <p>{eligibilityPopupMessage}</p>
                        <button type="button" className="vote-button" onClick={() => setEligibilityPopupOpen(false)}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Elections;
