import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    FolderCheck,
    Gavel,
    Megaphone,
    UserCheck,
    Vote,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import './DeanCandidateReview.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

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
    votingStart?: string;
    votingEnd?: string;
    eligibleVoters?: number;
    totalVotes?: number;
};

const DeanCandidateReview = () => {
    const [candidates, setCandidates] = useState<PendingCandidate[]>([]);
    const [elections, setElections] = useState<ElectionInfo[]>([]);
    const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedPositionFilter, setSelectedPositionFilter] = useState('ALL');
    const [sortMode, setSortMode] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
    const [isUpdatingPhase, setIsUpdatingPhase] = useState(false);
    const [isCreatingVoting, setIsCreatingVoting] = useState(false);

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
        const list = Array.isArray(data) ? data : [];
        setElections(list);
        if (!selectedElectionId && list.length > 0) {
            setSelectedElectionId(list[0].id);
        }
    };

    useEffect(() => {
        loadPending();
        void loadElections();
    }, []);

    const selectedElection = useMemo(
        () => elections.find((item) => item.id === selectedElectionId) ?? null,
        [elections, selectedElectionId]
    );
    const turnoutMetrics = useMemo(() => {
        const eligibleVoters = selectedElection?.eligibleVoters ?? 0;
        const votesCast = selectedElection?.totalVotes ?? 0;
        const remainingVotes = Math.max(eligibleVoters - votesCast, 0);
        const turnoutRate = eligibleVoters > 0 ? Math.min(100, Math.round((votesCast / eligibleVoters) * 100)) : 0;

        return {
            eligibleVoters,
            votesCast,
            remainingVotes,
            turnoutRate,
        };
    }, [selectedElection]);

    const turnoutChartData = useMemo(() => {
        if (turnoutMetrics.eligibleVoters <= 0) {
            return [
                { name: 'No voter pool configured', value: 1, color: '#d9e1f3' },
            ];
        }
        return [
            { name: 'Votes Cast', value: turnoutMetrics.votesCast, color: '#0c8f87' },
            { name: 'Remaining', value: turnoutMetrics.remainingVotes, color: '#d9e1f3' },
        ];
    }, [turnoutMetrics]);

    const phaseProgressData = useMemo(() => {
        const status = selectedElection?.status ?? 'DRAFT';
        const progressMap: Record<ElectionInfo['status'], number> = {
            DRAFT: 10,
            NOMINATION: 35,
            CAMPAIGN: 60,
            VOTING: 85,
            CLOSED: 100,
            ARCHIVED: 100,
        };
        const completed = progressMap[status];
        return [
            {
                name: status,
                completed,
                remaining: 100 - completed,
            },
        ];
    }, [selectedElection?.status]);

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
        } finally {
            setIsUpdatingPhase(false);
        }
    };

    const createVoting = async () => {
        setError('');
        setStatusMessage('');
        setIsCreatingVoting(true);
        try {
            const now = new Date();
            const addDays = (days: number) => {
                const dt = new Date(now);
                dt.setDate(dt.getDate() + days);
                return dt.toISOString();
            };

            const payload = {
                title: `AUCASA Election ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
                description: 'New election cycle created from Dean candidate review panel.',
                nominationStart: addDays(0),
                nominationEnd: addDays(3),
                campaignStart: addDays(4),
                campaignEnd: addDays(7),
                votingStart: addDays(8),
                votingEnd: addDays(10),
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
                setError(data.error ?? 'Failed to create voting.');
                return;
            }

            await loadElections();
            if (data && typeof data.id === 'number') {
                setSelectedElectionId(data.id);
            }
            setStatusMessage('New voting cycle created successfully.');
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
                                    onClick={createVoting}
                                    disabled={isCreatingVoting}
                                >
                                    {isCreatingVoting ? 'Creating...' : 'Create Voting'}
                                </button>
                            </div>
                        </div>
                        <div className="hero-controls">
                            <button type="button" onClick={() => updateElectionStatus('NOMINATION')} disabled={isUpdatingPhase}>
                                <FolderCheck size={15} /> Open Nom.
                            </button>
                            <button type="button" onClick={() => updateElectionStatus('CAMPAIGN')} disabled={isUpdatingPhase}>
                                <Megaphone size={15} /> Start Camp.
                            </button>
                            <button type="button" className="success" onClick={() => updateElectionStatus('VOTING')} disabled={isUpdatingPhase}>
                                <Vote size={15} /> Open Voting
                            </button>
                            <button type="button" className="danger" onClick={() => updateElectionStatus('CLOSED')} disabled={isUpdatingPhase}>
                                <Gavel size={15} /> Close Voting
                            </button>
                        </div>
                    </section>

                    <section className="vote-progress-panel">
                        <div className="vote-progress-header">
                            <h2>Voting Progress</h2>
                            <p>Live turnout and election phase completion for this cycle.</p>
                        </div>
                        <div className="vote-progress-grid">
                            <article className="progress-chart-card">
                                <h3>Turnout</h3>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={turnoutChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={58}
                                                outerRadius={86}
                                                paddingAngle={2}
                                                stroke="none"
                                            >
                                                {turnoutChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name) => [Number(value ?? 0).toLocaleString(), name]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="progress-highlight">
                                    <strong>{turnoutMetrics.turnoutRate}%</strong>
                                    <span>{turnoutMetrics.votesCast.toLocaleString()} of {turnoutMetrics.eligibleVoters.toLocaleString()} votes cast</span>
                                </div>
                            </article>

                            <article className="progress-chart-card">
                                <h3>Phase Completion</h3>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={phaseProgressData} layout="vertical" margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="4 4" stroke="#d9e1f2" horizontal={false} />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis type="category" dataKey="name" tick={{ fill: '#3c4f73', fontWeight: 600 }} width={95} />
                                            <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, 'Progress']} />
                                            <Bar dataKey="completed" stackId="progress" fill="#1c6dd0" radius={[8, 0, 0, 8]} />
                                            <Bar dataKey="remaining" stackId="progress" fill="#dce4f4" radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="progress-highlight">
                                    <strong>{phaseProgressData[0].completed}%</strong>
                                    <span>Election status: {selectedElection?.status ?? 'N/A'}</span>
                                </div>
                            </article>
                        </div>
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

export default DeanCandidateReview;
