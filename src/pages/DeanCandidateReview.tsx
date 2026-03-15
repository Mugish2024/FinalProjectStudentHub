import { useEffect, useState } from 'react';
import './DeanStudentList.css';

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

const DeanCandidateReview = () => {
    const [candidates, setCandidates] = useState<PendingCandidate[]>([]);
    const [error, setError] = useState('');

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

    useEffect(() => {
        loadPending();
    }, []);

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

    return (
        <div className="dean-students">
            <header className="dean-students__header">
                <div>
                    <h1>Candidate Applications</h1>
                    <p>Review and approve candidate applications before they appear to students.</p>
                </div>
            </header>

            {error && <div className="dean-students__error">{error}</div>}

            <div className="dean-students__table-wrap">
                <table className="dean-students__table">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Position</th>
                            <th>GPA / Credits</th>
                            <th>Discipline</th>
                            <th>Documents</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map((candidate) => (
                            <tr key={candidate.id}>
                                <td>
                                    <div className="dean-students__name">{candidate.studentName}</div>
                                    <div className="dean-students__badge">{candidate.studentNumber}</div>
                                </td>
                                <td>{candidate.position}</td>
                                <td>{candidate.gpa} / {candidate.credits}</td>
                                <td>{candidate.disciplineStatus}</td>
                                <td>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        Adventist: {candidate.adventistProofPath ? 'Yes' : 'No'}<br />
                                        Transcript: {candidate.transcriptPath ? 'Yes' : 'No'}<br />
                                        Photo: {candidate.professionalPhotoPath ? 'Yes' : 'No'}<br />
                                        Certificates: {candidate.certificatesPath ? 'Yes' : 'No'}
                                    </div>
                                </td>
                                <td>
                                    <button className="dean-students__refresh" onClick={() => handleApprove(candidate.id)}>
                                        Approve
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {candidates.length === 0 && (
                            <tr>
                                <td colSpan={6} className="dean-students__empty">
                                    No pending applications.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeanCandidateReview;
