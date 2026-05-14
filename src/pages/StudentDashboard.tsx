import React, { useMemo, useState } from 'react';
import { useEffect } from 'react';
import {
    ClipboardList,
    Landmark,
    UserCheck,
    Wallet,
    IdCard,
    Upload,
    X,
    LayoutDashboard,
    BarChart3,
    Network,
    HandHelping,
    Calendar,
    CircleHelp,
    LogOut,
    TrendingUp,
    ArrowUpRight,
} from 'lucide-react';
import './StudentDashboard.css';
import studentCardFront from '../assets/student-card-front.png';
import studentCardBack from '../assets/student-card-back.png';
import studentCardRightLogo from '../assets/student-card-right-logo.png';

interface StudentDashboardProps {
    navigateTo: (page: string) => void;
    fullName: string;
    studentNumber: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
    gpa: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
    navigateTo,
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
    const [showCardModal, setShowCardModal] = useState(false);
    const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
    const [cardError, setCardError] = useState('');
    const [isGeneratingCard, setIsGeneratingCard] = useState(false);
    const [guildNotice, setGuildNotice] = useState<CampusEvent | null>(null);
    const [guildNotices, setGuildNotices] = useState<CampusEvent[]>([]);
    const [noticePage, setNoticePage] = useState(0);
    const [isLoadingNotice, setIsLoadingNotice] = useState(false);
    const [showNoticeDetails, setShowNoticeDetails] = useState(false);
    const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);

    const handleNavigate = (page: string) => {
        if (navigateTo) {
            navigateTo(page);
        }
    };

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
    const initials = (fullName || 'Student User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((token) => token[0]?.toUpperCase())
        .join('');

    const cardDepartment = useMemo(() => {
        const raw = (department ?? '').trim();
        return raw || 'Department';
    }, [department]);

    const readImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Failed to load image.'));
            image.src = src;
        });

    const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('Failed to read selected image.'));
            reader.readAsDataURL(file);
        });

    const loadFileImage = async (file: File) => {
        const dataUrl = await fileToDataUrl(file);
        return readImage(dataUrl);
    };

    const validatePassportPhoto = async (file: File) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Passport photo must be JPG or PNG.');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Passport photo must be 5MB or smaller.');
        }
        const image = await loadFileImage(file);
        if (image.width < 300 || image.height < 400) {
            throw new Error('Passport photo must be at least 300x400 pixels.');
        }
        const ratio = image.width / image.height;
        if (ratio < 0.7 || ratio > 0.82) {
            throw new Error('Passport photo should match passport ratio (about 3:4).');
        }
        return image;
    };

    const drawPassportImage = (
        context: CanvasRenderingContext2D,
        image: HTMLImageElement,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => {
        const imageRatio = image.width / image.height;
        const boxRatio = width / height;
        let srcWidth = image.width;
        let srcHeight = image.height;
        let srcX = 0;
        let srcY = 0;

        if (imageRatio > boxRatio) {
            srcWidth = image.height * boxRatio;
            srcX = (image.width - srcWidth) / 2;
        } else {
            srcHeight = image.width / boxRatio;
            srcY = (image.height - srcHeight) / 2;
        }

        context.drawImage(image, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
    };

    const cleanTemplateGuides = (context: CanvasRenderingContext2D, width: number, height: number) => {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const pixel = i / 4;
            const x = pixel % width;
            const y = Math.floor(pixel / width);
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const isCyanGuide = r < 140 && g > 150 && b > 150;
            const isMagentaGuide = r > 135 && g < 145 && b > 135;
            const isGuideBlue = b > 150 && r < 120 && g > 90 && g < 190;

            const inPhotoGuideZone = x > 8 && x < 282 && y > 210 && y < 520;
            const inRightGuideZone = x > 250 && x < 795 && y > 190 && y < 545;
            const inTopGuideZone = x > 90 && x < 795 && y > 58 && y < 220;
            const inBottomRightLogoZone = x > 640 && x < 790 && y > 370 && y < 535;

            const shouldCleanZone = inPhotoGuideZone || inRightGuideZone || inTopGuideZone || inBottomRightLogoZone;
            if (shouldCleanZone && (isCyanGuide || isMagentaGuide || isGuideBlue)) {
                if (y >= 112 && y <= 198) {
                    data[i] = 10;
                    data[i + 1] = 100;
                    data[i + 2] = 158;
                } else if (y < 112) {
                    data[i] = 223;
                    data[i + 1] = 235;
                    data[i + 2] = 243;
                } else {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
            }
        }
        context.putImageData(imageData, 0, 0);
    };

    const drawLabeledLine = (
        context: CanvasRenderingContext2D,
        label: string,
        value: string,
        labelX: number,
        valueX: number,
        y: number,
    ) => {
        context.fillStyle = '#0f2345';
        context.font = 'bold 22px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(`${label}:`, labelX, y);

        context.font = '700 22px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
        context.textAlign = 'left';
        context.fillText(value, valueX, y);
    };

    const clearCardPlaceholders = (context: CanvasRenderingContext2D) => {
        context.save();
        context.fillStyle = '#ffffff';

        // Remove photo placeholder text/guide marks before drawing the real passport photo.
        context.fillRect(34, 226, 244, 244);

        // Remove the editable/template helper row boxes on the right panel.
        context.fillRect(272, 216, 380, 36); // level/program strip
        context.fillRect(272, 269, 380, 32); // name strip
        context.fillRect(272, 315, 380, 32); // faculty strip
        context.fillRect(272, 360, 380, 32); // department strip
        context.fillRect(272, 406, 380, 32); // reg strip

        // Remove template placeholders around area/program labels from source.
        context.fillRect(300, 302, 356, 103);
        context.fillRect(280, 432, 372, 78);

        // Remove the template campus placeholder box line.
        context.fillRect(34, 478, 244, 46);

        context.restore();
    };

    const drawRightBottomLogo = async (context: CanvasRenderingContext2D) => {
        const cleanLogo = await readImage(studentCardRightLogo);
        context.fillStyle = '#ffffff';
        context.fillRect(636, 370, 156, 164);
        context.drawImage(cleanLogo, 657, 391, 118, 118);
    };

    const triggerDownload = (canvas: HTMLCanvasElement, filename: string) => {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const generateStudentCard = async () => {
        setCardError('');
        if (!passportPhoto) {
            setCardError('Please upload a passport photo first.');
            return;
        }

        setIsGeneratingCard(true);
        try {
            const [frontTemplate, backTemplate, photoImage] = await Promise.all([
                readImage(studentCardFront),
                readImage(studentCardBack),
                validatePassportPhoto(passportPhoto),
            ]);

            const frontCanvas = document.createElement('canvas');
            frontCanvas.width = frontTemplate.width;
            frontCanvas.height = frontTemplate.height;
            const frontCtx = frontCanvas.getContext('2d');
            if (!frontCtx) throw new Error('Failed to prepare student card canvas.');

            frontCtx.drawImage(frontTemplate, 0, 0);
            cleanTemplateGuides(frontCtx, frontCanvas.width, frontCanvas.height);
            clearCardPlaceholders(frontCtx);
            drawPassportImage(frontCtx, photoImage, 42, 235, 210, 224);
            await drawRightBottomLogo(frontCtx);

            const campus = (faculty ?? '').trim().toLowerCase().includes('information technology')
                ? 'GISHUSHU CAMPUS'
                : 'MASORO CAMPUS';

            frontCtx.fillStyle = '#d91d63';
            frontCtx.font = 'bold 20px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
            frontCtx.textAlign = 'center';
            frontCtx.textBaseline = 'middle';
            frontCtx.fillText(`${cardLevel.toUpperCase()} PROGRAM`, 570, 234);

            drawLabeledLine(frontCtx, 'NAME', fullName || 'Student Name', 438, 458, 286);
            drawLabeledLine(frontCtx, 'FACULTY', faculty || 'Faculty', 438, 458, 336);
            drawLabeledLine(frontCtx, 'DEPARTMENT', cardDepartment, 438, 458, 386);
            drawLabeledLine(frontCtx, 'REG. NO', studentNumber || 'Student ID', 438, 458, 436);
            drawLabeledLine(frontCtx, 'PROGRAM', program || 'Day', 438, 458, 486);

            frontCtx.fillStyle = '#07843f';
            frontCtx.font = 'bold 20px "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
            frontCtx.textAlign = 'left';
            frontCtx.fillText(campus, 62, 502);

            const backCanvas = document.createElement('canvas');
            backCanvas.width = backTemplate.width;
            backCanvas.height = backTemplate.height;
            const backCtx = backCanvas.getContext('2d');
            if (!backCtx) throw new Error('Failed to prepare student card back.');
            backCtx.drawImage(backTemplate, 0, 0);

            const safeId = (studentNumber || 'student').replace(/[^a-zA-Z0-9_-]/g, '');
            triggerDownload(frontCanvas, `student-card-front-${safeId}.png`);
            triggerDownload(backCanvas, `student-card-back-${safeId}.png`);

            setShowCardModal(false);
            setPassportPhoto(null);
        } catch (error) {
            setCardError(error instanceof Error ? error.message : 'Failed to generate student card.');
        } finally {
            setIsGeneratingCard(false);
        }
    };

    return (
        <div className="student-dashboard editorial-dashboard">
            <section className="editorial-body">
                <aside className="editorial-side">
                    <div className="side-profile">
                        <div className="side-avatar">{initials || 'SU'}</div>
                        <div>
                            <strong>{fullName || 'Student User'}</strong>
                            <small>Senior - {faculty}</small>
                        </div>
                    </div>

                    <div className="side-menu">
                        <button className="active"><LayoutDashboard size={16} /> Academic Snapshot</button>
                        <button><BarChart3 size={16} /> Degree Progress</button>
                        <button><Network size={16} /> Service Hub</button>
                        <button><HandHelping size={16} /> Advising</button>
                        <button><Calendar size={16} /> Calendar</button>
                    </div>

                    <button className="side-transcript" onClick={() => handleNavigate('transcript')}>REQUEST TRANSCRIPT</button>
                    <div className="side-bottom-links">
                        <button><CircleHelp size={14} /> Support</button>
                        <button><LogOut size={14} /> Log Out</button>
                    </div>
                </aside>

                <main className="editorial-main">
                    <section className="editorial-hero">
                        <div className="editorial-hero-overlay">
                            <span className="hero-semester">Active Semester - Fall 2024</span>
                            <h1>{fullName || 'Student User'}</h1>
                            <p>{department} - {program} Program</p>
                        </div>
                        <div className="hero-registration">
                            <small>REGISTRATION ID</small>
                            <strong>#{studentNumber}</strong>
                        </div>
                    </section>

                    <section className="velocity-grid">
                        <article className="velocity-card">
                            <div className="velocity-head">
                                <h2>Academic Velocity</h2>
                                <ArrowUpRight size={18} />
                            </div>
                            <div className="velocity-row">
                                <div>
                                    <span>DEGREE COMPLETION</span>
                                    <div className="velocity-track">
                                        <i style={{ width: `${completionPercent}%` }} />
                                    </div>
                                    <small>{credits} of 120 credits completed successfully</small>
                                </div>
                                <strong>{completionPercent}%</strong>
                            </div>
                            <div className="velocity-row">
                                <div>
                                    <span>FINANCIAL CLEARANCE</span>
                                    <div className="velocity-track navy">
                                        <i style={{ width: `${financeClearance}%` }} />
                                    </div>
                                    <small>Balance: pending for graduation eligibility</small>
                                </div>
                                <strong>{financeClearance}%</strong>
                            </div>
                        </article>
                        <div className="velocity-right">
                            <article className="advisory-card">
                                <small>ADVISORY ALERT</small>
                                <p>Your internship documentation is due soon. Please visit the service office.</p>
                            </article>
                            <article className="gpa-card">
                                <small>CURRENT GPA</small>
                                <strong>{normalizedGpa.toFixed(2)}</strong>
                                <p><TrendingUp size={16} /> Top 5% of Faculty</p>
                            </article>
                        </div>
                    </section>

                    <section className="idcard-cta">
                        <button onClick={() => setShowCardModal(true)}>
                            <IdCard size={18} /> Download Student Card
                        </button>
                    </section>

                    <section className="editorial-section">
                        <h2>Service Hub</h2>
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
                                <h3>AUCASA Balance Pulse</h3>
                                <strong>{formatCurrency(financeSummary?.remainingBalance)}</strong>
                                <p>Current association-wide remaining balance based on finance transparency.</p>
                            </article>
                        </div>
                    </section>

                    <section className="course-quick-grid">
                        <div className="courses-panel guild-notice-panel">
                            <h3>GUILD NOTICE BOARD</h3>
                            {isLoadingNotice && (
                                <article className="guild-notice-card">
                                    <strong>Loading latest guild notice...</strong>
                                    <small>Please wait</small>
                                </article>
                            )}
                            {!isLoadingNotice && guildNotices.length === 0 && (
                                <article className="guild-notice-card">
                                    <strong>No upcoming guild notice yet.</strong>
                                    <small>Guild President can post an upcoming activity from the Events module.</small>
                                </article>
                            )}
                            {!isLoadingNotice && guildNotices.length > 0 && (
                                <>
                                <div className="guild-notice-grid">
                                    {pagedNotices.map((notice) => (
                                        <article
                                            key={notice.id}
                                            className="guild-notice-card clickable"
                                            onClick={() => {
                                                setGuildNotice(notice);
                                                setShowNoticeDetails(true);
                                            }}
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
                                        </article>
                                    ))}
                                </div>
                                {guildNotices.length > noticesPerPage && (
                                    <div className="notice-pagination">
                                        <button
                                            type="button"
                                            onClick={() => setNoticePage((prev) => Math.max(0, prev - 1))}
                                            disabled={noticePage === 0}
                                        >
                                            Previous
                                        </button>
                                        <span>{noticePage + 1} / {totalNoticePages}</span>
                                        <button
                                            type="button"
                                            onClick={() => setNoticePage((prev) => Math.min(totalNoticePages - 1, prev + 1))}
                                            disabled={noticePage >= totalNoticePages - 1}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                        <aside className="quick-list">
                            <h3>STUDENT ACTIONS</h3>
                            <button onClick={() => setShowCardModal(true)}><IdCard size={16} /> Download ID Card</button>
                            <button onClick={() => handleNavigate('payments')}><Wallet size={16} /> Open Payments</button>
                            <button onClick={() => handleNavigate('events')}><Calendar size={16} /> View All Events</button>
                        </aside>
                    </section>
                </main>
            </section>

            {showCardModal && (
                <div className="student-card-modal-overlay">
                    <div className="student-card-modal">
                        <div className="student-card-modal-head">
                            <h3>Download Student Card</h3>
                            <button
                                type="button"
                                className="student-card-close"
                                onClick={() => {
                                    setShowCardModal(false);
                                    setCardError('');
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="student-card-details">
                            <div><strong>Level:</strong> Undergraduate</div>
                            <div><strong>Student Name:</strong> {fullName}</div>
                            <div><strong>Student ID:</strong> {studentNumber}</div>
                            <div><strong>Faculty:</strong> {faculty}</div>
                            <div><strong>Department:</strong> {department}</div>
                        </div>

                        <label className="student-card-upload">
                            <Upload size={16} />
                            <span>{passportPhoto ? passportPhoto.name : 'Upload passport photo (JPG/PNG)'}</span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    setPassportPhoto(file);
                                    setCardError('');
                                }}
                            />
                        </label>

                        <div className="passport-guidelines">
                            <strong>Passport Photo Requirements</strong>
                            <p>Use a clear front-facing photo, white/plain background, JPG or PNG, minimum 300x400px, and approximately 3:4 ratio.</p>
                        </div>

                        {cardError && <p className="student-card-error">{cardError}</p>}

                        <button
                            type="button"
                            className="student-card-generate"
                            onClick={() => void generateStudentCard()}
                            disabled={isGeneratingCard}
                        >
                            {isGeneratingCard ? 'Generating...' : 'Generate & Download Card'}
                        </button>
                    </div>
                </div>
            )}

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


