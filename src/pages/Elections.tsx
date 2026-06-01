import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Upload } from 'lucide-react';
import './Elections.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

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
    showVoteProgress?: boolean;
};

type VoteTrendItem = {
    candidateId: number;
    candidateName: string;
    studentNumber: string;
    position: string;
    votes: number;
    percentage: number;
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
    const [applicationStep, setApplicationStep] = useState(0);
    const [showApplicationWarnings, setShowApplicationWarnings] = useState(false);
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
    const [inviteMessage, setInviteMessage] = useState('');
    const [voteTrends, setVoteTrends] = useState<VoteTrendItem[]>([]);
    const [voteTrendError, setVoteTrendError] = useState('');

    const currentElectionStatus = activeElection?.status ?? 'NOMINATION';
    const isNominationPhase = currentElectionStatus === 'NOMINATION' || currentElectionStatus === 'DRAFT';
    const isApprovedCandidatePhase = ['CAMPAIGN', 'VOTING', 'CLOSED', 'ARCHIVED'].includes(currentElectionStatus);
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
    const stepWarnings = useMemo(() => {
        const warnings: Record<number, string[]> = {
            0: [],
            1: [],
            2: [],
        };

        if (!studentNumber.trim()) warnings[0].push('Student number is required.');
        if (!position) warnings[0].push('Position is required.');
        if (!gpa || Number.isNaN(Number(gpa))) warnings[0].push('GPA is required.');
        if (!credits || Number.isNaN(Number(credits))) warnings[0].push('Credits are required.');
        if (!disciplineStatus) warnings[0].push('Discipline status is required.');
        if (!slogan.trim()) warnings[1].push('Campaign slogan is required.');
        if (!manifesto.trim()) warnings[1].push('Manifesto is required.');
        if (isAdventistRequired && !adventistProof) warnings[2].push('Adventist proof is required.');
        if (!transcript) warnings[2].push('Transcript is required.');
        if (!photo) warnings[2].push('Professional photo is required.');
        if (!certificates) warnings[2].push('Certificates are required.');

        return warnings;
    }, [adventistProof, certificates, credits, disciplineStatus, gpa, isAdventistRequired, manifesto, photo, position, slogan, studentNumber, transcript]);
    const timelinePhases = useMemo(() => {
        const status = activeElection?.status ?? 'NOMINATION';
        const activeIndex =
            status === 'VOTING' ? 2 :
                status === 'CLOSED' || status === 'ARCHIVED' ? 3 :
                    status === 'CAMPAIGN' ? 1 :
                        0;

        return [
            { title: 'Nominations', detail: 'Applications open' },
            { title: 'Review', detail: 'Eligibility and vetting' },
            { title: 'Voting', detail: 'Electronic polls open' },
            { title: 'Results', detail: 'Final announcement' },
        ].map((phase, index) => ({
            ...phase,
            state: index < activeIndex ? 'completed' : index === activeIndex ? 'active' : 'upcoming',
        }));
    }, [activeElection?.status]);
    const voteProgressVisible = Boolean(activeElection?.showVoteProgress);
    const highestCandidateVotes = useMemo(
        () => voteTrends.reduce((max, item) => Math.max(max, Number(item.votes ?? 0)), 0),
        [voteTrends]
    );

    const liveVoteRows = useMemo<VoteTrendItem[]>(() => {
        if (voteTrends.length > 0) return voteTrends;
        return approvedCandidates.map((candidate) => ({
            candidateId: candidate.id,
            candidateName: candidate.studentName,
            studentNumber: candidate.studentNumber,
            position: candidate.position,
            votes: 0,
            percentage: 0,
        }));
    }, [approvedCandidates, voteTrends]);

    const voteProgressByPosition = useMemo(() => {
        const groups = new Map<string, VoteTrendItem[]>();
        liveVoteRows.forEach((item) => {
            const key = item.position || 'General Ballot';
            groups.set(key, [...(groups.get(key) ?? []), item]);
        });
        return Array.from(groups.entries()).map(([positionName, items]) => ({
            positionName,
            items: items.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)),
        }));
    }, [liveVoteRows]);

    const loadApproved = async () => {
        const fetchApproved = async (query: string) => {
            const response = await fetch(`${API_BASE}/api/elections/candidates/approved${query}`);
            const data = await response.json().catch(() => []);
            return response.ok && Array.isArray(data) ? (data as Candidate[]) : [];
        };

        const byElection = activeElection?.id
            ? await fetchApproved(`?electionId=${activeElection.id}`)
            : [];
        if (byElection.length > 0) {
            setApprovedCandidates(byElection);
            return;
        }

        const byStatus = activeElection?.status
            ? await fetchApproved(`?electionStatus=${activeElection.status}`)
            : [];
        if (byStatus.length > 0) {
            setApprovedCandidates(byStatus);
            return;
        }

        setApprovedCandidates(await fetchApproved(''));
    };

    const loadVoteTrends = async (electionId: number) => {
        setVoteTrendError('');
        try {
            const response = await fetch(`${API_BASE}/api/elections/${electionId}/vote-trends`);
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error('Live voting progress is unavailable.');
            }
            setVoteTrends(Array.isArray(data) ? data : []);
        } catch (err) {
            setVoteTrends([]);
            setVoteTrendError(err instanceof Error ? err.message : 'Live voting progress is unavailable.');
        }
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
        if (!activeElection?.id || !activeElection.showVoteProgress) {
            setVoteTrends([]);
            setVoteTrendError('');
            return;
        }

        void loadVoteTrends(activeElection.id);
        const timer = window.setInterval(() => {
            void loadVoteTrends(activeElection.id);
            void loadActiveElection();
        }, 6000);

        return () => window.clearInterval(timer);
    }, [activeElection?.id, activeElection?.showVoteProgress]);

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

    useEffect(() => {
        if (isApprovedCandidatePhase && activeSection !== 'candidates') {
            setActiveSection('candidates');
        } else if (isNominationPhase && activeSection === 'candidates') {
            setActiveSection('overview');
        }
    }, [activeSection, isApprovedCandidatePhase, isNominationPhase]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitMessage('');
        if (!eligibilityForSelectedPosition.eligible) {
            setSubmitError(`You are not eligible to apply for this position: ${eligibilityForSelectedPosition.reasons.join(' ')}`);
            return;
        }
        const allWarnings = Object.values(stepWarnings).flat();
        if (allWarnings.length > 0) {
            setShowApplicationWarnings(true);
            const firstInvalidStep = Number(Object.entries(stepWarnings).find(([, warnings]) => warnings.length > 0)?.[0] ?? 0);
            setApplicationStep(firstInvalidStep);
            setSubmitError('Please complete all required application fields before submitting.');
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
            setApplicationStep(0);
            setShowApplicationWarnings(false);
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
        setApplicationStep(0);
        setShowApplicationWarnings(false);
        setActiveSection('apply');
    };

    const hasStepWarning = (step: number) => showApplicationWarnings && (stepWarnings[step]?.length ?? 0) > 0;

    const goToApplicationStep = (step: number) => {
        setApplicationStep(step);
    };

    const goToNextApplicationStep = () => {
        if ((stepWarnings[applicationStep]?.length ?? 0) > 0) {
            setShowApplicationWarnings(true);
            return;
        }

        setApplicationStep((step) => Math.min(2, step + 1));
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
            if (activeElection?.id && activeElection.showVoteProgress) {
                await loadVoteTrends(activeElection.id);
            }
        } catch (err) {
            setVoteError(err instanceof Error ? err.message : 'Voting failed.');
        }
    };

    const handleInvitePeers = async () => {
        setInviteMessage('');
        const inviteText = 'AUCA student elections are active. Open the portal to review candidates and vote when voting is open.';
        const inviteUrl = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: activeElection?.title ?? 'AUCA Student Elections',
                    text: inviteText,
                    url: inviteUrl,
                });
                setInviteMessage('Invite shared successfully.');
                return;
            }

            await navigator.clipboard.writeText(`${inviteText} ${inviteUrl}`);
            setInviteMessage('Election invite link copied.');
        } catch {
            setInviteMessage('Unable to share automatically. Copy the portal link from your browser.');
        }
    };

    return (
        <div className="elections-page">
            <div className="elections-hero-card">
                <div className="hero-left">
                    <div className="elections-pill">Student Elections</div>
                    <h1>Student Leader Elections</h1>
                    <p>
                        {isApprovedCandidatePhase
                            ? 'Review approved candidates and vote during the active voting window.'
                            : 'Apply for an open position during the nomination phase.'}
                    </p>
                    <div className="elections-hero-actions">
                        {isApprovedCandidatePhase && (
                            <button className="vote-button" onClick={() => setActiveSection('candidates')}>
                                View Approved Candidates
                            </button>
                        )}
                        {isNominationPhase && (
                            <button className="ghost-button" onClick={() => setActiveSection('overview')}>
                                View Positions
                            </button>
                        )}
                    </div>
                </div>
                <div className="hero-right">
                    <div className="requirements-card">
                        <div className="hero-card-title">Eligibility</div>
                        <div className="requirements-list">
                            <span>45-100 credits</span>
                            <span>GPA 14.0+</span>
                            <span>Good discipline</span>
                            <span>Proof when required</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="elections-tabs">
                {isNominationPhase && (
                    <>
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
                    </>
                )}
                {isApprovedCandidatePhase && (
                    <button className={`elections-tab ${activeSection === 'candidates' ? 'active' : ''}`} onClick={() => setActiveSection('candidates')}>
                        Approved Candidates
                    </button>
                )}
            </div>

            <div className="elections-layout">
                <div className="elections-main">
                    {activeSection === 'overview' && isNominationPhase && (
                        <div className="election-card">
                            <div className="section-head">
                                <h2 className="section-title">Current Open Elections</h2>
                                <span className="live-pill">Live Now</span>
                            </div>
                            <div className="positions-grid">
                                {POSITIONS.map((pos, index) => (
                                    <button
                                        type="button"
                                        key={pos}
                                        className="position-card"
                                        onClick={() => handleSelectPositionFromOverview(pos)}
                                    >
                                        <div className="position-index">{String(index + 1).padStart(2, '0')}</div>
                                        <div className="position-copy">
                                            <div className="position-title">{pos.replace('AUCASA ', '')}</div>
                                            <div className="position-sub">Nomination open</div>
                                        </div>
                                        <span className="position-action">Apply</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'apply' && isNominationPhase && (
                        <div className="election-card">
                            <div className="section-head">
                                <h2 className="section-title">Application Form</h2>
                                <span className="subtle-pill">Candidate Registration</span>
                            </div>

                            {submitError && (
                                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                    {submitError}
                                </div>
                            )}
                            {submitMessage && (
                                <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 800 }}>
                                    {submitMessage}
                                </div>
                            )}

                            <form onSubmit={handleApply} className="election-stepper-form">
                                <div className="election-application-accordion">
                                    <section className={`election-accordion-step ${applicationStep === 0 ? 'active' : ''} ${applicationStep > 0 ? 'complete' : ''} ${hasStepWarning(0) ? 'warning' : ''}`}>
                                        <button type="button" className="election-accordion-step-head" onClick={() => goToApplicationStep(0)}>
                                            <span>{applicationStep > 0 ? <CheckCircle2 size={15} /> : 1}</span>
                                            <strong>Candidate Details</strong>
                                            {hasStepWarning(0) && <small>{stepWarnings[0][0]}</small>}
                                        </button>
                                        {applicationStep === 0 && (
                                            <div className="election-accordion-step-body">
                                                <div className="election-step-grid">
                                                    <label>
                                                        <span>Student Number</span>
                                                        <input
                                                            className={hasStepWarning(0) && !studentNumber.trim() ? 'field-warning' : ''}
                                                            placeholder="AUCA/UG/001/26"
                                                            value={studentNumber}
                                                            onChange={(e) => setStudentNumber(e.target.value)}
                                                        />
                                                        {showApplicationWarnings && !studentNumber.trim() && <em>Student number is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Position</span>
                                                        <select
                                                            className={hasStepWarning(0) && !position ? 'field-warning' : ''}
                                                            value={position}
                                                            onChange={(e) => setPosition(e.target.value)}
                                                        >
                                                            <option value="">Select Position</option>
                                                            {POSITIONS.map((pos) => (
                                                                <option key={pos} value={pos}>{pos}</option>
                                                            ))}
                                                        </select>
                                                        {showApplicationWarnings && !position && <em>Position is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>GPA</span>
                                                        <input
                                                            className={hasStepWarning(0) && (!gpa || Number.isNaN(Number(gpa))) ? 'field-warning' : ''}
                                                            type="number"
                                                            step="0.01"
                                                            value={gpa}
                                                            onChange={(e) => setGpa(e.target.value)}
                                                        />
                                                        {showApplicationWarnings && (!gpa || Number.isNaN(Number(gpa))) && <em>GPA is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Credits</span>
                                                        <input
                                                            className={hasStepWarning(0) && (!credits || Number.isNaN(Number(credits))) ? 'field-warning' : ''}
                                                            type="number"
                                                            value={credits}
                                                            onChange={(e) => setCredits(e.target.value)}
                                                        />
                                                        {showApplicationWarnings && (!credits || Number.isNaN(Number(credits))) && <em>Credits are required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Discipline Status</span>
                                                        <select
                                                            className={hasStepWarning(0) && !disciplineStatus ? 'field-warning' : ''}
                                                            value={disciplineStatus}
                                                            onChange={(e) => setDisciplineStatus(e.target.value)}
                                                        >
                                                            <option value="">Select Status</option>
                                                            <option value="Good">Good</option>
                                                            <option value="Satisfactory">Satisfactory</option>
                                                        </select>
                                                        {showApplicationWarnings && !disciplineStatus && <em>Discipline status is required.</em>}
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <section className={`election-accordion-step ${applicationStep === 1 ? 'active' : ''} ${applicationStep > 1 ? 'complete' : ''} ${hasStepWarning(1) ? 'warning' : ''}`}>
                                        <button type="button" className="election-accordion-step-head" onClick={() => goToApplicationStep(1)}>
                                            <span>{applicationStep > 1 ? <CheckCircle2 size={15} /> : 2}</span>
                                            <strong>Campaign Profile</strong>
                                            {hasStepWarning(1) && <small>{stepWarnings[1][0]}</small>}
                                        </button>
                                        {applicationStep === 1 && (
                                            <div className="election-accordion-step-body">
                                                <div className="selected-election-summary">
                                                    <strong>{position || 'No position selected'}</strong>
                                                    <span>Adventist proof: {isAdventistRequired ? 'Required' : 'Optional'}</span>
                                                    <p>Write the message students will see when your candidacy is approved.</p>
                                                </div>
                                                <div className="election-step-grid one-column">
                                                    <label>
                                                        <span>Campaign Slogan</span>
                                                        <input
                                                            className={hasStepWarning(1) && !slogan.trim() ? 'field-warning' : ''}
                                                            value={slogan}
                                                            onChange={(e) => setSlogan(e.target.value)}
                                                            placeholder="A short campaign message"
                                                        />
                                                        {showApplicationWarnings && !slogan.trim() && <em>Campaign slogan is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Manifesto</span>
                                                        <textarea
                                                            className={hasStepWarning(1) && !manifesto.trim() ? 'field-warning' : ''}
                                                            rows={5}
                                                            value={manifesto}
                                                            onChange={(e) => setManifesto(e.target.value)}
                                                            placeholder="Explain your plans and why students should support you."
                                                        />
                                                        {showApplicationWarnings && !manifesto.trim() && <em>Manifesto is required.</em>}
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <section className={`election-accordion-step ${applicationStep === 2 ? 'active' : ''} ${hasStepWarning(2) ? 'warning' : ''}`}>
                                        <button type="button" className="election-accordion-step-head" onClick={() => goToApplicationStep(2)}>
                                            <span>3</span>
                                            <strong>Documents</strong>
                                            {hasStepWarning(2) && <small>{stepWarnings[2][0]}</small>}
                                        </button>
                                        {applicationStep === 2 && (
                                            <div className="election-accordion-step-body">
                                                <div className="election-step-grid">
                                                    <label>
                                                        <span>Adventist Proof {isAdventistRequired ? '' : '(Optional)'}</span>
                                                        <div className={`election-file-input ${hasStepWarning(2) && isAdventistRequired && !adventistProof ? 'field-warning' : ''}`}>
                                                            <Upload size={16} />
                                                            <strong>{adventistProof ? adventistProof.name : 'Upload Adventist proof'}</strong>
                                                            <input type="file" onChange={(e) => setAdventistProof(e.target.files?.[0] ?? null)} />
                                                        </div>
                                                        {showApplicationWarnings && isAdventistRequired && !adventistProof && <em>Adventist proof is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Transcript</span>
                                                        <div className={`election-file-input ${hasStepWarning(2) && !transcript ? 'field-warning' : ''}`}>
                                                            <FileText size={16} />
                                                            <strong>{transcript ? transcript.name : 'Upload transcript'}</strong>
                                                            <input type="file" onChange={(e) => setTranscript(e.target.files?.[0] ?? null)} />
                                                        </div>
                                                        {showApplicationWarnings && !transcript && <em>Transcript is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Professional Photo</span>
                                                        <div className={`election-file-input ${hasStepWarning(2) && !photo ? 'field-warning' : ''}`}>
                                                            <Upload size={16} />
                                                            <strong>{photo ? photo.name : 'Upload professional photo'}</strong>
                                                            <input type="file" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                                                        </div>
                                                        {showApplicationWarnings && !photo && <em>Professional photo is required.</em>}
                                                    </label>
                                                    <label>
                                                        <span>Certificates</span>
                                                        <div className={`election-file-input ${hasStepWarning(2) && !certificates ? 'field-warning' : ''}`}>
                                                            <FileText size={16} />
                                                            <strong>{certificates ? certificates.name : 'Upload certificates'}</strong>
                                                            <input type="file" onChange={(e) => setCertificates(e.target.files?.[0] ?? null)} />
                                                        </div>
                                                        {showApplicationWarnings && !certificates && <em>Certificates are required.</em>}
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                </div>

                                <div className="election-stepper-actions">
                                    <button type="button" className="secondary" onClick={() => setApplicationStep((step) => Math.max(0, step - 1))} disabled={applicationStep === 0}>
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                    {applicationStep < 2 ? (
                                        <button type="button" onClick={goToNextApplicationStep}>
                                            Next
                                            <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={isSubmitting || !eligibilityForSelectedPosition.eligible}>
                                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                            <ArrowRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {(activeSection === 'candidates' || isApprovedCandidatePhase) && (
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
                                <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 800 }}>
                                    {voteMessage}
                                </div>
                            )}
                            {voteProgressVisible && (
                                <section className="student-live-polls" aria-label="Transparent live voting progress">
                                    <div className="student-live-polls-head">
                                        <div>
                                            <span>Transparent Voting</span>
                                            <h3>Live Vote Movement</h3>
                                            <p>Shown by dean approval. The list rises and falls as students vote.</p>
                                        </div>
                                        <strong>{activeElection?.totalVotes ?? 0} votes</strong>
                                    </div>
                                    {voteTrendError ? (
                                        <div className="student-live-empty">{voteTrendError}</div>
                                    ) : voteProgressByPosition.length === 0 ? (
                                        <div className="student-live-empty">Live progress will appear after approved candidates receive votes.</div>
                                    ) : (
                                        <div className="student-live-groups">
                                            {voteProgressByPosition.map((group) => (
                                                <article key={group.positionName} className="student-live-group">
                                                    <h4>{group.positionName}</h4>
                                                    <div className="student-live-list">
                                                        {group.items.map((item, index) => {
                                                            const width = highestCandidateVotes > 0
                                                                ? Math.max(8, Math.round((item.votes / highestCandidateVotes) * 100))
                                                                : 0;
                                                            const isLeader = index === 0 && item.votes > 0;
                                                            return (
                                                                <div className={`student-live-row ${isLeader ? 'leader' : ''}`} key={item.candidateId}>
                                                                    <div className="student-live-rank">{index + 1}</div>
                                                                    <div className="student-live-main">
                                                                        <div className="student-live-title">
                                                                            <strong>{item.candidateName}</strong>
                                                                            <span>{item.percentage.toFixed(1)}%</span>
                                                                        </div>
                                                                        <div className="student-live-track">
                                                                            <div style={{ width: `${width}%` }} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="student-live-votes">
                                                                        <strong>{item.votes.toLocaleString()}</strong>
                                                                        <span>votes</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </section>
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
                                                className={`vote-button vote-candidate-btn ${hasVoted ? 'submitted' : ''}`}
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
                        <div className="side-card-head">
                            <h3>Election Timeline</h3>
                            <span>4 phases</span>
                        </div>
                        <div className="timeline-list">
                            {timelinePhases.map((phase) => (
                                <div key={phase.title} className={`timeline-step ${phase.state}`}>
                                    <span>{phase.title}</span>
                                    <small>{phase.detail}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="side-card accent">
                        <h3>Current Turnout</h3>
                        <div className="turnout-row">
                            <div>
                                <div className="turnout-value">{activeElection?.totalVotes ?? 0}</div>
                                <div className="turnout-meta">of {activeElection?.eligibleVoters ?? 0} eligible students</div>
                            </div>
                            <div className="turnout-percent">{turnoutRate}%</div>
                        </div>
                        <div className="turnout-bar">
                            <span style={{ width: `${turnoutRate}%` }} />
                        </div>
                        <button type="button" className="ghost-button wide" onClick={handleInvitePeers}>
                            Invite Peers to Vote
                        </button>
                        {inviteMessage && <div className="invite-message">{inviteMessage}</div>}
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
