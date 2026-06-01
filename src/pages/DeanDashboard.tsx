import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, ShieldAlert, Users } from 'lucide-react';
import './DeanDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type LabourApplication = {
    id: number;
    studentName?: string;
    studentNumber?: string;
    department?: string;
    roleTitle?: string;
    status: string;
    submittedAt?: string;
};

type LabourLog = {
    id: number;
    hoursWorked: string;
    status: string;
};

type AucasaPerson = {
    id: number;
    fullName: string;
    role?: string;
    disciplineStatus?: string;
    studentNumber?: string;
};

const LEADERSHIP_ROLES = new Set([
    'guild_president',
    'finance',
    'minister_sport',
    'minister_evangelism',
    'minister_international_affairs',
]);

const safeList = async <T,>(url: string): Promise<T[]> => {
    try {
        const response = await fetch(url);
        const data = await response.json().catch(() => []);
        if (!response.ok) return [];
        return Array.isArray(data) ? (data as T[]) : [];
    } catch {
        return [];
    }
};

type DeanDashboardProps = {
    onNavigate?: (page: string) => void;
};

const formatDate = (value?: string) => {
    if (!value) return 'Not submitted';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not submitted';
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const DeanDashboard: React.FC<DeanDashboardProps> = ({ onNavigate }) => {
    const [pendingApplications, setPendingApplications] = useState<LabourApplication[]>([]);
    const [approvedApplications, setApprovedApplications] = useState<LabourApplication[]>([]);
    const [pendingLogs, setPendingLogs] = useState<LabourLog[]>([]);
    const [verifiedLogs, setVerifiedLogs] = useState<LabourLog[]>([]);
    const [aucasaPeople, setAucasaPeople] = useState<AucasaPerson[]>([]);
    const [peoplePage, setPeoplePage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [
                pendingApps,
                approvedApps,
                logsPending,
                logsVerified,
                people,
            ] = await Promise.all([
                safeList<LabourApplication>(`${API_BASE}/api/labour-applications?status=PENDING`),
                safeList<LabourApplication>(`${API_BASE}/api/labour-applications?status=APPROVED`),
                safeList<LabourLog>(`${API_BASE}/api/labour-daily-logs?status=PENDING_REVIEW`),
                safeList<LabourLog>(`${API_BASE}/api/labour-daily-logs?status=VERIFIED`),
                safeList<AucasaPerson>(`${API_BASE}/api/admin/users`),
            ]);

            const electedLeaders = people.filter(
                (person) => LEADERSHIP_ROLES.has(person.role?.toLowerCase() ?? '')
            );

            setPendingApplications(pendingApps);
            setApprovedApplications(approvedApps);
            setPendingLogs(logsPending);
            setVerifiedLogs(logsVerified);
            setAucasaPeople(electedLeaders);
            setIsLoading(false);
        };

        void loadData();
    }, []);

    const metrics = useMemo(() => {
        const totalApplications =
            pendingApplications.length + approvedApplications.length;
        const approvalRate =
            totalApplications === 0 ? 0 : Math.round((approvedApplications.length / totalApplications) * 100);

        const totalLogs = pendingLogs.length + verifiedLogs.length;
        const reviewCompletion =
            totalLogs === 0 ? 0 : Math.round((verifiedLogs.length / totalLogs) * 100);

        return {
            approvalRate,
            reviewCompletion,
        };
    }, [pendingApplications, approvedApplications, pendingLogs, verifiedLogs]);

    const labourPeople = useMemo(() => {
        return [...pendingApplications, ...approvedApplications]
            .sort((a, b) => new Date(b.submittedAt ?? '').getTime() - new Date(a.submittedAt ?? '').getTime())
            .slice(0, 3);
    }, [pendingApplications, approvedApplications]);

    const peoplePageSize = 3;
    const peoplePageCount = Math.max(1, Math.ceil(aucasaPeople.length / peoplePageSize));
    const visibleAucasaPeople = useMemo(() => {
        const start = peoplePage * peoplePageSize;
        return aucasaPeople.slice(start, start + peoplePageSize);
    }, [aucasaPeople, peoplePage]);

    const getPersonName = (person: AucasaPerson) => {
        return person.fullName || 'Name pending';
    };

    return (
        <div className="dean-labour-dashboard">
            <section className="dean-labour-hero">
                <div>
                    <span className="hero-kicker">Dean Console</span>
                    <h1>Student Labour Management Overview</h1>
                    <p>
                        A focused summary of labour operations: approvals, pending reviews, and candidate activity
                        for quick executive action.
                    </p>
                </div>
                <div className="hero-status-chip">
                    <BriefcaseBusiness size={18} />
                    <span>{isLoading ? 'Loading work data...' : 'Live overview'}</span>
                </div>
            </section>

            <section className="labour-kpi-grid">
                <article className="labour-kpi labour-kpi-attention">
                    <div className="kpi-topline">
                        <div className="kpi-icon">
                            <Users size={20} />
                        </div>
                        <span>Applications Pending</span>
                    </div>
                    <div className="kpi-value-row">
                        <strong>{isLoading ? '...' : pendingApplications.length}</strong>
                        <small>Queue</small>
                    </div>
                    <p>Waiting for dean action</p>
                </article>

                <article className="labour-kpi labour-kpi-success">
                    <div className="kpi-topline">
                        <div className="kpi-icon">
                            <ClipboardCheck size={20} />
                        </div>
                        <span>Approval Rate</span>
                    </div>
                    <div className="kpi-value-row">
                        <strong>{isLoading ? '...' : `${metrics.approvalRate}%`}</strong>
                        <small>Reviewed</small>
                    </div>
                    <p>Across reviewed applications</p>
                </article>

                <article className="labour-kpi labour-kpi-review">
                    <div className="kpi-topline">
                        <div className="kpi-icon">
                            <ShieldAlert size={20} />
                        </div>
                        <span>Review Completion</span>
                    </div>
                    <div className="kpi-value-row">
                        <strong>{isLoading ? '...' : `${metrics.reviewCompletion}%`}</strong>
                        <small>Logs</small>
                    </div>
                    <p>Daily logs reviewed</p>
                </article>
            </section>

            <section className="dashboard-table-grid">
                <article className="labour-people-panel">
                    <div className="labour-people-header">
                        <div>
                            <span>Student Labour</span>
                            <h2>Recent Labour Candidates</h2>
                        </div>
                        <button type="button" onClick={() => onNavigate?.('labour-mgmt')}>
                            View more
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="labour-table-wrap">
                        <table className="labour-people-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Role</th>
                                    <th>Campus</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan={5} className="labour-table-empty">Loading labour candidates...</td>
                                    </tr>
                                )}
                                {!isLoading && labourPeople.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="labour-table-empty">No labour candidates found.</td>
                                    </tr>
                                )}
                                {!isLoading && labourPeople.map((person) => (
                                    <tr key={`${person.status}-${person.id}`}>
                                        <td>
                                            <div className="student-cell">
                                                <span>{person.studentName?.slice(0, 1).toUpperCase() || 'S'}</span>
                                                <div>
                                                    <strong>{person.studentName || 'Student name pending'}</strong>
                                                    <small>{person.studentNumber || 'Student ID pending'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{person.roleTitle || 'Role pending'}</td>
                                        <td>{person.department || 'Campus pending'}</td>
                                        <td>
                                            <span className={`status-pill status-${person.status.toLowerCase()}`}>
                                                {person.status.replaceAll('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{formatDate(person.submittedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="labour-people-panel">
                    <div className="labour-people-header compact">
                        <div>
                            <span>AUCASA Leadership</span>
                            <h2>Elected Officers</h2>
                        </div>
                        <small>{aucasaPeople.length} records</small>
                    </div>

                    <div className="labour-table-wrap">
                        <table className="labour-people-table people-directory-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Discipline Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan={3} className="labour-table-empty">Loading elected officers...</td>
                                    </tr>
                                )}
                                {!isLoading && visibleAucasaPeople.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="labour-table-empty">No elected officers found.</td>
                                    </tr>
                                )}
                                {!isLoading && visibleAucasaPeople.map((person) => (
                                    <tr key={person.id}>
                                        <td>
                                            <div className="student-cell">
                                                <span>{getPersonName(person).slice(0, 1).toUpperCase()}</span>
                                                <div>
                                                    <strong>{getPersonName(person)}</strong>
                                                    <small>{person.studentNumber || `User #${person.id}`}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{person.role?.replaceAll('_', ' ') || 'Officer'}</td>
                                        <td>
                                            <span className="discipline-pill">
                                                {person.disciplineStatus?.replaceAll('_', ' ') || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="people-pagination">
                        <button
                            type="button"
                            onClick={() => setPeoplePage((page) => Math.max(0, page - 1))}
                            disabled={peoplePage === 0}
                        >
                            Previous
                        </button>
                        <span>Page {peoplePage + 1} of {peoplePageCount}</span>
                        <button
                            type="button"
                            onClick={() => setPeoplePage((page) => Math.min(peoplePageCount - 1, page + 1))}
                            disabled={peoplePage >= peoplePageCount - 1}
                        >
                            Next
                        </button>
                    </div>
                </article>
            </section>

        </div>
    );
};

export default DeanDashboard;
