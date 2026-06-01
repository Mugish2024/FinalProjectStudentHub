import React, { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import {
    ClipboardList,
    Landmark,
    UserCheck,
    Wallet,
    IdCard,
    Upload,
    Camera,
    CheckCircle,
    X,
    Calendar,
    Eye,
    BellRing,
    QrCode,
    Vote as VoteIcon,
} from 'lucide-react';
import './StudentDashboard.css';
import { validateStudentCardPhoto } from '../utils/studentCardRenderer';

interface StudentDashboardProps {
    navigateTo: (page: string) => void;
    studentId?: number | null;
    fullName: string;
    studentNumber: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
    gpa: number;
    semester?: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
    navigateTo,
    studentId,
    fullName,
    studentNumber,
    faculty,
    department,
    program,
    credits,
    gpa,
}) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';
    type CampusEvent = {
        id: number;
        title: string;
        organizer: string;
        status: string;
        eventDate: string;
        eventTime?: string;
        location?: string;
        description: string;
        imagePath?: string;
    };
    type FinanceSummary = {
        totalCollected?: number;
        totalApproved?: number;
        totalSpent?: number;
        remainingBalance?: number;
    };
    type StudentPaymentRecord = {
        id: number;
        status?: string;
        amount?: number;
    };
    type StudentCardApplication = {
        id: number;
        status: 'PENDING' | 'PRINTED';
        appliedAt?: string;
        printedAt?: string;
        replacementRequest?: boolean;
        financeReceiptUploaded?: boolean;
        receiptUploadedAt?: string;
        financeReceiptStatus?: 'NOT_REQUIRED' | 'WAITING_UPLOAD' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
        financeReceiptMessage?: string;
        financeReceiptReviewedAt?: string;
    };
    type ActionReminder = {
        id: string;
        type: 'attendance' | 'vote';
        title: string;
        message: string;
        actionLabel: string;
        page: string;
    };
    const [showCardModal, setShowCardModal] = useState(false);
    const [showCardStatusModal, setShowCardStatusModal] = useState(false);
    const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
    const [passportPhotoConfirmed, setPassportPhotoConfirmed] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [financeReceipt, setFinanceReceipt] = useState<File | null>(null);
    const [cardError, setCardError] = useState('');
    const [cardSuccess, setCardSuccess] = useState('');
    const [cardPhotoNote, setCardPhotoNote] = useState('');
    const [isValidatingCardPhoto, setIsValidatingCardPhoto] = useState(false);
    const [isSubmittingCard, setIsSubmittingCard] = useState(false);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [cardApplication, setCardApplication] = useState<StudentCardApplication | null>(null);
    const [guildNotice, setGuildNotice] = useState<CampusEvent | null>(null);
    const [guildNotices, setGuildNotices] = useState<CampusEvent[]>([]);
    const [noticePage, setNoticePage] = useState(0);
    const [isLoadingNotice, setIsLoadingNotice] = useState(false);
    const [showNoticeDetails, setShowNoticeDetails] = useState(false);
    const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
    const [studentPayments, setStudentPayments] = useState<StudentPaymentRecord[]>([]);
    const [actionReminders, setActionReminders] = useState<ActionReminder[]>([]);
    const studentCardVideoRef = useRef<HTMLVideoElement | null>(null);
    const studentCardCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const studentCardCameraStreamRef = useRef<MediaStream | null>(null);

    const handleNavigate = (page: string) => {
        if (navigateTo) {
            navigateTo(page);
        }
    };

    const paidPaymentStatuses = useMemo(() => new Set(['COMPLETED', 'VERIFIED', 'PAID']), []);

    const studentBalanceOwed = useMemo(
        () => studentPayments.reduce((total, item) => (
            paidPaymentStatuses.has(String(item.status ?? '').toUpperCase()) ? total : total + Number(item.amount ?? 0)
        ), 0),
        [studentPayments, paidPaymentStatuses]
    );

    const studentFinanceStanding = studentBalanceOwed > 0 ? 'In debt' : 'Clear';

    const stopStudentCardCamera = () => {
        studentCardCameraStreamRef.current?.getTracks().forEach((track) => track.stop());
        studentCardCameraStreamRef.current = null;
        if (studentCardVideoRef.current) {
            studentCardVideoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const openStudentCardCamera = () => {
        setCardError('');
        setCardPhotoNote('');
        setIsCameraOpen(true);
    };

    const prepareStudentCardPhoto = async (file: File) => {
        setIsValidatingCardPhoto(true);
        setCardError('');
        setCardPhotoNote('');
        try {
            await validateStudentCardPhoto(file);
            setPassportPhoto(file);
            setPassportPhotoConfirmed(false);
            setCardPhotoNote('Photo selected. Please confirm it before sending your application.');
            return true;
        } catch (error) {
            setPassportPhoto(null);
            setPassportPhotoConfirmed(false);
            setCardError(error instanceof Error ? error.message : 'Photo validation failed. Please try another photo.');
            return false;
        } finally {
            setIsValidatingCardPhoto(false);
        }
    };

    const captureStudentCardPhoto = async () => {
        const video = studentCardVideoRef.current;
        const canvas = studentCardCanvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) {
            setCardError('Camera is still loading. Please try again in a moment.');
            return;
        }

        const passportWidth = 900;
        const passportHeight = 1200;
        canvas.width = passportWidth;
        canvas.height = passportHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setCardError('Unable to capture photo. Please try upload photo instead.');
            return;
        }

        const sourceRatio = video.videoWidth / video.videoHeight;
        const passportRatio = passportWidth / passportHeight;
        let sourceWidth = video.videoWidth;
        let sourceHeight = video.videoHeight;
        let sourceX = 0;
        let sourceY = 0;

        if (sourceRatio > passportRatio) {
            sourceWidth = video.videoHeight * passportRatio;
            sourceX = (video.videoWidth - sourceWidth) / 2;
        } else {
            sourceHeight = video.videoWidth / passportRatio;
            sourceY = (video.videoHeight - sourceHeight) / 2;
        }

        context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, passportWidth, passportHeight);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) {
            setCardError('Unable to capture photo. Please try again.');
            return;
        }
        const photoFile = new File([blob], `student-card-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const accepted = await prepareStudentCardPhoto(photoFile);
        if (accepted) {
            stopStudentCardCamera();
        }
    };

    useEffect(() => {
        if (!isCameraOpen) {
            return;
        }

        let cancelled = false;
        const startCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCardError('Camera is not available on this device. Please upload a photo instead.');
                setIsCameraOpen(false);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                studentCardCameraStreamRef.current = stream;
                if (studentCardVideoRef.current) {
                    studentCardVideoRef.current.srcObject = stream;
                    await studentCardVideoRef.current.play().catch(() => undefined);
                }
            } catch {
                setCardError('Unable to open camera. Please allow camera access or upload a photo.');
                setIsCameraOpen(false);
            }
        };

        void startCamera();
        return () => {
            cancelled = true;
        };
    }, [isCameraOpen]);

    useEffect(() => () => {
        studentCardCameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadGuildNotice = async () => {
            setIsLoadingNotice(true);
            try {
                const response = await fetch(`${API_BASE}/api/events`);
                const data = await response.json().catch(() => []);
                const events = Array.isArray(data) ? (data as CampusEvent[]) : [];
                const now = new Date();
                const upcoming = events
                    .filter((event) => {
                        if (!event?.eventDate) return false;
                        const eventDate = new Date(event.eventDate);
                        const isUpcoming = eventDate >= new Date(now.toDateString());
                        const statusOk = !event.status || event.status.toUpperCase() === 'UPCOMING';
                        return isUpcoming && statusOk;
                    })
                    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

                const guildEvent = upcoming.find((event) => {
                    const organizer = (event.organizer ?? '').toLowerCase();
                    const title = (event.title ?? '').toLowerCase();
                    return organizer.includes('guild') || organizer.includes('aucasa') || title.includes('guild') || title.includes('aucasa');
                });

                if (!cancelled) {
                    const ordered = guildEvent ? [guildEvent, ...upcoming.filter((e) => e.id !== guildEvent.id)] : upcoming;
                    setGuildNotices(ordered.slice(0, 6));
                    setGuildNotice(ordered[0] ?? null);
                    setNoticePage(0);
                }
            } catch {
                if (!cancelled) {
                    setGuildNotices([]);
                    setGuildNotice(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingNotice(false);
                }
            }
        };

        void loadGuildNotice();
        return () => {
            cancelled = true;
        };
    }, [API_BASE]);

    useEffect(() => {
        let cancelled = false;
        const loadFinanceSummary = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/finance/transparency/summary`);
                const data = await response.json().catch(() => null);
                if (!cancelled && data && typeof data === 'object') {
                    setFinanceSummary(data as FinanceSummary);
                }
            } catch {
                if (!cancelled) {
                    setFinanceSummary(null);
                }
            }
        };
        void loadFinanceSummary();
        return () => {
            cancelled = true;
        };
    }, [API_BASE]);

    useEffect(() => {
        let cancelled = false;
        const loadStudentFinanceStanding = async () => {
            if (!studentId) {
                setStudentPayments([]);
                return;
            }
            try {
                await fetch(`${API_BASE}/api/payments/obligations/student`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId }),
                }).catch(() => null);
                const response = await fetch(`${API_BASE}/api/payments/history/student/${studentId}`);
                const data = await response.json().catch(() => []);
                if (!cancelled) {
                    setStudentPayments(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) {
                    setStudentPayments([]);
                }
            }
        };
        void loadStudentFinanceStanding();
        return () => {
            cancelled = true;
        };
    }, [API_BASE, studentId]);

    const formatDateTimeRange = (start?: string, end?: string) => {
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return '';
        }
        return `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`;
    };

    useEffect(() => {
        let cancelled = false;
        const loadActionReminders = async () => {
            const reminders: ActionReminder[] = [];

            try {
                const attendanceResponse = await fetch(`${API_BASE}/api/attendance/sessions?active=true`);
                const attendanceData = await attendanceResponse.json().catch(() => []);
                const activeSession = Array.isArray(attendanceData) ? attendanceData[0] : null;
                if (attendanceResponse.ok && activeSession?.id && studentNumber) {
                    const statusResponse = await fetch(
                        `${API_BASE}/api/attendance/sessions/${activeSession.id}/student-status?studentNumber=${encodeURIComponent(studentNumber)}`
                    );
                    const statusData = await statusResponse.json().catch(() => ({}));
                    if (!statusResponse.ok || !statusData.checkedIn) {
                        const range = formatDateTimeRange(activeSession.startsAt, activeSession.endsAt);
                        reminders.push({
                            id: `attendance-${activeSession.id}`,
                            type: 'attendance',
                            title: 'Attendance is open',
                            message: `${activeSession.title ?? 'Current attendance'} is active${range ? ` from ${range}` : ''}. Complete your check-in now.`,
                            actionLabel: 'Check In',
                            page: 'attendance',
                        });
                    }
                }
            } catch {
                // Leave reminder empty if the service is temporarily unavailable.
            }

            try {
                const electionResponse = await fetch(`${API_BASE}/api/elections/active`);
                const electionData = await electionResponse.json().catch(() => null);
                const now = new Date();
                const start = electionData?.votingStart ? new Date(electionData.votingStart) : null;
                const end = electionData?.votingEnd ? new Date(electionData.votingEnd) : null;
                const votingWindowOpen = (!start || now >= start) && (!end || now <= end);
                if (electionResponse.ok && electionData?.id && electionData.status === 'VOTING' && votingWindowOpen && studentNumber) {
                    const statusResponse = await fetch(
                        `${API_BASE}/api/elections/votes/status?electionId=${electionData.id}&studentNumber=${encodeURIComponent(studentNumber)}`
                    );
                    const statusData = await statusResponse.json().catch(() => ({}));
                    if (!statusResponse.ok || !statusData.voted) {
                        const range = formatDateTimeRange(electionData.votingStart, electionData.votingEnd);
                        reminders.push({
                            id: `vote-${electionData.id}`,
                            type: 'vote',
                            title: 'Voting is open',
                            message: `${electionData.title ?? 'Student election'} is open${range ? ` from ${range}` : ''}. Please vote now.`,
                            actionLabel: 'Vote Now',
                            page: 'elections',
                        });
                    }
                }
            } catch {
                // Leave reminder empty if the service is temporarily unavailable.
            }

            if (!cancelled) {
                setActionReminders(reminders);
            }
        };

        void loadActionReminders();
        const timer = window.setInterval(loadActionReminders, 30000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [API_BASE, studentNumber]);

    const loadStudentCardApplication = async () => {
        if (!studentNumber) return;
        try {
            const response = await fetch(`${API_BASE}/api/student-cards/student/${encodeURIComponent(studentNumber)}`);
            const data = await response.json().catch(() => null);
            if (response.ok && data) {
                setCardApplication(data as StudentCardApplication);
            } else if (response.ok) {
                setCardApplication(null);
            }
        } catch {
            setCardApplication(null);
        }
    };

    useEffect(() => {
        void loadStudentCardApplication();
    }, [studentNumber, API_BASE]);

    const formatCurrency = (value?: number) => {
        const amount = Number(value ?? 0);
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            maximumFractionDigits: 0,
        }).format(Number.isFinite(amount) ? amount : 0);
    };

    const formatEventDate = (value?: string) => {
        if (!value) return 'Date TBA';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatShortDate = (value?: string) => {
        if (!value) return '-';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const noticeHighlights = useMemo(() => {
        if (!guildNotice?.description) return [];
        return guildNotice.description
            .split(/[.!?]\s+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 3);
    }, [guildNotice]);

    const noticesPerPage = 2;
    const totalNoticePages = Math.max(1, Math.ceil(guildNotices.length / noticesPerPage));
    const pagedNotices = useMemo(() => {
        const start = noticePage * noticesPerPage;
        return guildNotices.slice(start, start + noticesPerPage);
    }, [guildNotices, noticePage]);

    const completionPercent = Math.min(100, Math.round((credits / 120) * 100));
    const financeClearance = 82;
    const cardLevel = 'Undergraduate';
    const normalizedGpa = Number.isFinite(gpa) ? gpa : 0;

    const submitStudentCardApplication = async () => {
        setCardError('');
        setCardSuccess('');
        if (!passportPhoto) {
            setCardError('Please upload a passport photo first.');
            return;
        }
        if (!passportPhotoConfirmed) {
            setCardError('Please confirm that the selected photo is okay before applying.');
            return;
        }

        setIsSubmittingCard(true);
        try {
            await validateStudentCardPhoto(passportPhoto);
            const form = new FormData();
            form.append('studentNumber', studentNumber);
            form.append('photo', passportPhoto);

            const response = await fetch(`${API_BASE}/api/student-cards/apply`, {
                method: 'POST',
                body: form,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to apply for student card.');
            }

            setCardApplication(data as StudentCardApplication);
            setCardSuccess('Application sent successfully. The card office received your photo and will update this status as they work on it.');
            setShowCardModal(false);
            setShowCardStatusModal(true);
            setPassportPhoto(null);
            setPassportPhotoConfirmed(false);
        } catch (error) {
            setCardError(error instanceof Error ? error.message : 'Failed to apply for student card.');
        } finally {
            setIsSubmittingCard(false);
        }
    };

    const uploadFinanceReceipt = async () => {
        setCardError('');
        setCardSuccess('');
        if (!cardApplication) {
            setCardError('Apply for a student card first.');
            return;
        }
        if (!financeReceipt) {
            setCardError('Please choose the finance office receipt first.');
            return;
        }

        setIsUploadingReceipt(true);
        try {
            const form = new FormData();
            form.append('studentNumber', studentNumber);
            form.append('receipt', financeReceipt);
            const response = await fetch(`${API_BASE}/api/student-cards/${cardApplication.id}/finance-receipt`, {
                method: 'POST',
                body: form,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to upload finance receipt.');
            }
            setCardApplication(data as StudentCardApplication);
            setFinanceReceipt(null);
            setCardSuccess('Finance receipt uploaded successfully. The card manager can now view it and approve or reject your card request.');
        } catch (error) {
            setCardError(error instanceof Error ? error.message : 'Failed to upload finance receipt.');
        } finally {
            setIsUploadingReceipt(false);
        }
    };

    void financeClearance;

    return (
        <div className="student-dashboard sd-page">

            {/* Page Header Bar */}
            <header className="sd-page-bar">
                <div className="sd-page-intro">
                    <span>Student Dashboard</span>
                    <h1>{fullName || 'Student User'}</h1>
                    <p>{department} - {program} Program</p>
                </div>
                <div className="sd-header-right">
                    <span className="sd-semester-badge">Active Semester</span>
                    <div className="sd-reg-chip">
                        <small>Registration ID</small>
                        <strong>{studentNumber}</strong>
                    </div>
                </div>
            </header>

            {actionReminders.length > 0 && (
                <section className="sd-action-reminder" aria-label="Urgent activities to complete">
                    <div className="sd-action-reminder-pulse">
                        <BellRing size={20} />
                    </div>
                    <div className="sd-action-reminder-list">
                        {actionReminders.map((reminder) => (
                            <article key={reminder.id} className={`sd-action-reminder-item ${reminder.type}`}>
                                <div className="sd-action-reminder-icon">
                                    {reminder.type === 'attendance' ? <QrCode size={18} /> : <VoteIcon size={18} />}
                                </div>
                                <div>
                                    <h2>{reminder.title}</h2>
                                    <p>{reminder.message}</p>
                                </div>
                                <button type="button" onClick={() => handleNavigate(reminder.page)}>
                                    {reminder.actionLabel}
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="sd-stat-cards" aria-label="Student academic summary">
                <article className="sd-stat-card">
                    <span>Current GPA</span>
                    <strong>{normalizedGpa.toFixed(2)}</strong>
                    <small>Top faculty standing</small>
                </article>
                <article className="sd-stat-card">
                    <span>Credits Completed</span>
                    <strong>{credits} <em>/ 120</em></strong>
                    <small>Required credits</small>
                </article>
                <article className="sd-stat-card sd-stat-card--teal">
                    <span>Attendance Rate</span>
                    <strong>94.5%</strong>
                    <small>This semester</small>
                </article>
                <article className="sd-stat-card sd-stat-card--gold">
                    <span>Finance Standing</span>
                    <strong>{formatCurrency(studentBalanceOwed)}</strong>
                    <small>{studentFinanceStanding === 'Clear' ? 'Balance clear' : 'Outstanding balance'}</small>
                </article>
            </section>

            {/* 2. Degree Progress + Quick Actions */}
            <div className="sd-two-col">

                <article className="sd-panel">
                    <div className="sd-panel-head">
                        <div>
                            <h2>Degree Progress</h2>
                            <p>Track your academic milestones</p>
                        </div>
                    </div>
                    <div className="sd-progress-line-card" aria-label="Degree progress line diagram">
                        <div className="sd-line-chart-head">
                            <div>
                                <span>Credits Progress</span>
                                <strong>{credits} of 120 credits completed</strong>
                            </div>
                            <em>{completionPercent}%</em>
                        </div>
                        <div className="sd-line-chart">
                            <span className="sd-axis-label sd-axis-label--top">100</span>
                            <span className="sd-axis-label sd-axis-label--mid">50</span>
                            <span className="sd-axis-label sd-axis-label--bottom">0</span>
                            <svg viewBox="0 0 360 190" role="img" aria-label={`Degree Completion ${completionPercent} percent and Financial Clearance ${financeClearance} percent`}>
                                <line x1="58" y1="22" x2="332" y2="22" className="sd-grid-line" />
                                <line x1="58" y1="96" x2="332" y2="96" className="sd-grid-line" />
                                <line x1="58" y1="168" x2="332" y2="168" className="sd-grid-line" />
                                <polygon
                                    className="sd-line-area"
                                    points={`58,${168 - completionPercent * 1.46} 332,${168 - financeClearance * 1.46} 332,168 58,168`}
                                />
                                <line
                                    x1="58"
                                    y1={168 - completionPercent * 1.46}
                                    x2="332"
                                    y2={168 - financeClearance * 1.46}
                                    className="sd-main-line"
                                />
                                <circle cx="58" cy={168 - completionPercent * 1.46} r="7" className="sd-line-point" />
                                <circle cx="332" cy={168 - financeClearance * 1.46} r="7" className="sd-line-point" />
                                <text x="58" y={Math.max(18, 158 - completionPercent * 1.46)} className="sd-point-value" textAnchor="middle">{completionPercent}%</text>
                                <text x="332" y={Math.max(18, 158 - financeClearance * 1.46)} className="sd-point-value" textAnchor="middle">{financeClearance}%</text>
                            </svg>
                            <div className="sd-line-chart-labels">
                                <span>Degree Completion</span>
                                <span>Financial Clearance</span>
                            </div>
                        </div>
                        <div className="sd-chart-summary">
                            <div>
                                <span>Degree Completion</span>
                                <strong>{completionPercent}%</strong>
                                <small>{credits} of 120 credits completed</small>
                            </div>
                            <div>
                                <span>Financial Clearance</span>
                                <strong>{financeClearance}%</strong>
                                <small>Balance pending for graduation eligibility</small>
                            </div>
                        </div>
                    </div>
                    <div className="advisory-card">
                        <small>Advisory Alert</small>
                        <p>Your internship documentation is due soon. Please visit the service office.</p>
                    </div>
                </article>

                <article className="sd-panel">
                    <div className="sd-panel-head">
                        <div>
                            <h2>Quick Actions</h2>
                            <p>Shortcuts to key services</p>
                        </div>
                    </div>
                    <div className="action-list">
                        <button className="action-btn" onClick={() => setShowCardModal(true)}>
                            <IdCard size={16} />
                            <span>Apply Student Card</span>
                        </button>
                        <button className="action-btn" onClick={() => { void loadStudentCardApplication(); setShowCardStatusModal(true); }}>
                            <Eye size={16} />
                            <span>View Card Status</span>
                        </button>
                        <button className="action-btn" onClick={() => handleNavigate('payments')}>
                            <Wallet size={16} />
                            <span>Open Payments</span>
                        </button>
                        <button className="action-btn" onClick={() => handleNavigate('attendance')}>
                            <UserCheck size={16} />
                            <span>View Attendance</span>
                        </button>
                        <button className="action-btn" onClick={() => handleNavigate('events')}>
                            <Calendar size={16} />
                            <span>Campus Events</span>
                        </button>
                        <button className="action-btn" onClick={() => handleNavigate('discipline')}>
                            <ClipboardList size={16} />
                            <span>Discipline Record</span>
                        </button>
                    </div>
                </article>

            </div>

            {/* 3. Service Hub Panel */}
            <article className="sd-panel">
                <div className="sd-panel-head">
                    <div>
                        <h2>Service Hub</h2>
                        <p>Campus services and resources</p>
                    </div>
                </div>
                <div className="service-cards">
                    <button className="service-tile" onClick={() => handleNavigate('attendance')}>
                        <div className="tile-icon cyan"><UserCheck size={18} /></div>
                        <h3>Attendance</h3>
                        <p>94.5% overall attendance across enrolled courses this term.</p>
                    </button>
                    <button className="service-tile" onClick={() => handleNavigate('discipline')}>
                        <div className="tile-icon lavender"><ClipboardList size={18} /></div>
                        <h3>Discipline</h3>
                        <p>Clear record. No outstanding violations or administrative holds.</p>
                    </button>
                    <article className="service-tile service-tile-balance">
                        <div className="tile-icon peach"><Landmark size={18} /></div>
                        <h3>AUCASA Balance</h3>
                        <strong>{formatCurrency(financeSummary?.remainingBalance)}</strong>
                        <p>Association-wide remaining balance based on finance transparency.</p>
                    </article>
                    <button className="service-tile" onClick={() => handleNavigate('aucasa-plan')}>
                        <div className="tile-icon cyan"><ClipboardList size={18} /></div>
                        <h3>AUCASA Plans</h3>
                        <p>View current AUCASA projects, archived achievements, and rate your satisfaction.</p>
                    </button>
                </div>
            </article>

            {/* 4. Guild Notice Board Panel */}
            <article className="sd-panel">
                <div className="sd-panel-head">
                    <div>
                        <h2>Guild Notice Board</h2>
                        <p>Upcoming events and announcements</p>
                    </div>
                </div>
                {isLoadingNotice && (
                    <div className="notice-empty">Loading latest guild notices...</div>
                )}
                {!isLoadingNotice && guildNotices.length === 0 && (
                    <div className="notice-empty">No upcoming guild notices. The Guild President can post from the Events module.</div>
                )}
                {!isLoadingNotice && guildNotices.length > 0 && (
                    <>
                        <div className="guild-notice-grid">
                            {pagedNotices.map((notice) => (
                                <article
                                    key={notice.id}
                                    className="guild-notice-card clickable"
                                    onClick={() => { setGuildNotice(notice); setShowNoticeDetails(true); }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    {notice.imagePath && (
                                        <div className="guild-notice-image">
                                            <img src={`${API_BASE}/api/events/${notice.id}/image`} alt={notice.title} />
                                        </div>
                                    )}
                                    <div className="guild-notice-badge">UPCOMING ACTIVITY</div>
                                    <strong>{notice.title}</strong>
                                    <small>{formatEventDate(notice.eventDate)}</small>
                                </article>
                            ))}
                        </div>
                        {guildNotices.length > noticesPerPage && (
                            <div className="notice-pagination">
                                <button type="button" onClick={() => setNoticePage((prev) => Math.max(0, prev - 1))} disabled={noticePage === 0}>
                                    Previous
                                </button>
                                <span>{noticePage + 1} / {totalNoticePages}</span>
                                <button type="button" onClick={() => setNoticePage((prev) => Math.min(totalNoticePages - 1, prev + 1))} disabled={noticePage >= totalNoticePages - 1}>
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </article>

            {/* Student Card Modal */}
            {showCardModal && (
                <div className="student-card-modal-overlay">
                    <div className="student-card-modal">
                        <div className="student-card-modal-head">
                            <h3>Apply Student Card</h3>
                            <button
                                type="button"
                                className="student-card-close"
                                onClick={() => { stopStudentCardCamera(); setShowCardModal(false); setCardError(''); }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="student-card-details">
                            <div><strong>Level:</strong> {cardLevel}</div>
                            <div><strong>Student Name:</strong> {fullName}</div>
                            <div><strong>Student ID:</strong> {studentNumber}</div>
                            <div><strong>Faculty:</strong> {faculty}</div>
                            <div><strong>Department:</strong> {department}</div>
                        </div>
                        <div className="student-card-photo-actions">
                            <label className="student-card-upload student-card-photo-option">
                                <Upload size={16} />
                                <span>Upload photo</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        if (file) {
                                            void prepareStudentCardPhoto(file);
                                        } else {
                                            setPassportPhoto(null);
                                            setPassportPhotoConfirmed(false);
                                            setCardError('');
                                            setCardPhotoNote('');
                                        }
                                    }}
                                />
                            </label>
                            <button
                                type="button"
                                className="student-card-upload student-card-photo-option"
                                onClick={openStudentCardCamera}
                            >
                                <Camera size={16} />
                                <span>Take picture</span>
                            </button>
                        </div>
                        {isCameraOpen && (
                            <div className="student-card-camera-panel">
                                <video ref={studentCardVideoRef} playsInline muted />
                                <div className="student-card-camera-guide">
                                    Capture your photo, then confirm it before sending your application.
                                </div>
                                <canvas ref={studentCardCanvasRef} aria-hidden="true" />
                                <div className="student-card-camera-actions">
                                    <button type="button" onClick={() => void captureStudentCardPhoto()} disabled={isValidatingCardPhoto}>
                                        <Camera size={15} />
                                        {isValidatingCardPhoto ? 'Checking...' : 'Capture Photo'}
                                    </button>
                                    <button type="button" onClick={stopStudentCardCamera} disabled={isValidatingCardPhoto}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        {passportPhoto && (
                            <div className="student-card-selected-photo">
                                <span>{passportPhoto.name}</span>
                                <button
                                    type="button"
                                    className={passportPhotoConfirmed ? 'photo-confirmed' : ''}
                                    onClick={() => {
                                        setPassportPhotoConfirmed(true);
                                        setCardError('');
                                    }}
                                >
                                    <CheckCircle size={15} />
                                    {passportPhotoConfirmed ? 'Photo is okay' : 'This photo is okay'}
                                </button>
                            </div>
                        )}
                        <div className="passport-guidelines">
                            <strong>Passport Photo Requirements</strong>
                            <p>Choose the photo you want the card office to use on your student card.</p>
                        </div>
                        {cardPhotoNote && <p className="student-card-photo-note">{cardPhotoNote}</p>}
                        {cardError && <p className="student-card-error">{cardError}</p>}
                        <button
                            type="button"
                            className="student-card-generate"
                            onClick={() => void submitStudentCardApplication()}
                            disabled={isSubmittingCard || isValidatingCardPhoto}
                        >
                            {isSubmittingCard ? 'Submitting...' : 'Apply Now'}
                        </button>
                    </div>
                </div>
            )}

            {/* Student Card Status Modal */}
            {showCardStatusModal && (
                <div className="student-card-modal-overlay">
                    <div className="student-card-modal student-card-status-modal">
                        <div className="student-card-modal-head">
                            <h3>Student Card Status</h3>
                            <button
                                type="button"
                                className="student-card-close"
                                onClick={() => { setShowCardStatusModal(false); setCardError(''); setCardSuccess(''); }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {!cardApplication && (
                            <div className="student-card-empty-status">
                                No card request yet. Click Apply Student Card to send your photo to the card office.
                            </div>
                        )}
                        {cardApplication && (
                            <>
                                <div className={`student-card-progress-note ${cardSuccess ? 'student-card-progress-note--success' : ''}`}>
                                    <strong>{cardSuccess || 'Your student card application is active.'}</strong>
                                    <span>Check the highlighted step below to follow the progress.</span>
                                </div>
                                <div className="student-card-status-table-wrap">
                                    <table className="student-card-status-table">
                                        <thead>
                                            <tr>
                                                <th>Received</th>
                                                <th>Under Review</th>
                                                <th>Decision</th>
                                                <th>Finance Approval</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="student-card-progress-cell student-card-progress-cell--done">
                                                    <strong>Received</strong>
                                                    <span>{formatShortDate(cardApplication.appliedAt)}</span>
                                                </td>
                                                <td className={`student-card-progress-cell ${cardApplication.status === 'PENDING' ? 'student-card-progress-cell--active' : 'student-card-progress-cell--done'}`}>
                                                    <strong>{cardApplication.status === 'PENDING' ? 'In review' : 'Completed'}</strong>
                                                    <span>{cardApplication.status === 'PENDING' ? 'Card office is checking your request.' : 'Card office finished printing.'}</span>
                                                </td>
                                                <td className={`student-card-progress-cell ${cardApplication.status === 'PRINTED' ? 'student-card-progress-cell--active' : ''}`}>
                                                    <strong className={cardApplication.status === 'PRINTED' ? 'printed' : ''}>
                                                        {cardApplication.status === 'PRINTED' ? 'Printed' : 'Not printed yet'}
                                                    </strong>
                                                    <span>{cardApplication.status === 'PRINTED' ? `Printed ${formatShortDate(cardApplication.printedAt)}` : 'Wait for the card manager decision.'}</span>
                                                </td>
                                                <td className={`student-card-progress-cell ${cardApplication.replacementRequest && cardApplication.financeReceiptStatus !== 'APPROVED' ? 'student-card-progress-cell--active' : 'student-card-progress-cell--done'}`}>
                                                    <strong>
                                                        {!cardApplication.replacementRequest
                                                            ? 'Not required'
                                                            : cardApplication.financeReceiptStatus === 'APPROVED'
                                                            ? 'Receipt approved'
                                                            : cardApplication.financeReceiptStatus === 'REJECTED'
                                                            ? 'Receipt rejected'
                                                            : cardApplication.financeReceiptUploaded
                                                            ? 'Under review'
                                                            : 'Upload receipt'}
                                                    </strong>
                                                    <span>
                                                        {!cardApplication.replacementRequest
                                                            ? 'Required only for a second/replacement card.'
                                                            : cardApplication.financeReceiptStatus === 'APPROVED'
                                                            ? 'Finance office receipt is valid.'
                                                            : cardApplication.financeReceiptStatus === 'REJECTED'
                                                            ? 'Upload a valid finance office receipt.'
                                                            : cardApplication.financeReceiptUploaded
                                                            ? `Uploaded ${formatShortDate(cardApplication.receiptUploadedAt)}`
                                                            : 'Use the finance office receipt.'}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                {cardApplication.replacementRequest && cardApplication.financeReceiptStatus === 'REJECTED' && (
                                    <div className="student-card-status student-card-status--rejected">
                                        {cardApplication.financeReceiptMessage || 'The uploaded finance receipt was rejected because it appears to be fake. Please upload a valid receipt from the finance office.'}
                                    </div>
                                )}
                                {cardApplication.replacementRequest && (!cardApplication.financeReceiptUploaded || cardApplication.financeReceiptStatus === 'REJECTED') && (
                                    <div className="student-card-receipt-upload">
                                        <label className="student-card-upload">
                                            <Upload size={16} />
                                            <span>{financeReceipt ? financeReceipt.name : 'Upload finance office receipt'}</span>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/jpeg,image/png"
                                                onChange={(event) => {
                                                    setFinanceReceipt(event.target.files?.[0] ?? null);
                                                    setCardError('');
                                                    setCardSuccess('');
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className="student-card-generate"
                                            onClick={() => void uploadFinanceReceipt()}
                                            disabled={isUploadingReceipt}
                                        >
                                            {isUploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
                                        </button>
                                    </div>
                                )}
                                {cardApplication.status === 'PRINTED' && (
                                    <div className="student-card-status student-card-status--printed">
                                        Your student card has been printed. Please collect it from the office between Room 209 and Room 210.
                                    </div>
                                )}
                            </>
                        )}
                        {cardError && <p className="student-card-error">{cardError}</p>}
                    </div>
                </div>
            )}

            {/* Notice Detail Modal */}
            {showNoticeDetails && guildNotice && (
                <div className="notice-poster-overlay" onClick={() => setShowNoticeDetails(false)}>
                    <div className="notice-poster-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="notice-poster-close" onClick={() => setShowNoticeDetails(false)}>Close</button>
                        <div className="notice-poster">
                            <div className="notice-topline">Join Us</div>
                            {guildNotice.imagePath && (
                                <div className="notice-logo-wrap">
                                    <img src={`${API_BASE}/api/events/${guildNotice.id}/image`} alt={guildNotice.title} />
                                </div>
                            )}
                            <h2>{guildNotice.title}</h2>
                            <div className="notice-midcopy">
                                {noticeHighlights.length > 0
                                    ? noticeHighlights.map((line) => <p key={line}>{line}</p>)
                                    : <p>{guildNotice.description}</p>}
                            </div>
                            <div className="notice-datetime">
                                Save the date<br />
                                {formatEventDate(guildNotice.eventDate)}
                                {guildNotice.eventTime ? `, ${guildNotice.eventTime}` : ''}
                            </div>
                            <div className="notice-location">
                                {guildNotice.location ? `Location: ${guildNotice.location}` : 'Location: TBA'}
                            </div>
                            <div className="notice-footer">
                                Posted by {guildNotice.organizer || 'Guild Office'}<br />
                                Reserve your spot now
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StudentDashboard;
