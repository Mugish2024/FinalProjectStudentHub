import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BriefcaseBusiness, ClipboardCheck, Clock3, ShieldAlert, Users } from 'lucide-react';
import './DeanDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type LabourApplication = {
    id: number;
    status: string;
};

type LabourLog = {
    id: number;
    hoursWorked: string;
    status: string;
};

type AttendanceAdminRecord = {
    id: number;
    studentName?: string;
    studentNumber?: string;
    status?: string;
    verificationStatus?: string;
};

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

const DeanDashboard: React.FC = () => {
    const [pendingApplications, setPendingApplications] = useState<LabourApplication[]>([]);
    const [approvedApplications, setApprovedApplications] = useState<LabourApplication[]>([]);
    const [rejectedApplications, setRejectedApplications] = useState<LabourApplication[]>([]);
    const [pendingLogs, setPendingLogs] = useState<LabourLog[]>([]);
    const [verifiedLogs, setVerifiedLogs] = useState<LabourLog[]>([]);
    const [absentAttendanceRecords, setAbsentAttendanceRecords] = useState<AttendanceAdminRecord[]>([]);
    const [pendingDisciplineReviews, setPendingDisciplineReviews] = useState<AttendanceAdminRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [
                pendingApps,
                approvedApps,
                rejectedApps,
                logsPending,
                logsVerified,
                absentRecords,
                pendingAbsenceReviews,
            ] = await Promise.all([
                safeList<LabourApplication>(`${API_BASE}/api/labour-applications?status=PENDING`),
                safeList<LabourApplication>(`${API_BASE}/api/labour-applications?status=APPROVED`),
                safeList<LabourApplication>(`${API_BASE}/api/labour-applications?status=REJECTED`),
                safeList<LabourLog>(`${API_BASE}/api/labour-daily-logs?status=PENDING_REVIEW`),
                safeList<LabourLog>(`${API_BASE}/api/labour-daily-logs?status=VERIFIED`),
                safeList<AttendanceAdminRecord>(`${API_BASE}/api/attendance/admin/records?status=ABSENT`),
                safeList<AttendanceAdminRecord>(`${API_BASE}/api/attendance/admin/records?status=ABSENT&verificationStatus=PENDING`),
            ]);

            setPendingApplications(pendingApps);
            setApprovedApplications(approvedApps);
            setRejectedApplications(rejectedApps);
            setPendingLogs(logsPending);
            setVerifiedLogs(logsVerified);
            setAbsentAttendanceRecords(absentRecords);
            setPendingDisciplineReviews(pendingAbsenceReviews);
            setIsLoading(false);
        };

        void loadData();
    }, []);

    const metrics = useMemo(() => {
        const totalApplications =
            pendingApplications.length + approvedApplications.length + rejectedApplications.length;
        const approvalRate =
            totalApplications === 0 ? 0 : Math.round((approvedApplications.length / totalApplications) * 100);
        const rejectionRate =
            totalApplications === 0 ? 0 : Math.round((rejectedApplications.length / totalApplications) * 100);

        const totalVerifiedHours = verifiedLogs.reduce(
            (sum, log) => sum + Number(log.hoursWorked || 0),
            0
        );
        const totalLogs = pendingLogs.length + verifiedLogs.length;
        const reviewCompletion =
            totalLogs === 0 ? 0 : Math.round((verifiedLogs.length / totalLogs) * 100);

        const labourHealthScore = Math.round(
            Math.max(0, Math.min(100, approvalRate * 0.45 + reviewCompletion * 0.55 - rejectionRate * 0.2))
        );

        return {
            totalApplications,
            approvalRate,
            rejectionRate,
            totalVerifiedHours: totalVerifiedHours.toFixed(1),
            totalLogs,
            reviewCompletion,
            labourHealthScore,
        };
    }, [pendingApplications, approvedApplications, rejectedApplications, pendingLogs, verifiedLogs]);

    return (
        <div className="dean-labour-dashboard">
            <section className="dean-labour-hero">
                <div>
                    <span className="hero-kicker">Dean Console</span>
                    <h1>Student Labour Management Overview</h1>
                    <p>
                        A focused summary of labour operations: approvals, pending reviews, verified hours, and
                        compliance health for quick executive action.
                    </p>
                </div>
                <div className="hero-status-chip">
                    <BriefcaseBusiness size={18} />
                    <span>{isLoading ? 'Loading labour data...' : 'Live labour analytics'}</span>
                </div>
            </section>

            <section className="labour-kpi-grid">
                <article className="labour-kpi">
                    <div className="kpi-head">
                        <Users size={18} />
                        <span>Applications Pending</span>
                    </div>
                    <strong>{isLoading ? '...' : pendingApplications.length}</strong>
                    <p>Waiting for dean action</p>
                </article>

                <article className="labour-kpi">
                    <div className="kpi-head">
                        <ClipboardCheck size={18} />
                        <span>Approval Rate</span>
                    </div>
                    <strong>{isLoading ? '...' : `${metrics.approvalRate}%`}</strong>
                    <p>Across reviewed applications</p>
                </article>

                <article className="labour-kpi">
                    <div className="kpi-head">
                        <Clock3 size={18} />
                        <span>Verified Labour Hours</span>
                    </div>
                    <strong>{isLoading ? '...' : metrics.totalVerifiedHours}</strong>
                    <p>Total verified work output</p>
                </article>

                <article className="labour-kpi">
                    <div className="kpi-head">
                        <ShieldAlert size={18} />
                        <span>Review Completion</span>
                    </div>
                    <strong>{isLoading ? '...' : `${metrics.reviewCompletion}%`}</strong>
                    <p>Daily logs reviewed</p>
                </article>
            </section>

            <section className="labour-summary-row">
                <article className="summary-card">
                    <h3>Labour Health Score</h3>
                    <div className="score-row">
                        <strong>{isLoading ? '...' : `${metrics.labourHealthScore}/100`}</strong>
                        <span>Overall programme stability</span>
                    </div>
                    <div className="score-bar">
                        <div style={{ width: `${isLoading ? 0 : metrics.labourHealthScore}%` }} />
                    </div>
                </article>

                <article className="summary-card">
                    <h3>Operational Snapshot</h3>
                    <div className="snap-grid">
                        <div>
                            <span>Total Applications</span>
                            <strong>{isLoading ? '...' : metrics.totalApplications}</strong>
                        </div>
                        <div>
                            <span>Rejected</span>
                            <strong>{isLoading ? '...' : `${metrics.rejectionRate}%`}</strong>
                        </div>
                        <div>
                            <span>Pending Logs</span>
                            <strong>{isLoading ? '...' : pendingLogs.length}</strong>
                        </div>
                        <div>
                            <span>Total Logs</span>
                            <strong>{isLoading ? '...' : metrics.totalLogs}</strong>
                        </div>
                    </div>
                </article>
            </section>

            <section className="discipline-review-row">
                <article className="summary-card attention-card">
                    <h3><AlertTriangle size={16} /> Discipline Review Queue</h3>
                    <div className="score-row">
                        <strong>{isLoading ? '...' : pendingDisciplineReviews.length}</strong>
                        <span>Cases waiting dean verification</span>
                    </div>
                    <p className="discipline-note">
                        Review and validate high-priority discipline cases before final status updates are applied.
                    </p>
                    <div className="quick-cases">
                        {(isLoading ? [] : pendingDisciplineReviews.slice(0, 3)).map((item) => (
                            <span key={item.id}>
                                {item.studentNumber || item.studentName || `Record #${item.id}`}
                            </span>
                        ))}
                        {!isLoading && pendingDisciplineReviews.length === 0 && (
                            <span>No pending discipline attendance cases.</span>
                        )}
                    </div>
                </article>

                <article className="summary-card">
                    <h3>Discipline Oversight Snapshot</h3>
                    <div className="snap-grid">
                        <div>
                            <span>Total Discipline Inputs</span>
                            <strong>{isLoading ? '...' : absentAttendanceRecords.length}</strong>
                        </div>
                        <div>
                            <span>Pending Review</span>
                            <strong>{isLoading ? '...' : pendingDisciplineReviews.length}</strong>
                        </div>
                        <div>
                            <span>Reviewed Cases</span>
                            <strong>
                                {isLoading
                                    ? '...'
                                    : Math.max(0, absentAttendanceRecords.length - pendingDisciplineReviews.length)}
                            </strong>
                        </div>
                        <div>
                            <span>Dean Action Needed</span>
                            <strong>{isLoading ? '...' : pendingDisciplineReviews.length > 0 ? 'YES' : 'NO'}</strong>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
};

export default DeanDashboard;
