import { Fragment, useEffect, useMemo, useState } from 'react';
import { Archive, Clock3, Copy, ExternalLink, QrCode as QrIcon, Search, Users } from 'lucide-react';
import './DeanAttendance.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';
const RWANDA_TIME_ZONE = 'Africa/Kigali';
const CAMPUS_WEEKLY_SCHEDULES = [
    { campusName: 'Gishushu', dayOfWeek: 3, hour: 17, minute: 0, title: 'Gishushu General Assembly' },
    { campusName: 'Masoro', dayOfWeek: 2, hour: 10, minute: 0, title: 'Masoro General Assembly' },
];

const normalizeQrPayloadForCurrentOrigin = (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed || typeof window === 'undefined') return trimmed;

    try {
        const url = new URL(trimmed);
        const current = new URL(window.location.origin);
        const qrUsesLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        const currentIsBrowsableHost = current.hostname !== 'localhost' && current.hostname !== '127.0.0.1';

        if (qrUsesLocalhost && currentIsBrowsableHost) {
            url.protocol = current.protocol;
            url.hostname = current.hostname;
            url.port = current.port;
        }

        return url.toString();
    } catch {
        return trimmed;
    }
};

type SessionItem = {
    id: number;
    title: string;
    campus: string;
    startsAt: string;
    endsAt: string;
    active: boolean;
    defaultWeekly?: boolean;
    specialGroupKey?: string | null;
};

type AttendanceAdminRecord = {
    id: number;
    sessionId?: number | null;
    studentName: string;
    studentNumber: string;
    sessionTitle: string;
    campus: string;
    checkInAt: string;
    method: string;
    status: string;
    verificationStatus: string;
    absenceReason?: string | null;
    absenceDocumentName?: string | null;
    hasAbsenceDocument?: boolean;
};

type SpecialGeneratedSlot = {
    date: string;
    startsAt: string;
    endsAt: string;
};

type SpecialAttendanceGroup = {
    key: string;
    title: string;
    sessions: SessionItem[];
    startsAt: Date;
    endsAt: Date;
    durationLabel: string;
    campusLabel: string;
};

