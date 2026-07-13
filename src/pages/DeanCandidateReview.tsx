import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    FolderCheck,
    Gavel,
    Megaphone,
    Radio,
    UserCheck,
    Vote,
} from 'lucide-react';
import './DeanCandidateReview.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type PendingCandidate = {
    id: number;
    studentName: string;
    studentNumber: string;
    position: string;
    gpa?: string;
    credits?: number;
    disciplineStatus?: string;
    adventistProofPath?: string;
    transcriptPath?: string;
    professionalPhotoPath?: string;
    certificatesPath?: string;
};

type ElectionInfo = {
    id: number;
    title: string;
    status: 'DRAFT' | 'NOMINATION' | 'CAMPAIGN' | 'VOTING' | 'CLOSED' | 'ARCHIVED';
    createdAt?: string;
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

type ElectionStatistics = {
    electionId: number;
    eligibleVoters: number;
    votesCast: number;
    notVoted: number;
    turnoutRate: number;
    leadingCandidate: string;
    leadingCandidateVotes: number;
};

const DeanCandidateReview = () => {
    const [candidates, setCandidates] = useState<PendingCandidate[]>([]);
    const [elections, setElections] = useState<ElectionInfo[]>([]);
    const [voteTrends, setVoteTrends] = useState<VoteTrendItem[]>([]);
    const [electionStatistics, setElectionStatistics] = useState<ElectionStatistics | null>(null);
    const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [reminderMessage, setReminderMessage] = useState('');
    const [closeGuardStep, setCloseGuardStep] = useState<'warn' | 'force' | null>(null);
    const [openVotingConfirmOpen, setOpenVotingConfirmOpen] = useState(false);
    const [createVotingConfirmOpen, setCreateVotingConfirmOpen] = useState(false);
    const [newVotingTitle, setNewVotingTitle] = useState('');
    const [votingStartInput, setVotingStartInput] = useState('');
    const [votingEndInput, setVotingEndInput] = useState('');
    const [createFormError, setCreateFormError] = useState('');
    const [createFormSuccess, setCreateFormSuccess] = useState('');
    const [createFieldErrors, setCreateFieldErrors] = useState<{ title?: string; start?: string; end?: string }>({});
    const [voteTrendUnavailable, setVoteTrendUnavailable] = useState(false);
    const [selectedPositionFilter, setSelectedPositionFilter] = useState('ALL');
    const [sortMode, setSortMode] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
    const [isUpdatingPhase, setIsUpdatingPhase] = useState(false);
    const [isCreatingVoting, setIsCreatingVoting] = useState(false);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [isSendingReminders, setIsSendingReminders] = useState(false);

    const loadPending = async () => {
        setError('');
        const response = await fetch(`${API_BASE}/api/elections/candidates/pending`);
        const data = await response.json().catch(() => []);
        if (!response.ok) {
            setError('Failed to load pending candidates.');
            return;
        }
        setCandidates(Array.isArray(data) ? data : []);
    };

    const loadElections = async () => {
        const response = await fetch(`${API_BASE}/api/elections`);
        const data = await response.json().catch(() => []);
        if (!response.ok) {
            setError('Failed to load elections.');
            return;
        }
        const list = Array.isArray(data)
            ? [...data].sort((a: ElectionInfo, b: ElectionInfo) => getElectionSortTime(b) - getElectionSortTime(a))
            : [];
        setElections(list);
        if (list.length > 0 && (!selectedElectionId || !list.some((election) => election.id === selectedElectionId))) {
            setSelectedElectionId(list[0].id);
        }
    };

    const loadVoteTrends = async (electionId: number) => {
        const response = await fetch(`${API_BASE}/api/elections/${electionId}/vote-trends`);
        const data = await response.json().catch(() => []);
        if (!response.ok) {
            if (response.status === 404) {
                setVoteTrendUnavailable(true);
            }
            setVoteTrends([]);
            return false;
        }
        setVoteTrendUnavailable(false);
        setVoteTrends(Array.isArray(data) ? data : []);
        return true;
    };

    const loadElectionStatistics = async (electionId: number) => {
        const response = await fetch(`${API_BASE}/api/elections/${electionId}/statistics`);
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) {
            setElectionStatistics(null);
            return null;
        }
        const statistics = data as ElectionStatistics;
        setElectionStatistics(statistics);
        return statistics;
    };

    useEffect(() => {
        loadPending();
        void loadElections();
    }, []);

    useEffect(() => {
        if (!selectedElectionId) {
            setVoteTrends([]);
            setElectionStatistics(null);
            return;
        }

        setVoteTrendUnavailable(false);
        setCloseGuardStep(null);
        let stopPolling = false;
        void loadVoteTrends(selectedElectionId).then((available) => {
            stopPolling = !available;
        });
        void loadElectionStatistics(selectedElectionId);
        const timer = window.setInterval(() => {
            if (stopPolling) return;
            void loadVoteTrends(selectedElectionId).then((available) => {
                stopPolling = !available;
            });
            void loadElectionStatistics(selectedElectionId);
            void loadElections();
        }, 7000);

        return () => window.clearInterval(timer);
    }, [selectedElectionId]);

    const selectedElection = useMemo(
        () => elections.find((item) => item.id === selectedElectionId) ?? null,
        [elections, selectedElectionId]
    );
    const turnoutMetrics = useMemo(() => {
        const eligibleVoters = electionStatistics?.eligibleVoters ?? selectedElection?.eligibleVoters ?? 0;
        const votesCast = electionStatistics?.votesCast ?? selectedElection?.totalVotes ?? 0;
        const remainingVotes = electionStatistics?.notVoted ?? Math.max(eligibleVoters - votesCast, 0);
        const turnoutRate = electionStatistics?.turnoutRate ?? (eligibleVoters > 0 ? Math.min(100, Math.round((votesCast / eligibleVoters) * 100)) : 0);

        return {
            eligibleVoters,
            votesCast,
            remainingVotes,
            turnoutRate,
        };
    }, [electionStatistics, selectedElection]);

    const phaseProgress = useMemo(() => {
        const status = selectedElection?.status ?? 'DRAFT';
        const progressMap: Record<ElectionInfo['status'], number> = {
            DRAFT: 10,
            CAMPAIGN: 35,
            NOMINATION: 60,
            VOTING: 85,
            CLOSED: 100,
            ARCHIVED: 100,
        };
        const completed = progressMap[status];
        const labelMap: Record<ElectionInfo['status'], string> = {
            DRAFT: 'Setup',
            CAMPAIGN: 'Campaign started',
            NOMINATION: 'Students applying',
            VOTING: 'Voting open',
            CLOSED: 'Voting closed',
            ARCHIVED: 'Archived',
        };
        return { status, completed, label: labelMap[status] };
    }, [selectedElection?.status]);
    const nextPhaseAction = useMemo(() => {
        const status = selectedElection?.status ?? 'DRAFT';
        if (status === 'DRAFT') {
            return {
                kind: 'campaign' as const,
                label: 'Start Campaign',
                icon: <Megaphone size={15} />,
                className: '',
            };
        }
        if (status === 'CAMPAIGN') {
            return {
                kind: 'apply' as const,
                label: 'Let Students Apply',
                icon: <FolderCheck size={15} />,
                className: '',
            };
        }
        if (status === 'NOMINATION') {
            return {
                kind: 'open-voting' as const,
                label: 'Open Voting',
                icon: <Vote size={15} />,
                className: 'success',
            };
        }
        if (status === 'VOTING') {
            return {
                kind: 'close-voting' as const,
                label: 'Close Voting',
                icon: <Gavel size={15} />,
                className: 'danger',
            };
        }
        return null;
    }, [selectedElection?.status]);

    const turnoutCaption = turnoutMetrics.eligibleVoters > 0
        ? `${turnoutMetrics.votesCast.toLocaleString()} of ${turnoutMetrics.eligibleVoters.toLocaleString()} votes cast`
        : `${turnoutMetrics.votesCast.toLocaleString()} votes cast. Eligible voter pool not configured.`;

    const candidatePollMetrics = useMemo(() => {
        const highestVote = voteTrends.reduce((max, item) => Math.max(max, item.votes ?? 0), 0);
        const totalCandidateVotes = voteTrends.reduce((sum, item) => sum + (item.votes ?? 0), 0);
        return {
            highestVote,
            totalCandidateVotes,
        };
    }, [voteTrends]);

    const positionOptions = useMemo(() => {
        const options = new Set<string>();
        candidates.forEach((candidate) => {
            if (candidate.position) options.add(candidate.position);
        });
        return ['ALL', ...Array.from(options)];
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        const base = selectedPositionFilter === 'ALL'
            ? [...candidates]
            : candidates.filter((candidate) => candidate.position === selectedPositionFilter);
        base.sort((a, b) => (sortMode === 'NEWEST' ? b.id - a.id : a.id - b.id));
        return base;
    }, [candidates, selectedPositionFilter, sortMode]);

    const handleApprove = async (id: number) => {
        setError('');
        const response = await fetch(`${API_BASE}/api/elections/candidates/${id}/approve`, {
            method: 'POST',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to approve candidate.');
            return;
        }
        await loadPending();
    };

    const updateElectionStatus = async (nextStatus: 'NOMINATION' | 'CAMPAIGN' | 'VOTING' | 'CLOSED') => {
        setError('');
        setStatusMessage('');
        setCloseGuardStep(null);
        if (!selectedElectionId) {
            setError('Please select an election first.');
            return;
        }

        const endpoint =
            nextStatus === 'VOTING'
                ? `${API_BASE}/api/elections/${selectedElectionId}/open-voting`
                : nextStatus === 'CLOSED'
                    ? `${API_BASE}/api/elections/${selectedElectionId}/close-voting`
                    : `${API_BASE}/api/elections/${selectedElectionId}/status`;

        setIsUpdatingPhase(true);
        try {
            const response = await fetch(endpoint, {
                method: nextStatus === 'NOMINATION' || nextStatus === 'CAMPAIGN' ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: nextStatus === 'NOMINATION' || nextStatus === 'CAMPAIGN'
                    ? JSON.stringify({ status: nextStatus })
                    : undefined,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to update election status.');
                return;
            }
            setStatusMessage(`Election moved to ${nextStatus} phase.`);
            await loadElections();
            if (selectedElectionId) {
                await loadElectionStatistics(selectedElectionId);
            }
        } finally {
            setIsUpdatingPhase(false);
        }
    };

    const handleCloseVotingClick = async () => {
        setError('');
        setStatusMessage('');
        setReminderMessage('');
        if (!selectedElectionId) {
            setError('Please select an election first.');
            return;
        }

        const latestStatistics = await loadElectionStatistics(selectedElectionId);
        const outstandingVoters = latestStatistics?.notVoted ?? turnoutMetrics.remainingVotes;
        if (outstandingVoters > 0) {
            setCloseGuardStep('warn');
            return;
        }

        await updateElectionStatus('CLOSED');
    };

    const forceCloseVoting = async () => {
        await updateElectionStatus('CLOSED');
    };

    const confirmPhaseChange = async (
        nextStatus: 'NOMINATION' | 'CAMPAIGN',
        message: string
    ) => {
        const confirmed = window.confirm(message);
        if (!confirmed) return;
        await updateElectionStatus(nextStatus);
    };

    const handleNextPhaseAction = () => {
        if (!nextPhaseAction) return;
        if (nextPhaseAction.kind === 'campaign') {
            void confirmPhaseChange(
                'CAMPAIGN',
                'Start the campaign phase for this election? After this, the Start Campaign button will be hidden.'
            );
            return;
        }
        if (nextPhaseAction.kind === 'apply') {
            void confirmPhaseChange(
                'NOMINATION',
                'Let students apply now? After this, you cannot go back to Start Campaign from this control.'
            );
            return;
        }
        if (nextPhaseAction.kind === 'open-voting') {
            prepareOpenVoting();
            return;
        }
        if (nextPhaseAction.kind === 'close-voting') {
            void handleCloseVotingClick();
        }
    };

    const updateVoteProgressVisibility = async () => {
        setError('');
        setStatusMessage('');
        if (!selectedElectionId) {
            setError('Please select an election first.');
            return;
        }

        const nextVisible = !Boolean(selectedElection?.showVoteProgress);
        setIsUpdatingVisibility(true);
        try {
            const response = await fetch(`${API_BASE}/api/elections/${selectedElectionId}/vote-progress-visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visible: nextVisible }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to update student vote visibility.');
                return;
            }
            setStatusMessage(nextVisible
                ? 'Students can now see live voting progress.'
                : 'Student live voting progress is now hidden.');
            await loadElections();
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const sendVotingReminders = async () => {
        setError('');
        setStatusMessage('');
        setReminderMessage('');
        if (!selectedElectionId) {
            setError('Please select an election first.');
            return;
        }

        setIsSendingReminders(true);
        try {
            const response = await fetch(`${API_BASE}/api/elections/${selectedElectionId}/reminders`, {
                method: 'POST',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to send voting reminders.');
                return;
            }
            setReminderMessage(data.message ?? 'Voting reminders were sent.');
            await loadElectionStatistics(selectedElectionId);
        } finally {
            setIsSendingReminders(false);
        }
    };

    const DAY_IN_MS = 24 * 60 * 60 * 1000;

    const validateBaseDateRange = (emptyMessage: string) => {
        const start = new Date(votingStartInput);
        const end = new Date(votingEndInput);
        const now = new Date();
        if (!votingStartInput || !votingEndInput || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            setError(emptyMessage);
            return null;
        }
        if (start.getTime() < now.getTime() - 60000) {
            setError('Start date cannot be in the past.');
            return null;
        }
        if (end <= start) {
            setError('End date must be after the start date.');
            return null;
        }
        return { start, end };
    };

    const validateElectionProcessRange = (showInForm = false) => {
        const fieldErrors: { title?: string; start?: string; end?: string } = {};
        const reportError = (message: string, nextFieldErrors = fieldErrors) => {
            if (showInForm) {
                setCreateFormError(message);
                setCreateFieldErrors(nextFieldErrors);
            } else {
                setError(message);
            }
        };

        if (showInForm && !newVotingTitle.trim()) {
            fieldErrors.title = 'Election title is required.';
        }
        if (!votingStartInput) {
            fieldErrors.start = 'Process start date is required.';
        }
        if (!votingEndInput) {
            fieldErrors.end = 'Process end date is required.';
        }
        if (Object.keys(fieldErrors).length > 0) {
            reportError('Please complete the highlighted field(s).', fieldErrors);
            return null;
        }

        const start = new Date(votingStartInput);
        const end = new Date(votingEndInput);
        const now = new Date();
        if (Number.isNaN(start.getTime())) {
            reportError('Please enter a valid process start date.', { start: 'Use a valid start date and time.' });
            return null;
        }
        if (Number.isNaN(end.getTime())) {
            reportError('Please enter a valid process end date.', { end: 'Use a valid end date and time.' });
            return null;
        }
        if (start.getTime() < now.getTime() - 60000) {
            reportError('Process start date cannot be in the past.', { start: 'Choose a current or future date.' });
            return null;
        }
        if (end <= start) {
            reportError('Process end date must be after the start date.', { end: 'Choose an end date after the start date.' });
            return null;
        }

        const duration = end.getTime() - start.getTime();
        if (duration < 15 * DAY_IN_MS) {
            reportError('Election process must be at least 15 days long.', { end: 'End date must be at least 15 days after the start date.' });
            return null;
        }
        if (duration > 30 * DAY_IN_MS) {
            reportError('Election process cannot be longer than 30 days.', { end: 'End date cannot be more than 30 days after the start date.' });
            return null;
        }

        const electionDayStart = new Date(end);
        electionDayStart.setHours(0, 0, 0, 0);
        if (end <= electionDayStart) {
            reportError('End time must be after the start of the final election day.', { end: 'Choose a time after 12:00 AM on the final day.' });
            return null;
        }

        if (showInForm) {
            setCreateFormError('');
            setCreateFieldErrors({});
        }
        return { start, end, electionDayStart };
    };

    const validateVotingDayRange = () => {
        const range = validateBaseDateRange('Please enter a valid voting start and end date.');
        if (!range) return null;

        const duration = range.end.getTime() - range.start.getTime();
        if (duration > DAY_IN_MS) {
            setError('Voting day cannot be longer than one day.');
            return null;
        }

        return range;
    };

    const createVoting = async () => {
        setError('');
        setStatusMessage('');
        setCreateFormError('');
        setCreateFormSuccess('');
        setCreateFieldErrors({});
        setIsCreatingVoting(true);
        try {
            const validatedRange = validateElectionProcessRange(true);
            if (!validatedRange) return;
            const nominationEnd = new Date(validatedRange.start);
            nominationEnd.setDate(nominationEnd.getDate() + 5);
            const campaignStart = new Date(nominationEnd);
            const campaignEnd = new Date(validatedRange.electionDayStart);

            const payload = {
                title: newVotingTitle.trim(),
                description: 'New election process created from Dean candidate review panel.',
                nominationStart: toDateTimeLocalValue(validatedRange.start),
                nominationEnd: toDateTimeLocalValue(nominationEnd),
                campaignStart: toDateTimeLocalValue(campaignStart),
                campaignEnd: toDateTimeLocalValue(campaignEnd),
                votingStart: toDateTimeLocalValue(validatedRange.electionDayStart),
                votingEnd: toDateTimeLocalValue(validatedRange.end),
                eligibleVoters: selectedElection?.eligibleVoters ?? 0,
                totalVotes: 0,
                status: 'DRAFT',
            };

            const response = await fetch(`${API_BASE}/api/elections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setCreateFormError(data.error ?? 'Failed to create election process.');
                return;
            }

            await loadElections();
            if (data && typeof data.id === 'number') {
                setSelectedElectionId(data.id);
            }
            const success = `Election process created successfully. Voting day: ${validatedRange.electionDayStart.toLocaleString()} - ${validatedRange.end.toLocaleString()}.`;
            setCreateFormSuccess(success);
            setStatusMessage(success);
            window.setTimeout(() => {
                setCreateVotingConfirmOpen(false);
                setCreateFormSuccess('');
            }, 1400);
        } finally {
            setIsCreatingVoting(false);
        }
    };

    const formatWindow = (start?: string, end?: string) => {
        if (!start && !end) return 'No voting window configured';
        const startLabel = start ? new Date(start).toLocaleString() : 'TBD';
        const endLabel = end ? new Date(end).toLocaleString() : 'TBD';
        return `${startLabel} - ${endLabel}`;
    };

    const toDateTimeLocalValue = (date: Date) => {
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const handleCreateProcessStartChange = (value: string) => {
        setVotingStartInput(value);
        const start = new Date(value);
        if (value && !Number.isNaN(start.getTime())) {
            const end = new Date(start);
            end.setDate(end.getDate() + 15);
            setVotingEndInput(toDateTimeLocalValue(end));
        } else {
            setVotingEndInput('');
        }
    };

    const handleOpenVotingStartChange = (value: string) => {
        setVotingStartInput(value);
        const start = new Date(value);
        if (value && !Number.isNaN(start.getTime())) {
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            setVotingEndInput(toDateTimeLocalValue(end));
        } else {
            setVotingEndInput('');
        }
    };

    const prepareOpenVoting = () => {
        setError('');
        setStatusMessage('');
        setVotingStartInput('');
        setVotingEndInput('');
        setOpenVotingConfirmOpen(true);
    };

    const prepareCreateVoting = () => {
        setError('');
        setStatusMessage('');
        setCreateFormError('');
        setCreateFormSuccess('');
        setCreateFieldErrors({});
        setNewVotingTitle('');
        setVotingStartInput('');
        setVotingEndInput('');
        setCreateVotingConfirmOpen(true);
    };

    const confirmOpenVoting = async () => {
        setError('');
        setStatusMessage('');
        if (!selectedElectionId) {
            setError('Please select an election first.');
            return;
        }
        const validatedRange = validateVotingDayRange();
        if (!validatedRange) return;

        setIsUpdatingPhase(true);
        try {
            const response = await fetch(`${API_BASE}/api/elections/${selectedElectionId}/open-voting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    votingStart: votingStartInput,
                    votingEnd: votingEndInput,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to open voting.');
                return;
            }
            setOpenVotingConfirmOpen(false);
            setStatusMessage(`Voting opened from ${validatedRange.start.toLocaleString()} to ${validatedRange.end.toLocaleString()}.`);
            await loadElections();
            await loadElectionStatistics(selectedElectionId);
        } finally {
            setIsUpdatingPhase(false);
        }
    };

    return (
        <div className="election-admin-page">
            <div className="election-admin-content">
                <main className="election-admin-main">
                    {error && <div className="flash flash-error">{error}</div>}
                    {statusMessage && <div className="flash flash-success">{statusMessage}</div>}

                    <section className="hero-banner">
                        <div className="hero-copy">
                            <span className="hero-chip">ACTIVE ELECTION</span>
                            <h1>{selectedElection?.title ?? 'AUCASA GENERAL ELECTION'}</h1>
                            <div className="hero-meta">
                                <span><CalendarDays size={15} /> Voting Window: {formatWindow(selectedElection?.votingStart, selectedElection?.votingEnd)}</span>
                                <span><FolderCheck size={15} /> Current Phase: {selectedElection?.status ?? 'N/A'}</span>
                            </div>
                            <div className="hero-select">
                                <label htmlFor="election-select">Election</label>
                                <select
                                    id="election-select"
                                    value={selectedElectionId ?? ''}
                                    onChange={(e) => {
                                        const nextId = Number(e.target.value);
                                        setSelectedElectionId(Number.isFinite(nextId) ? nextId : null);
                                    }}
                                >
                                    {elections.map((election) => (
                                        <option key={election.id} value={election.id}>{election.title}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="create-voting-btn"
                                    onClick={prepareCreateVoting}
                                    disabled={isCreatingVoting}
                                >
                                    {isCreatingVoting ? 'Creating...' : 'Create Voting'}
                                </button>
                            </div>
                        </div>
                        <div className="hero-controls">
                            {nextPhaseAction ? (
                                <button
                                    type="button"
                                    className={`phase-next ${nextPhaseAction.className}`}
                                    onClick={handleNextPhaseAction}
                                    disabled={isUpdatingPhase}
                                >
                                    {nextPhaseAction.icon} {nextPhaseAction.label}
                                </button>
                            ) : (
                                <div className="phase-complete-note">
                                    <strong>Phase complete</strong>
                                    <span>No next phase action available.</span>
                                </div>
                            )}
                            <button
                                type="button"
                                className={selectedElection?.showVoteProgress ? 'visibility on' : 'visibility'}
                                onClick={updateVoteProgressVisibility}
                                disabled={isUpdatingVisibility || !selectedElectionId}
                            >
                                <Radio size={15} /> {selectedElection?.showVoteProgress ? 'Hide Live Polls' : 'Show Live Polls'}
                            </button>
                        </div>
                    </section>

                    {createVotingConfirmOpen && (
                        <div className="election-popup-overlay" onClick={() => setCreateVotingConfirmOpen(false)}>
                            <section className="open-guard-card open-guard-popup" onClick={(event) => event.stopPropagation()}>
                                <div className="popup-heading">
                                    <h2>Create new election process</h2>
                                    <p>Choose the process dates. The end date fills automatically and can be changed.</p>
                                </div>
                                {createFormError && <div className="popup-form-message popup-form-error">{createFormError}</div>}
                                {createFormSuccess && <div className="popup-form-message popup-form-success">{createFormSuccess}</div>}
                                <div className="open-range-form create-election-form">
                                    <label className={createFieldErrors.title ? 'form-field-full field-has-error' : 'form-field-full'}>
                                        <span>Voting title</span>
                                        <input
                                            type="text"
                                            placeholder="Example: AUCASA Election 2026"
                                            value={newVotingTitle}
                                            onChange={(event) => {
                                                setNewVotingTitle(event.target.value);
                                                setCreateFieldErrors((current) => ({ ...current, title: undefined }));
                                                setCreateFormError('');
                                            }}
                                        />
                                        {createFieldErrors.title && <small>{createFieldErrors.title}</small>}
                                    </label>
                                    <label className={createFieldErrors.start ? 'field-has-error' : ''}>
                                        <span>Process start date and time</span>
                                        <input
                                            type="datetime-local"
                                            value={votingStartInput}
                                            min={toDateTimeLocalValue(new Date())}
                                            onChange={(event) => {
                                                handleCreateProcessStartChange(event.target.value);
                                                setCreateFieldErrors((current) => ({ ...current, start: undefined, end: undefined }));
                                                setCreateFormError('');
                                            }}
                                        />
                                        {createFieldErrors.start && <small>{createFieldErrors.start}</small>}
                                    </label>
                                    <label className={createFieldErrors.end ? 'field-has-error' : ''}>
                                        <span>Process end date and time</span>
                                        <input
                                            type="datetime-local"
                                            value={votingEndInput}
                                            min={votingStartInput || toDateTimeLocalValue(new Date())}
                                            onChange={(event) => {
                                                setVotingEndInput(event.target.value);
                                                setCreateFieldErrors((current) => ({ ...current, end: undefined }));
                                                setCreateFormError('');
                                            }}
                                        />
                                        {createFieldErrors.end && <small>{createFieldErrors.end}</small>}
                                    </label>
                                </div>
                                <div className="close-guard-actions">
                                    <button type="button" className="soft" onClick={() => setCreateVotingConfirmOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="button" onClick={createVoting} disabled={isCreatingVoting}>
                                        <Vote size={15} /> {isCreatingVoting ? 'Creating...' : 'Confirm Create Voting'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {openVotingConfirmOpen && (
                        <div className="election-popup-overlay" onClick={() => setOpenVotingConfirmOpen(false)}>
                            <section className="open-guard-card open-guard-popup" onClick={(event) => event.stopPropagation()}>
                                <div>
                                    <h2>Confirm opening voting</h2>
                                    <p>Set the voting start and end date. Voting can be shorter, but it cannot be longer than one day.</p>
                                </div>
                                <div className="open-range-form">
                                    <label>
                                        <span>Start date and time</span>
                                        <input
                                            type="datetime-local"
                                            value={votingStartInput}
                                            min={toDateTimeLocalValue(new Date())}
                                            onChange={(event) => handleOpenVotingStartChange(event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        <span>End date and time</span>
                                        <input
                                            type="datetime-local"
                                            value={votingEndInput}
                                            min={votingStartInput || toDateTimeLocalValue(new Date())}
                                            onChange={(event) => setVotingEndInput(event.target.value)}
                                        />
                                    </label>
                                </div>
                                <div className="close-guard-actions">
                                    <button type="button" className="soft" onClick={() => setOpenVotingConfirmOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="button" onClick={confirmOpenVoting} disabled={isUpdatingPhase}>
                                        <Vote size={15} /> {isUpdatingPhase ? 'Opening...' : 'Confirm Open Voting'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {closeGuardStep === 'warn' && (
                        <section className="close-guard-card">
                            <div>
                                <h2>Do not close yet</h2>
                                <p>
                                    {turnoutMetrics.remainingVotes.toLocaleString()} expected student(s) have not voted.
                                    Send a reminder and give them time to finish the election.
                                </p>
                            </div>
                            <div className="close-guard-actions">
                                <button type="button" onClick={sendVotingReminders} disabled={isSendingReminders}>
                                    <Megaphone size={15} /> {isSendingReminders ? 'Sending...' : 'Send Reminder'}
                                </button>
                                <button type="button" className="soft" onClick={() => setCloseGuardStep(null)}>
                                    Keep Voting Open
                                </button>
                                <button type="button" className="danger" onClick={() => setCloseGuardStep('force')}>
                                    Continue Anyway
                                </button>
                            </div>
                            {reminderMessage && <div className="reminder-success">{reminderMessage}</div>}
                        </section>
                    )}

                    {closeGuardStep === 'force' && (
                        <section className="close-guard-card close-guard-danger">
                            <div>
                                <h2>Force close voting?</h2>
                                <p>
                                    This will close the election even though {turnoutMetrics.remainingVotes.toLocaleString()} student(s)
                                    have not voted. Results will be calculated from the votes already submitted.
                                </p>
                            </div>
                            <div className="close-guard-actions">
                                <button type="button" className="soft" onClick={() => setCloseGuardStep('warn')}>
                                    Go Back
                                </button>
                                <button type="button" className="danger" onClick={forceCloseVoting} disabled={isUpdatingPhase}>
                                    <Gavel size={15} /> {isUpdatingPhase ? 'Closing...' : 'Force Close Voting'}
                                </button>
                            </div>
                        </section>
                    )}

                    <section className="vote-progress-panel">
                        <div className="vote-progress-header">
                            <h2>Voting Progress</h2>
                            <p>Live voting progress for this election.</p>
                        </div>
                        <div className="vote-progress-grid">
                            <article className="progress-chart-card">
                                <h3>Turnout</h3>
                                <div className="chart-wrap">
                                    <div
                                        className="turnout-ring"
                                        style={{
                                            background: `conic-gradient(#0f9f95 ${turnoutMetrics.turnoutRate * 3.6}deg, #e3eaf5 0deg)`,
                                        }}
                                    >
                                        <span>{turnoutMetrics.turnoutRate}%</span>
                                    </div>
                                    <div className="chart-caption">
                                        <strong>{turnoutMetrics.votesCast.toLocaleString()}</strong>
                                        <span>Votes cast</span>
                                    </div>
                                </div>
                                <div className="progress-highlight">
                                    <strong>{turnoutMetrics.turnoutRate}%</strong>
                                    <span>{turnoutCaption}</span>
                                </div>
                            </article>

                            <article className="progress-chart-card">
                                <h3>Phase Completion</h3>
                                <div className="phase-summary-card">
                                    <div>
                                        <span>Current Phase</span>
                                        <strong>{phaseProgress.label}</strong>
                                        <small>{phaseProgress.completed}% complete</small>
                                    </div>
                                    <em>{phaseProgress.status}</em>
                                </div>
                                <div className="phase-meter">
                                    <div className="phase-meter-track" aria-label={`Election is ${phaseProgress.completed}% complete`}>
                                        <div style={{ width: `${phaseProgress.completed}%` }} />
                                    </div>
                                    <div className="phase-steps">
                                        {['Setup', 'Campaign', 'Apply', 'Vote', 'Close'].map((label) => (
                                            <span key={label}>{label}</span>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        </div>

                        <article className="voter-reminder-card">
                            <div>
                                <h3>Before Closing Voting</h3>
                                <p>Check who has not voted yet, send reminders, then close voting when you are ready.</p>
                            </div>
                            <div className="voter-stat-list">
                                <span>
                                    <strong>{turnoutMetrics.eligibleVoters.toLocaleString()}</strong>
                                    Expected voters
                                </span>
                                <span>
                                    <strong>{turnoutMetrics.votesCast.toLocaleString()}</strong>
                                    Already voted
                                </span>
                                <span className={turnoutMetrics.remainingVotes > 0 ? 'needs-reminder' : 'all-done'}>
                                    <strong>{turnoutMetrics.remainingVotes.toLocaleString()}</strong>
                                    Not voted yet
                                </span>
                            </div>
                            <div className="voter-reminder-actions">
                                <button
                                    type="button"
                                    onClick={sendVotingReminders}
                                    disabled={isSendingReminders || !selectedElectionId || turnoutMetrics.remainingVotes <= 0}
                                >
                                    <Megaphone size={15} /> {isSendingReminders ? 'Sending...' : 'Send Reminder'}
                                </button>
                                <div className="election-stat-note">
                                    <strong>{electionStatistics?.leadingCandidate ?? 'No votes yet'}</strong>
                                    <span>Leading candidate, {electionStatistics?.leadingCandidateVotes ?? 0} vote(s)</span>
                                </div>
                            </div>
                            {reminderMessage && <div className="reminder-success">{reminderMessage}</div>}
                        </article>

                        <article className="candidate-polls-card">
                            <div className="candidate-polls-head">
                                <div>
                                    <h3>Candidate Vote Trends</h3>
                                    <p>Live poll movement across all approved candidates.</p>
                                </div>
                                <span>{candidatePollMetrics.totalCandidateVotes.toLocaleString()} votes tracked</span>
                            </div>
                            {voteTrendUnavailable ? (
                                <div className="poll-empty poll-empty-warning">
                                    Vote trend service is not available yet. Restart the Spring Boot backend to load the latest election monitoring endpoint.
                                </div>
                            ) : voteTrends.length === 0 ? (
                                <div className="poll-empty">
                                    Approved candidates will appear here as soon as voting data is available.
                                </div>
                            ) : (
                                <div className="candidate-poll-list">
                                    {voteTrends.map((item, index) => {
                                        const width = candidatePollMetrics.highestVote > 0
                                            ? Math.max(7, Math.round((item.votes / candidatePollMetrics.highestVote) * 100))
                                            : 0;
                                        return (
                                            <div className="candidate-poll-row" key={item.candidateId}>
                                                <div className="candidate-rank">{index + 1}</div>
                                                <div className="candidate-poll-main">
                                                    <div className="candidate-poll-title">
                                                        <strong>{item.candidateName}</strong>
                                                        <span>{item.position}</span>
                                                    </div>
                                                    <div className="candidate-poll-track">
                                                        <div style={{ width: `${width}%` }} />
                                                    </div>
                                                </div>
                                                <div className="candidate-poll-count">
                                                    <strong>{item.votes.toLocaleString()}</strong>
                                                    <span>{item.percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </article>
                    </section>

                    <section className="pending-panel">
                        <div className="pending-head">
                            <div>
                                <h2>Pending Applications</h2>
                                <p>Review and verify candidate eligibility for the upcoming ballot.</p>
                            </div>
                            <div className="pending-tools">
                                <select
                                    value={selectedPositionFilter}
                                    onChange={(e) => setSelectedPositionFilter(e.target.value)}
                                >
                                    {positionOptions.map((option) => (
                                        <option key={option} value={option}>
                                            Filter: {option === 'ALL' ? 'All Positions' : option}
                                        </option>
                                    ))}
                                </select>
                                <select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'NEWEST' | 'OLDEST')}>
                                    <option value="NEWEST">Sort: Newest</option>
                                    <option value="OLDEST">Sort: Oldest</option>
                                </select>
                            </div>
                        </div>

                        {filteredCandidates.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-card">
                                    <FolderCheck size={24} />
                                </div>
                                <h3>All Caught Up!</h3>
                                <p>There are currently no pending applications to review.</p>
                                <button type="button" onClick={loadPending}>Refresh Queue</button>
                            </div>
                        ) : (
                            <div className="candidate-grid">
                                {filteredCandidates.map((candidate) => (
                                    <article key={candidate.id} className="candidate-review-card">
                                        <header>
                                            <h4>{candidate.studentName}</h4>
                                            <span>{candidate.studentNumber}</span>
                                        </header>
                                        <p className="position">{candidate.position}</p>
                                        <div className="meta">
                                            <span>GPA {candidate.gpa}</span>
                                            <span>Credits {candidate.credits}</span>
                                            <span>{candidate.disciplineStatus}</span>
                                        </div>
                                        <div className="docs">
                                            <span>Adventist: {candidate.adventistProofPath ? 'Yes' : 'No'}</span>
                                            <span>Transcript: {candidate.transcriptPath ? 'Yes' : 'No'}</span>
                                            <span>Photo: {candidate.professionalPhotoPath ? 'Yes' : 'No'}</span>
                                            <span>Certificates: {candidate.certificatesPath ? 'Yes' : 'No'}</span>
                                        </div>
                                        <button type="button" onClick={() => handleApprove(candidate.id)}>
                                            <UserCheck size={15} /> Approve Candidate
                                        </button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="stats-grid">
                        <article className="stat-card">
                            <h5>Total Pending</h5>
                            <strong>{filteredCandidates.length}</strong>
                            <span>Awaiting dean verification</span>
                        </article>
                        <article className="stat-card">
                            <h5>Eligible Voters</h5>
                            <strong>{turnoutMetrics.eligibleVoters.toLocaleString()}</strong>
                            <span>Configured voter pool</span>
                        </article>
                        <article className="stat-card">
                            <h5>Review Latency</h5>
                            <strong>4.2h</strong>
                            <span>Fast response target</span>
                        </article>
                    </section>
                </main>
            </div>
        </div>
    );
};

const getElectionSortTime = (election: ElectionInfo) => {
    const createdAt = election.createdAt ? new Date(election.createdAt).getTime() : Number.NaN;
    return Number.isFinite(createdAt) ? createdAt : election.id;
};

export default DeanCandidateReview;