const DeanAttendance = () => {
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [sessionId, setSessionId] = useState<string>('');
    const [presentCount, setPresentCount] = useState(0);
    const [qrPayload, setQrPayload] = useState('');
    const [qrExpiry, setQrExpiry] = useState('');
    const [qrCopyMessage, setQrCopyMessage] = useState('');
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [now, setNow] = useState(new Date());
    const [presentRecords, setPresentRecords] = useState<AttendanceAdminRecord[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [isPresentModalOpen, setIsPresentModalOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [archiveRecords, setArchiveRecords] = useState<AttendanceAdminRecord[]>([]);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveSearch, setArchiveSearch] = useState('');
    const [archiveSessionId, setArchiveSessionId] = useState('');
    const [presentPage, setPresentPage] = useState(1);
    const [openConfirmOpen, setOpenConfirmOpen] = useState(false);
    const [expandedSpecialGroupKey, setExpandedSpecialGroupKey] = useState('');
    const [isSpecialFormOpen, setIsSpecialFormOpen] = useState(false);
    const [specialStep, setSpecialStep] = useState(1);
    const [specialForm, setSpecialForm] = useState({
        scheduleType: 'one-time' as 'one-time' | 'week',
        title: '',
        campus: 'ALL',
        startDate: '',
        endDate: '',
        oneTimeStartsAt: '',
        oneTimeDurationMinutes: '60',
        mondayMorningStart: '10:00',
        mondayMorningEnd: '12:00',
        mondayEveningStart: '17:00',
        mondayEveningEnd: '18:30',
        sundayStart: '10:00',
        sundayEnd: '12:00',
        applyMondayThroughThursday: true,
        applySundayToFriday: true,
    });
    const [specialFormError, setSpecialFormError] = useState('');
    const [isCreatingSpecial, setIsCreatingSpecial] = useState(false);
    const [isTogglingSession, setIsTogglingSession] = useState(false);
    const pageSize = 10;

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!actionMessage || isTogglingSession) return;
        const timer = window.setTimeout(() => setActionMessage(''), 1000);
        return () => window.clearTimeout(timer);
    }, [actionMessage, isTogglingSession]);

    const loadSessions = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions?active=false`);
            const data = await response.json().catch(() => []);
            const list = Array.isArray(data) ? data : [];
            setSessions(list);
            const campusSessions = getCampusSessionOptions(list);
            if ((!sessionId || !campusSessions.some((s: SessionItem) => String(s.id) === sessionId)) && campusSessions.length > 0) {
                const active = campusSessions.find((s: SessionItem) => s.active);
                setSessionId(String((active ?? campusSessions[0]).id));
            }
        } catch {
            setError('Failed to load sessions.');
        }
    };

    const loadPresentCount = async (selectedSessionId: string) => {
        if (!selectedSessionId) {
            setPresentCount(0);
            return;
        }
        try {
            const response = await fetch(
                `${API_BASE}/api/attendance/admin/records?sessionId=${selectedSessionId}&status=PRESENT`
            );
            const data = await response.json().catch(() => []);
            setPresentCount(Array.isArray(data) ? data.length : 0);
        } catch {
            setError('Failed to load attendance count.');
        }
    };

    const loadPresentRecords = async (selectedSessionId: string) => {
        if (!selectedSessionId) {
            setPresentRecords([]);
            return;
        }
        setRecordsLoading(true);
        try {
            const response = await fetch(
                `${API_BASE}/api/attendance/admin/records?sessionId=${selectedSessionId}&status=PRESENT`
            );
            const data = await response.json().catch(() => []);
            setPresentRecords(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load present student records.');
            setPresentRecords([]);
        } finally {
            setRecordsLoading(false);
        }
    };

    const loadArchiveRecords = async (selectedSessionId = '') => {
        setArchiveLoading(true);
        try {
            const query = selectedSessionId ? `?sessionId=${encodeURIComponent(selectedSessionId)}` : '';
            const response = await fetch(`${API_BASE}/api/attendance/admin/records${query}`);
            const data = await response.json().catch(() => []);
            setArchiveRecords(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load attendance archive.');
            setArchiveRecords([]);
        } finally {
            setArchiveLoading(false);
        }
    };

    useEffect(() => {
        void loadSessions();
        const poll = setInterval(() => {
            void loadSessions();
            if (sessionId) {
                void loadPresentCount(sessionId);
            }
        }, 15000);
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        void loadPresentCount(sessionId);
    }, [sessionId]);

    const handleGenerateQr = async () => {
        if (!sessionId) return;
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions/${sessionId}/qr-token`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to generate QR token.');
            }
            setQrPayload(data.payload ?? '');
            setQrExpiry(data.expiresAt ?? '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR token.');
        }
    };

    const handleToggleSession = async (active: boolean) => {
        if (!sessionId) return;
        setError('');
        setActionMessage(`${active ? 'Opening' : 'Closing'} session...`);
        setIsTogglingSession(true);
        try {
            const selected = sessions.find((session) => String(session.id) === sessionId);
            const selectedCampusKey = selected ? getCampusKey(selected) : '';
            const campusTargets = !active && selectedCampusKey
                ? sessions.filter((session) =>
                    !isSpecialAttendanceSession(session) &&
                    session.active &&
                    getCampusKey(session) === selectedCampusKey
                )
                : [];
            const targetSessions = campusTargets.length > 0 ? campusTargets : selected ? [selected] : [];

            if (targetSessions.length === 0) {
                throw new Error('No matching session was found. Refresh the page and try again.');
            }

            for (const targetSession of targetSessions) {
                const response = await fetch(`${API_BASE}/api/attendance/sessions/${targetSession.id}/active`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error ?? `Failed to ${active ? 'open' : 'close'} session.`);
                }
            }
            await loadSessions();
            await loadPresentCount(sessionId);
            if (!active) {
                setQrPayload('');
                setQrExpiry('');
            }
            setActionMessage(`${selected?.campus ?? 'Selected'} session ${active ? 'opened' : 'closed'} successfully.`);
        } catch (err) {
            setActionMessage('');
            setError(err instanceof Error ? err.message : `Failed to ${active ? 'open' : 'close'} session.`);
        } finally {
            setIsTogglingSession(false);
        }
    };

    const handleCreateSpecialSession = async () => {
        const title = specialForm.title.trim();
        setSpecialFormError('');
        if (!title) {
            setSpecialFormError('Enter the attendance title.');
            return;
        }
        const slots = buildSpecialScheduleSlots();
        if (!slots.length) {
            setSpecialFormError('No sessions were generated. Check your date range and time settings.');
            return;
        }
        const validationError = validateSpecialStepperSlots(slots);
        if (validationError) {
            setSpecialFormError(validationError);
            return;
        }

        setIsCreatingSpecial(true);
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions/special`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    campus: specialForm.campus,
                    slots,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to create special attendance.');
            }
            await loadSessions();
            if (Array.isArray(data) && data[0]?.id) {
                setSessionId(String(data[0].id));
            } else if (data.id) {
                setSessionId(String(data.id));
            }
            resetSpecialForm();
            setIsSpecialFormOpen(false);
        } catch (err) {
            setSpecialFormError(err instanceof Error ? err.message : 'Failed to create special attendance.');
        } finally {
            setIsCreatingSpecial(false);
        }
    };

    const resetSpecialForm = () => {
        setSpecialStep(1);
        setSpecialForm({
            scheduleType: 'one-time',
            title: '',
            campus: 'ALL',
            startDate: '',
            endDate: '',
            oneTimeStartsAt: '',
            oneTimeDurationMinutes: '60',
            mondayMorningStart: '10:00',
            mondayMorningEnd: '12:00',
            mondayEveningStart: '17:00',
            mondayEveningEnd: '18:30',
            sundayStart: '10:00',
            sundayEnd: '12:00',
            applyMondayThroughThursday: true,
            applySundayToFriday: true,
        });
    };

    const validateSpecialStep = (step = specialStep) => {
        if (step === 1) {
            if (!specialForm.title.trim()) return 'Enter the attendance title.';
        }
        if (specialForm.scheduleType === 'one-time') {
            if (step === 2) {
                if (!specialForm.oneTimeStartsAt) return 'Choose the start date and time.';
                const start = parseRwandaDate(specialForm.oneTimeStartsAt);
                if (start.getTime() < Date.now() - 60000) return 'Start time cannot be in the past.';
                const duration = Number(specialForm.oneTimeDurationMinutes);
                if (!Number.isFinite(duration) || duration < 15 || duration > 720) return 'Duration must be between 15 minutes and 12 hours.';
            }
            return '';
        }
        if (step === 1) {
            if (!specialForm.startDate || !specialForm.endDate) return 'Choose the starting and ending dates.';
            const start = parseRwandaDate(`${specialForm.startDate}T00:00`);
            const end = parseRwandaDate(`${specialForm.endDate}T23:59`);
            if (end.getTime() < start.getTime()) return 'Ending date must be after the starting date.';
            if (end.getTime() < Date.now() - 60000) return 'Ending date cannot be in the past.';
        }
        if (step === 2) {
            if (!isValidTimeRange(specialForm.mondayMorningStart, specialForm.mondayMorningEnd)) return 'Monday morning end time must be after start time.';
            if (!isValidTimeRange(specialForm.mondayEveningStart, specialForm.mondayEveningEnd)) return 'Monday evening end time must be after start time.';
        }
        if (step === 3) {
            if (!isValidTimeRange(specialForm.sundayStart, specialForm.sundayEnd)) return 'Sunday end time must be after start time.';
        }
        return '';
    };

    const goToSpecialStep = (nextStep: number) => {
        const error = validateSpecialStep(specialStep);
        if (error) {
            setSpecialFormError(error);
            return;
        }
        setSpecialFormError('');
        setSpecialStep(nextStep);
    };

    const buildSpecialScheduleSlots = (): SpecialGeneratedSlot[] => {
        if (specialForm.scheduleType === 'one-time') {
            if (!specialForm.oneTimeStartsAt) return [];
            const start = parseRwandaDate(specialForm.oneTimeStartsAt);
            const duration = Number(specialForm.oneTimeDurationMinutes);
            if (!Number.isFinite(start.getTime()) || !Number.isFinite(duration)) return [];
            const end = new Date(start.getTime() + duration * 60000);
            return [{
                date: getRwandaDateOnlyValue(start),
                startsAt: getRwandaTimeValue(start),
                endsAt: getRwandaTimeValue(end),
            }];
        }
        if (!specialForm.startDate || !specialForm.endDate) return [];
        const start = parseDateInputAsUtc(specialForm.startDate);
        const end = parseDateInputAsUtc(specialForm.endDate);
        const slots: SpecialGeneratedSlot[] = [];
        for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addUtcDays(cursor, 1)) {
            const day = cursor.getUTCDay();
            const date = getDateInputValue(cursor);
            if (day === 1 || (specialForm.applyMondayThroughThursday && day >= 2 && day <= 4)) {
                slots.push({ date, startsAt: specialForm.mondayMorningStart, endsAt: specialForm.mondayMorningEnd });
                slots.push({ date, startsAt: specialForm.mondayEveningStart, endsAt: specialForm.mondayEveningEnd });
            }
            if (day === 0 || (specialForm.applySundayToFriday && day === 5)) {
                slots.push({ date, startsAt: specialForm.sundayStart, endsAt: specialForm.sundayEnd });
            }
        }
        return slots;
    };

    const previewSpecialSlots = useMemo(() => buildSpecialScheduleSlots(), [specialForm]);
    const specialStepLabels = specialForm.scheduleType === 'one-time'
        ? ['Details', 'Time', 'Review']
        : ['Details', 'Mon-Thu', 'Sun/Fri', 'Review'];

    const selectedSession = sessions.find((s) => String(s.id) === sessionId);
    const studentCheckInLink = useMemo(() => normalizeQrPayloadForCurrentOrigin(qrPayload), [qrPayload]);
    const isLocalhostQrLink = useMemo(() => {
        if (!studentCheckInLink) return false;
        try {
            const url = new URL(studentCheckInLink);
            return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        } catch {
            return false;
        }
    }, [studentCheckInLink]);
    const campusSessionOptions = useMemo(
        () => getCampusSessionOptions(sessions),
        [sessions]
    );
    const specialAttendanceGroups = useMemo(
        () => buildSpecialAttendanceGroups(sessions),
        [sessions]
    );

    const elapsedLabel = useMemo(() => {
        if (!selectedSession?.startsAt || !selectedSession.active) return '00:00:00';
        const start = parseRwandaDate(selectedSession.startsAt).getTime();
        const diff = Math.max(0, Math.floor((now.getTime() - start) / 1000));
        const hh = String(Math.floor(diff / 3600)).padStart(2, '0');
        const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const ss = String(diff % 60).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }, [selectedSession, now]);

    const dateTimeLabel = useMemo(
        () =>
            now.toLocaleString([], {
                timeZone: RWANDA_TIME_ZONE,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        [now]
    );

    const campusWatchCards = useMemo(() => {
        return CAMPUS_WEEKLY_SCHEDULES.map((schedule) => {
            const campusSessions = campusSessionOptions.filter((session) =>
                `${session.campus} ${session.title}`.toLowerCase().includes(schedule.campusName.toLowerCase())
            );
            const nextSession = campusSessions
                .map((session) => ({ session, startsAt: parseRwandaDate(session.startsAt), endsAt: parseRwandaDate(session.endsAt) }))
                .filter((item) => item.endsAt.getTime() >= now.getTime())
                .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

            const activeSession = campusSessions.find((session) => session.active);
            const fallbackStart = getNextRwandaWeeklyDate(now, schedule.dayOfWeek, schedule.hour, schedule.minute);
            const countdownTarget = nextSession?.startsAt ?? fallbackStart;
            const countdownSeconds = Math.max(0, Math.floor((countdownTarget.getTime() - now.getTime()) / 1000));

            return {
                campusName: schedule.campusName,
                active: Boolean(activeSession),
                session: activeSession ?? nextSession?.session ?? { title: schedule.title },
                countdown: activeSession ? 'Event is open now' : `Event starting in ${formatDuration(countdownSeconds)}`,
                schedule: nextSession?.session?.startsAt ? formatRwandaDateTime(nextSession.session.startsAt) : formatRwandaDateTimeFromDate(fallbackStart),
            };
        });
    }, [campusSessionOptions, now]);

    const filteredArchiveRecords = useMemo(() => {
        const query = archiveSearch.trim().toLowerCase();
        return archiveRecords.filter((record) => {
            if (archiveSessionId && !recordMatchesSession(record, archiveSessionId)) {
                return false;
            }
            if (!query) return true;
            return [
                    record.studentName,
                    record.studentNumber,
                    record.sessionTitle,
                    record.campus,
                    record.checkInAt,
                    record.method,
                    record.verificationStatus,
                    record.absenceReason,
                    record.absenceDocumentName,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query);
        });
    }, [archiveRecords, archiveSearch, archiveSessionId]);

    const archiveSessionRows = useMemo(() => {
        const attendeeCounts = new Map<string, number>();
        archiveRecords.forEach((record) => {
            const key = getArchiveRecordSessionKey(record);
            attendeeCounts.set(key, (attendeeCounts.get(key) ?? 0) + 1);
        });

        return sessions
            .filter((session) => {
                const started = parseRwandaDate(session.startsAt).getTime() <= now.getTime();
                const count = attendeeCounts.get(getSessionArchiveKey(session)) ?? 0;
                return session.active || started || count > 0;
            })
            .map((session) => ({
                session,
                attendees: attendeeCounts.get(getSessionArchiveKey(session)) ?? 0,
            }))
            .sort((a, b) => parseRwandaDate(b.session.startsAt).getTime() - parseRwandaDate(a.session.startsAt).getTime());
    }, [archiveRecords, sessions, now]);

    const selectedArchiveSession = useMemo(
        () => sessions.find((session) => String(session.id) === archiveSessionId) ?? null,
        [archiveSessionId, sessions]
    );

    const archiveAttendeeCount = filteredArchiveRecords.length;

    const archiveAllRecordsCount = useMemo(
        () => archiveRecords.filter((record) =>
            [
                record.studentName,
                record.studentNumber,
                record.sessionTitle,
                record.campus,
                record.checkInAt,
                record.method,
                record.verificationStatus,
                record.absenceReason,
                record.absenceDocumentName,
            ]
                .join(' ')
                .toLowerCase()
                .includes(archiveSearch.trim().toLowerCase())
        ).length,
        [archiveRecords, archiveSearch]
    );

    const totalPages = Math.max(1, Math.ceil(presentRecords.length / pageSize));
    const pagedPresentRecords = useMemo(() => {
        const start = (presentPage - 1) * pageSize;
        return presentRecords.slice(start, start + pageSize);
    }, [presentPage, presentRecords]);

    const openPresentModal = async () => {
        if (!sessionId) {
            setError('Select a session first.');
            return;
        }
        setPresentPage(1);
        setIsPresentModalOpen(true);
        await loadPresentRecords(sessionId);
    };

    const openArchive = async () => {
        setArchiveSessionId(sessionId);
        setArchiveSearch('');
        setIsArchiveOpen(true);
        await loadArchiveRecords('');
    };

    const handleArchiveSessionChange = async (value: string) => {
        setArchiveSessionId(value);
    };

    const prepareOpenSession = () => {
        if (!sessionId) return;
        setError('');
        setOpenConfirmOpen(true);
    };

    const confirmOpenSession = async () => {
        if (!sessionId) return;
        setError('');
        await handleToggleSession(true);
        setOpenConfirmOpen(false);
    };

    const handleDownloadPresentPdf = () => {
        if (!sessionId) {
            setError('Select a session first.');
            return;
        }
        window.open(`${API_BASE}/api/attendance/report/pdf?sessionId=${encodeURIComponent(sessionId)}`, '_blank', 'noopener,noreferrer');
    };

    const copyStudentCheckInLink = async () => {
        if (!studentCheckInLink) return;
        setQrCopyMessage('');
        try {
            await navigator.clipboard.writeText(studentCheckInLink);
            setQrCopyMessage('Check-in link copied.');
        } catch {
            setQrCopyMessage('Copy failed. Select and copy the link manually.');
        }
    };

    const deleteSpecialAttendanceBySessionId = async (targetSessionId: number) => {
        const confirmed = window.confirm('Delete this special attendance and every session created with it?');
        if (!confirmed) return;
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/attendance/sessions/${targetSessionId}/special`, {
                method: 'DELETE',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to delete special attendance.');
            }
            setQrPayload('');
            setQrExpiry('');
            setSessionId('');
            await loadSessions();
            setError(`Deleted ${data.deleted ?? 'the'} special attendance session(s).`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete special attendance.');
        }
    };

    return (
        <div className="dean-attendance-simple">
            <header className="dean-simple-head">
                <h1>Attendance Review</h1>
                <p>Session control, live attendance count, and real-time timing.</p>
            </header>

            {error && <div className="dean-simple-error">{error}</div>}
            {actionMessage && !error && <div className="dean-simple-notice">{actionMessage}</div>}

            <section className="dean-simple-controls">
                <div className="control-group">
                    <label>Session</label>
                    <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                        {campusSessionOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title} ({s.campus}) {s.active ? '- Open' : '- Closed'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="control-buttons">
                    <button className="btn-success" type="button" onClick={() => {
                        setSpecialFormError('');
                        setSpecialStep(1);
                        setSpecialForm((current) => ({
                            ...current,
                            startDate: current.startDate || getRwandaDateOnlyValue(new Date()),
                            endDate: current.endDate || getRwandaDateOnlyValue(new Date()),
                        }));
                        setIsSpecialFormOpen(true);
                    }}>
                        Special Attendance
                    </button>
                    {selectedSession?.active ? (
                        <>
                            <button className="btn-dark" onClick={handleGenerateQr} disabled={isTogglingSession}>
                                <QrIcon size={16} /> Generate QR
                            </button>
                            <button className="btn-danger" onClick={() => handleToggleSession(false)} disabled={isTogglingSession}>
                                {isTogglingSession ? 'Closing...' : 'Close Session'}
                            </button>
                        </>
                    ) : (
                        <button className="btn-success" onClick={prepareOpenSession} disabled={isTogglingSession}>
                            {isTogglingSession ? 'Opening...' : 'Open Session'}
                        </button>
                    )}
                    <button className="btn-dark" type="button" onClick={() => void openArchive()}>
                        <Archive size={16} /> Attendance Archive
                    </button>
                </div>
            </section>

            {openConfirmOpen && (
                <div className="attendance-popup-overlay" onClick={() => setOpenConfirmOpen(false)}>
                    <section className="attendance-open-confirm attendance-open-popup" onClick={(event) => event.stopPropagation()}>
                        <div>
                            <h2>Confirm opening attendance</h2>
                            <p>
                                You are opening the attendance session for {selectedSession?.campus ?? 'this campus'} at {dateTimeLabel}.
                                Students will be able to check in immediately.
                            </p>
                        </div>
                        <div className="attendance-open-actions">
                            <button className="btn-dark" type="button" onClick={() => setOpenConfirmOpen(false)}>Cancel</button>
                            <button className="btn-success" type="button" onClick={confirmOpenSession}>Confirm Open</button>
                        </div>
                    </section>
                </div>
            )}

            {isSpecialFormOpen && (
                <div className="attendance-popup-overlay" onClick={() => setIsSpecialFormOpen(false)}>
                    <section className="attendance-open-confirm attendance-open-popup special-attendance-popup" onClick={(event) => event.stopPropagation()}>
                        <div>
                            <h2>Create special attendance</h2>
                            <p>Follow the steps to set the date range, weekday hours, Sunday/Friday hours, then finish.</p>
                        </div>

                        <div className="special-stepper">
                            {specialStepLabels.map((label, index) => {
                                const step = index + 1;
                                return (
                                <button
                                    type="button"
                                    key={step}
                                    className={specialStep === step ? 'active' : specialStep > step ? 'done' : ''}
                                    onClick={() => {
                                        if (step < specialStep) {
                                            setSpecialStep(step);
                                        }
                                    }}
                                >
                                    <span>{step}</span>
                                    <strong>{label}</strong>
                                </button>
                                );
                            })}
                        </div>

                        <div className="special-attendance-form">
                            {specialStep === 1 && (
                                <>
                                    <label>
                                        Event title
                                        <input
                                            value={specialForm.title}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, title: event.target.value }))}
                                            placeholder="Example: Week of Prayer"
                                            maxLength={140}
                                        />
                                    </label>
                                    <label>
                                        Campus
                                        <select
                                            value={specialForm.campus}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, campus: event.target.value }))}
                                        >
                                            <option value="ALL">All campuses</option>
                                            <option value="GIS">Gishushu Campus</option>
                                            <option value="MAS">Masoro Campus</option>
                                        </select>
                                    </label>
                                    <label>
                                        Schedule type
                                        <select
                                            value={specialForm.scheduleType}
                                            onChange={(event) => {
                                                const scheduleType = event.target.value as 'one-time' | 'week';
                                                setSpecialForm((current) => ({
                                                    ...current,
                                                    scheduleType,
                                                    oneTimeStartsAt: current.oneTimeStartsAt || getRwandaDateTimeLocalValue(new Date()),
                                                    startDate: current.startDate || getRwandaDateOnlyValue(new Date()),
                                                    endDate: current.endDate || getRwandaDateOnlyValue(new Date()),
                                                }));
                                                setSpecialStep(1);
                                            }}
                                        >
                                            <option value="one-time">One-time session</option>
                                            <option value="week">Week schedule</option>
                                        </select>
                                    </label>
                                    {specialForm.scheduleType === 'week' && (
                                        <>
                                    <label>
                                        Starting date
                                        <input
                                            type="date"
                                            min={getRwandaDateOnlyValue(new Date())}
                                            value={specialForm.startDate}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, startDate: event.target.value }))}
                                        />
                                    </label>
                                    <label>
                                        Ending date
                                        <input
                                            type="date"
                                            min={specialForm.startDate || getRwandaDateOnlyValue(new Date())}
                                            value={specialForm.endDate}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, endDate: event.target.value }))}
                                        />
                                    </label>
                                        </>
                                    )}
                                </>
                            )}

                            {specialStep === 2 && specialForm.scheduleType === 'one-time' && (
                                <>
                                    <label>
                                        Start date and time
                                        <input
                                            type="datetime-local"
                                            min={getRwandaDateTimeLocalValue(new Date())}
                                            value={specialForm.oneTimeStartsAt}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, oneTimeStartsAt: event.target.value }))}
                                        />
                                    </label>
                                    <label>
                                        Duration
                                        <select
                                            value={specialForm.oneTimeDurationMinutes}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, oneTimeDurationMinutes: event.target.value }))}
                                        >
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="45">45 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="90">1 hour 30 minutes</option>
                                            <option value="120">2 hours</option>
                                            <option value="180">3 hours</option>
                                            <option value="240">4 hours</option>
                                        </select>
                                    </label>
                                </>
                            )}

                            {specialStep === 2 && specialForm.scheduleType === 'week' && (
                                <>
                                    <label>
                                        Monday morning start
                                        <input type="time" value={specialForm.mondayMorningStart} onChange={(event) => setSpecialForm((current) => ({ ...current, mondayMorningStart: event.target.value }))} />
                                    </label>
                                    <label>
                                        Monday morning end
                                        <input type="time" value={specialForm.mondayMorningEnd} onChange={(event) => setSpecialForm((current) => ({ ...current, mondayMorningEnd: event.target.value }))} />
                                    </label>
                                    <label>
                                        Monday evening start
                                        <input type="time" value={specialForm.mondayEveningStart} onChange={(event) => setSpecialForm((current) => ({ ...current, mondayEveningStart: event.target.value }))} />
                                    </label>
                                    <label>
                                        Monday evening end
                                        <input type="time" value={specialForm.mondayEveningEnd} onChange={(event) => setSpecialForm((current) => ({ ...current, mondayEveningEnd: event.target.value }))} />
                                    </label>
                                    <label className="special-check-row">
                                        <input
                                            type="checkbox"
                                            checked={specialForm.applyMondayThroughThursday}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, applyMondayThroughThursday: event.target.checked }))}
                                        />
                                        Apply Monday times through Thursday
                                    </label>
                                </>
                            )}

                            {specialStep === 3 && specialForm.scheduleType === 'week' && (
                                <>
                                    <label>
                                        Sunday start
                                        <input type="time" value={specialForm.sundayStart} onChange={(event) => setSpecialForm((current) => ({ ...current, sundayStart: event.target.value }))} />
                                    </label>
                                    <label>
                                        Sunday end
                                        <input type="time" value={specialForm.sundayEnd} onChange={(event) => setSpecialForm((current) => ({ ...current, sundayEnd: event.target.value }))} />
                                    </label>
                                    <label className="special-check-row">
                                        <input
                                            type="checkbox"
                                            checked={specialForm.applySundayToFriday}
                                            onChange={(event) => setSpecialForm((current) => ({ ...current, applySundayToFriday: event.target.checked }))}
                                        />
                                        Apply Sunday time to Friday
                                    </label>
                                </>
                            )}

                            {specialStep === specialStepLabels.length && (
                                <div className="special-review-panel">
                                    <strong>{previewSpecialSlots.length} sessions will be created</strong>
                                    <p>{specialForm.title || 'Special attendance'} for {specialForm.campus === 'ALL' ? 'all campuses' : specialForm.campus === 'GIS' ? 'Gishushu Campus' : 'Masoro Campus'}.</p>
                                    <div className="special-review-list">
                                        {previewSpecialSlots.slice(0, 8).map((slot, index) => (
                                            <span key={`${slot.date}-${slot.startsAt}-${index}`}>
                                                {slot.date} {slot.startsAt}-{slot.endsAt}
                                            </span>
                                        ))}
                                        {previewSpecialSlots.length > 8 && <span>+{previewSpecialSlots.length - 8} more</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {specialFormError && <div className="special-attendance-error">{specialFormError}</div>}

                        <div className="attendance-open-actions">
                            <button className="btn-dark" type="button" onClick={() => setIsSpecialFormOpen(false)}>
                                Cancel
                            </button>
                            {specialStep > 1 && (
                                <button className="btn-dark" type="button" onClick={() => { setSpecialFormError(''); setSpecialStep((step) => Math.max(1, step - 1)); }}>
                                    Back
                                </button>
                            )}
                            {specialStep < specialStepLabels.length ? (
                                <button className="btn-success" type="button" onClick={() => goToSpecialStep(specialStep + 1)}>
                                    Next
                                </button>
                            ) : (
                                <button className="btn-success" type="button" disabled={isCreatingSpecial} onClick={() => void handleCreateSpecialSession()}>
                                    {isCreatingSpecial ? 'Creating...' : 'Finish'}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            )}

            <section className="simple-metrics-grid">
                <article className="metric-card dark clickable" onClick={() => void openPresentModal()}>
                    <span className="kicker">Live Attendance</span>
                    <strong><Users size={18} /> {presentCount}</strong>
                    <p>Students marked present in this session (tap to view list)</p>
                </article>

                <article className="metric-card green rwanda-time-card">
                    <span className="kicker">Exact Date & Time</span>
                    <strong><Clock3 size={18} /> {dateTimeLabel}</strong>
                    <p>Rwanda time GMT+2 for attendance oversight</p>
                </article>

                <article className="metric-card">
                    <span className="kicker">Session Running Time</span>
                    <strong>{elapsedLabel}</strong>
                    <p>Time since this session opened</p>
                </article>
            </section>

            <section className="campus-watch-grid">
                {campusWatchCards.map((card) => (
                    <article key={card.campusName} className={`campus-watch-card ${card.active ? 'is-open' : ''}`}>
                        <span className="kicker">{card.campusName} Watch</span>
                        <strong>{card.countdown}</strong>
                        <p>{card.session ? card.session.title : 'General Assembly'}</p>
                        <small>{card.schedule}</small>
                    </article>
                ))}
            </section>

            <section className="special-attendance-table-card">
                <div className="special-attendance-table-head">
                    <div>
                        <h3>Special Attendance</h3>
                        <p>Generated special sessions are grouped here instead of the session dropdown.</p>
                    </div>
                    <span>{specialAttendanceGroups.length} special event{specialAttendanceGroups.length === 1 ? '' : 's'}</span>
                </div>
                {specialAttendanceGroups.length === 0 ? (
                    <div className="special-attendance-empty">No special attendance has been created yet.</div>
                ) : (
                    <div className="special-attendance-table-wrap">
                        <table className="special-attendance-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Duration</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {specialAttendanceGroups.map((group) => (
                                    <Fragment key={group.key}>
                                        <tr key={group.key}>
                                            <td>
                                                <strong>{group.title}</strong>
                                                <small>{group.campusLabel}</small>
                                            </td>
                                            <td>
                                                <span>{group.durationLabel}</span>
                                                <small>{group.sessions.length} session{group.sessions.length === 1 ? '' : 's'}</small>
                                            </td>
                                            <td>
                                                <div className="special-attendance-row-actions">
                                                    <button type="button" className="btn-dark" onClick={() => setExpandedSpecialGroupKey((current) => current === group.key ? '' : group.key)}>
                                                        {expandedSpecialGroupKey === group.key ? 'Hide details' : 'View details'}
                                                    </button>
                                                    <button type="button" className="btn-danger" onClick={() => void deleteSpecialAttendanceBySessionId(group.sessions[0].id)}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedSpecialGroupKey === group.key && (
                                            <tr key={`${group.key}-details`} className="special-attendance-details-row">
                                                <td colSpan={3}>
                                                    <div className="special-attendance-details">
                                                        {group.sessions.map((session) => (
                                                            <article key={session.id}>
                                                                <strong>{formatRwandaDateTime(session.startsAt)}</strong>
                                                                <span>{session.campus} - {session.active ? 'Open' : 'Closed'}</span>
                                                            </article>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {qrPayload && (
                <section className="simple-qr-panel">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(studentCheckInLink)}`}
                        alt="Attendance QR"
                    />
                    <div className="qr-meta">
                        <span className="qr-kicker">Ready for student scan</span>
                        <h3>Current Session QR</h3>
                        <p>Students scan this code, sign in, then the attendance validation screen opens with this session already selected.</p>
                        <div className="qr-instructions">
                            <span>1. Open the session</span>
                            <span>2. Generate this QR</span>
                            <span>3. Student scans and signs in</span>
                            <span>4. Student taps Validate Check-In</span>
                        </div>
                        {isLocalhostQrLink && (
                            <div className="qr-warning">
                                This QR uses localhost, so it only works on this same computer. For phone scanning, open the portal with your computer IP or a tunnel URL and configure the backend QR frontend URL to match.
                            </div>
                        )}
                        <label className="qr-link-field">
                            Student check-in link
                            <input value={studentCheckInLink} readOnly onFocus={(event) => event.currentTarget.select()} />
                        </label>
                        {qrCopyMessage && <p className="qr-copy-message">{qrCopyMessage}</p>}
                        <p className="qr-expiry">Expires at: {qrExpiry || 'N/A'}</p>
                        <div className="qr-actions">
                            <button
                                className="btn-dark"
                                type="button"
                                onClick={() => window.open(studentCheckInLink, '_blank', 'noopener,noreferrer')}
                            >
                                <ExternalLink size={16} /> Test Link
                            </button>
                            <button className="btn-dark" type="button" onClick={() => void copyStudentCheckInLink()}>
                                <Copy size={16} /> Copy Link
                            </button>
                            <button
                                className="btn-dark"
                                type="button"
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&data=${encodeURIComponent(studentCheckInLink)}`;
                                    a.download = 'attendance-session-qr.png';
                                    a.click();
                                }}
                            >
                                Download QR
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {isPresentModalOpen && (
                <div className="attendance-modal-overlay" onClick={() => setIsPresentModalOpen(false)}>
                    <section className="attendance-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="attendance-modal-head">
                            <h3>Present Students - {selectedSession?.title ?? 'Selected Session'}</h3>
                            <button className="btn-dark" type="button" onClick={handleDownloadPresentPdf}>
                                Generate PDF Report
                            </button>
                        </div>

                        <div className="attendance-modal-body">
                            {recordsLoading && <p>Loading present students...</p>}
                            {!recordsLoading && presentRecords.length === 0 && <p>No present students found for this session.</p>}
                            {!recordsLoading && presentRecords.length > 0 && (
                                <div className="attendance-table-wrap">
                                    <table className="attendance-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Student ID</th>
                                                <th>Check-in</th>
                                                <th>Method</th>
                                                <th>Verification</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedPresentRecords.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{(presentPage - 1) * pageSize + index + 1}</td>
                                                    <td>{item.studentName || '-'}</td>
                                                    <td>{item.studentNumber || '-'}</td>
                                                    <td>{item.checkInAt || '-'}</td>
                                                    <td>{item.method || '-'}</td>
                                                    <td>{item.verificationStatus || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="attendance-modal-foot">
                            <button
                                className="btn-dark"
                                type="button"
                                disabled={presentPage <= 1}
                                onClick={() => setPresentPage((p) => Math.max(1, p - 1))}
                            >
                                Prev
                            </button>
                            <span>Page {presentPage} of {totalPages}</span>
                            <button
                                className="btn-dark"
                                type="button"
                                disabled={presentPage >= totalPages}
                                onClick={() => setPresentPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {isArchiveOpen && (
                <div className="attendance-modal-overlay" onClick={() => setIsArchiveOpen(false)}>
                    <section className="attendance-modal-card attendance-archive-card" onClick={(e) => e.stopPropagation()}>
                        <div className="attendance-modal-head">
                            <h3>Attendance Archive</h3>
                            <button className="btn-dark" type="button" onClick={() => setIsArchiveOpen(false)}>
                                Close
                            </button>
                        </div>

                        <div className="attendance-archive-tools">
                            <label>
                                Search archive
                                <div className="archive-search">
                                    <Search size={16} />
                                    <input
                                        value={archiveSearch}
                                        onChange={(event) => setArchiveSearch(event.target.value)}
                                        placeholder="Student name, ID, campus, method"
                                    />
                                </div>
                            </label>
                            <div className="archive-summary">
                                <strong>{archiveSessionRows.length}</strong>
                                <span>opened sessions</span>
                            </div>
                            <div className="archive-summary">
                                <strong>{archiveSessionId ? archiveAttendeeCount : archiveAllRecordsCount}</strong>
                                <span>{archiveSessionId ? 'attendees in selected session' : 'attendance records'}</span>
                            </div>
                        </div>

                        <div className="attendance-modal-body">
                            {archiveLoading && <p>Loading archive...</p>}
                            {!archiveLoading && (
                                <div className="archive-session-layout">
                                    <aside className="archive-session-list">
                                        <button
                                            type="button"
                                            className={!archiveSessionId ? 'active' : ''}
                                            onClick={() => void handleArchiveSessionChange('')}
                                        >
                                            <strong>All opened sessions</strong>
                                            <span>{archiveAllRecordsCount} attendance record{archiveAllRecordsCount === 1 ? '' : 's'}</span>
                                        </button>
                                        {archiveSessionRows.map(({ session, attendees }) => (
                                            <button
                                                type="button"
                                                key={session.id}
                                                className={archiveSessionId === String(session.id) ? 'active' : ''}
                                                onClick={() => void handleArchiveSessionChange(String(session.id))}
                                            >
                                                <strong>{session.title}</strong>
                                                <span>{session.campus} • {formatRwandaDateTime(session.startsAt)}</span>
                                                <small>{session.active ? 'Open' : 'Closed'} • {attendees} attendee{attendees === 1 ? '' : 's'}</small>
                                            </button>
                                        ))}
                                    </aside>

                                    <section className="archive-attendee-panel">
                                        <div className="archive-attendee-head">
                                            <div>
                                                <h4>{selectedArchiveSession?.title ?? 'All Sessions'}</h4>
                                                <p>
                                                    {selectedArchiveSession
                                                        ? `${selectedArchiveSession.campus} • ${formatRwandaDateTime(selectedArchiveSession.startsAt)} - ${formatRwandaDateTime(selectedArchiveSession.endsAt)}`
                                                        : 'Select a session to view only its attendees.'}
                                                </p>
                                            </div>
                                            <span>{filteredArchiveRecords.length} record{filteredArchiveRecords.length === 1 ? '' : 's'}</span>
                                        </div>

                                        {filteredArchiveRecords.length === 0 ? (
                                            <p>No attendee found for this session/search.</p>
                                        ) : (
                                            <div className="attendance-table-wrap">
                                                <table className="attendance-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Name</th>
                                                            <th>Student ID</th>
                                                            <th>Check-in</th>
                                                            <th>Method</th>
                                                            <th>Status</th>
                                                            <th>Verification</th>
                                                            <th>Absence Reason</th>
                                                            <th>Document</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredArchiveRecords.map((item, index) => (
                                                            <tr key={`${item.id}-${index}`}>
                                                                <td>{index + 1}</td>
                                                                <td>{item.studentName || '-'}</td>
                                                                <td>{item.studentNumber || '-'}</td>
                                                                <td>{item.checkInAt || '-'}</td>
                                                                <td>{item.method || '-'}</td>
                                                                <td>{item.status || '-'}</td>
                                                                <td>{item.verificationStatus || '-'}</td>
                                                                <td>{item.absenceReason || '-'}</td>
                                                                <td>
                                                                    {item.hasAbsenceDocument ? (
                                                                        <button
                                                                            type="button"
                                                                            className="table-link-btn"
                                                                            onClick={() => window.open(`${API_BASE}/api/attendance/records/${item.id}/absence-document`, '_blank', 'noopener,noreferrer')}
                                                                        >
                                                                            {item.absenceDocumentName || 'View document'}
                                                                        </button>
                                                                    ) : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

const parseRwandaDate = (value: string) => {
    if (!value) return new Date(Number.NaN);
    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
        return new Date(value);
    }
    return new Date(`${value}+02:00`);
};

const formatRwandaDateTime = (value: string) =>
    parseRwandaDate(value).toLocaleString([], {
        timeZone: RWANDA_TIME_ZONE,
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const formatRwandaDateTimeFromDate = (value: Date) =>
    value.toLocaleString([], {
        timeZone: RWANDA_TIME_ZONE,
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const getRwandaDateParts = (value: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: RWANDA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(value);

    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    return {
        year: get('year'),
        month: get('month'),
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
        second: get('second'),
    };
};

const getRwandaDateOnlyValue = (value: Date) => {
    const parts = getRwandaDateParts(value);
    const pad = (item: number) => String(item).padStart(2, '0');
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

const getRwandaDateTimeLocalValue = (value: Date) => {
    const parts = getRwandaDateParts(value);
    const pad = (item: number) => String(item).padStart(2, '0');
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
};

const getRwandaTimeValue = (value: Date) => {
    const parts = getRwandaDateParts(value);
    const pad = (item: number) => String(item).padStart(2, '0');
    return `${pad(parts.hour)}:${pad(parts.minute)}`;
};

const parseDateInputAsUtc = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const isValidTimeRange = (start: string, end: string) => {
    if (!start || !end) return false;
    return end > start;
};

const validateSpecialStepperSlots = (slots: SpecialGeneratedSlot[]) => {
    if (!slots.length) return 'No sessions were generated.';
    for (const slot of slots) {
        const start = parseRwandaDate(`${slot.date}T${slot.startsAt}`);
        const end = parseRwandaDate(`${slot.date}T${slot.endsAt}`);
        if (start.getTime() < Date.now() - 60000) {
            return 'A generated session starts in the past. Adjust the date range.';
        }
        if (end.getTime() <= start.getTime()) {
            return 'Each generated session end time must be after its start time.';
        }
        if ((end.getTime() - start.getTime()) / 60000 > 720) {
            return 'Each generated session must be 12 hours or less.';
        }
    }
    return '';
};

const isDefaultGeneralAssemblySession = (session: SessionItem) => {
    const title = session.title.toLowerCase();
    return title === 'gishushu general assembly' || title === 'masoro general assembly';
};

const getCampusKey = (session: SessionItem) => {
    const text = `${session.campus} ${session.title}`.toLowerCase();
    if (text.includes('gishushu')) return 'gishushu';
    if (text.includes('masoro')) return 'masoro';
    return '';
};

const getSessionArchiveKey = (session: SessionItem) => String(session.id);

const getArchiveRecordSessionKey = (record: AttendanceAdminRecord) =>
    record.sessionId != null
        ? String(record.sessionId)
        : `${record.sessionTitle || ''}|${record.campus || ''}`.toLowerCase();

const recordMatchesSession = (record: AttendanceAdminRecord, sessionId: string) =>
    record.sessionId != null
        ? String(record.sessionId) === sessionId
        : false;

const getCampusSessionOptions = (sessions: SessionItem[]) => {
    const byCampus = new Map<string, SessionItem[]>();
    sessions
        .filter((session) => !isSpecialAttendanceSession(session))
        .forEach((session) => {
            const campusKey = getCampusKey(session);
            if (!campusKey) return;
            byCampus.set(campusKey, [...(byCampus.get(campusKey) ?? []), session]);
        });

    return ['gishushu', 'masoro']
        .map((campusKey) => {
            const campusSessions = byCampus.get(campusKey) ?? [];
            return campusSessions
                .sort((a, b) => {
                    if (a.active !== b.active) return a.active ? -1 : 1;
                    const aDefault = a.defaultWeekly || isDefaultGeneralAssemblySession(a);
                    const bDefault = b.defaultWeekly || isDefaultGeneralAssemblySession(b);
                    if (aDefault !== bDefault) return aDefault ? -1 : 1;
                    return parseRwandaDate(b.startsAt).getTime() - parseRwandaDate(a.startsAt).getTime();
                })[0];
        })
        .filter((session): session is SessionItem => Boolean(session));
};

const isSpecialAttendanceSession = (session: SessionItem) => {
    if (session.specialGroupKey) return true;
    if (session.defaultWeekly || isDefaultGeneralAssemblySession(session)) return false;
    return session.title.includes(' - ');
};

const getSpecialBaseTitle = (title: string) => {
    const separator = title.indexOf(' - ');
    return separator > 0 ? title.slice(0, separator) : title;
};

const buildSpecialAttendanceGroups = (sessions: SessionItem[]): SpecialAttendanceGroup[] => {
    const grouped = new Map<string, SessionItem[]>();
    sessions.filter(isSpecialAttendanceSession).forEach((session) => {
        const key = session.specialGroupKey || `legacy-${getSpecialBaseTitle(session.title).toLowerCase()}`;
        grouped.set(key, [...(grouped.get(key) ?? []), session]);
    });

    return Array.from(grouped.entries()).map(([key, groupSessions]) => {
        const ordered = [...groupSessions].sort((a, b) => parseRwandaDate(a.startsAt).getTime() - parseRwandaDate(b.startsAt).getTime());
        const startsAt = parseRwandaDate(ordered[0].startsAt);
        const endsAt = parseRwandaDate(ordered[ordered.length - 1].endsAt);
        const campuses = Array.from(new Set(ordered.map((session) => session.campus).filter(Boolean)));
        return {
            key,
            title: getSpecialBaseTitle(ordered[0].title),
            sessions: ordered,
            startsAt,
            endsAt,
            durationLabel: `${formatRwandaDateTimeFromDate(startsAt)} - ${formatRwandaDateTimeFromDate(endsAt)}`,
            campusLabel: campuses.length > 1 ? 'All campuses' : campuses[0] || 'Campus not set',
        };
    }).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
};

const addUtcDays = (date: Date, days: number) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const getDateInputValue = (date: Date) => {
    const pad = (item: number) => String(item).padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const getNextRwandaWeeklyDate = (now: Date, targetDayOfWeek: number, hour: number, minute: number) => {
    const rwanda = getRwandaDateParts(now);
    const currentDayOfWeek = new Date(Date.UTC(rwanda.year, rwanda.month - 1, rwanda.day)).getUTCDay();
    let daysUntil = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
    const candidate = new Date(Date.UTC(rwanda.year, rwanda.month - 1, rwanda.day + daysUntil, hour - 2, minute, 0));

    if (candidate.getTime() <= now.getTime()) {
        daysUntil += 7;
    }

    return new Date(Date.UTC(rwanda.year, rwanda.month - 1, rwanda.day + daysUntil, hour - 2, minute, 0));
};

const formatDuration = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
};

export default DeanAttendance;
