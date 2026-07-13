import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, FileDown, FileSpreadsheet, FileText, IdCard, Search, XCircle } from 'lucide-react';
import aucaLogo from '../assets/auca-logo.png';
import { downloadStudentCard } from '../utils/studentCardRenderer';
import './StudentCardManager.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';
const REPORT_LOGO_WIDTH = 72;
const EXCEL_LOGO_WIDTH = 58;

type CardApplication = {
    id: number;
    studentNumber: string;
    studentName: string;
    faculty: string;
    department: string;
    program: string;
    status: 'PENDING' | 'PRINTED';
    appliedAt?: string;
    printedAt?: string;
    printedByName?: string;
    replacementRequest?: boolean;
    financeReceiptUploaded?: boolean;
    receiptUploadedAt?: string;
    financeReceiptStatus?: 'NOT_REQUIRED' | 'WAITING_UPLOAD' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    financeReceiptMessage?: string;
    photoReviewStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    photoReviewMessage?: string;
};

type StudentCardManagerProps = {
    managerUserId: number;
};

const StudentCardManager = ({ managerUserId }: StudentCardManagerProps) => {
    const [applications, setApplications] = useState<CardApplication[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'printed'>('pending');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [viewedReceiptIds, setViewedReceiptIds] = useState<Set<number>>(new Set());
    const pageSize = 4;

    const loadApplications = async () => {
        setIsLoading(true);
        setError('');
        try {
            const suffix = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
            const response = await fetch(`${API_BASE}/api/student-cards${suffix}`);
            const data = await response.json().catch(() => []);
            if (!response.ok || !Array.isArray(data)) {
                throw new Error(data.error ?? 'Failed to load student card requests.');
            }
            setApplications(data as CardApplication[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load student card requests.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadApplications();
    }, [statusFilter]);

    const filteredApplications = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return applications;
        return applications.filter((item) => [
            item.studentName,
            item.studentNumber,
            item.faculty,
            item.department,
            item.status,
        ].some((value) => String(value ?? '').toLowerCase().includes(query)));
    }, [applications, search]);

    const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
    const rows = filteredApplications.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);

    const exportRows = filteredApplications.length ? filteredApplications : applications;

    const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const getLogoDataUrl = async () => {
        try {
            const response = await fetch(aucaLogo);
            const blob = await response.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            });
        } catch {
            return aucaLogo;
        }
    };

    const needsReceiptReview = (application: CardApplication) =>
        Boolean(
            application.replacementRequest ||
            application.financeReceiptUploaded ||
            (application.financeReceiptStatus && application.financeReceiptStatus !== 'NOT_REQUIRED')
        );

    const receiptStatusLabel = (application: CardApplication) => {
        if (!needsReceiptReview(application)) return 'Not required';
        if (application.financeReceiptStatus === 'APPROVED') return 'Approved';
        if (application.financeReceiptStatus === 'REJECTED') return 'Rejected';
        if (application.financeReceiptUploaded) return 'Needs review';
        return 'Waiting upload';
    };

    const receiptStatusMessage = (application: CardApplication) => {
        if (application.financeReceiptMessage) return application.financeReceiptMessage;
        if (!needsReceiptReview(application)) return 'This is a first card request, so no finance receipt is needed.';
        if (application.financeReceiptUploaded) return 'Open the uploaded receipt, then approve it if it is valid or reject it if it is fake.';
        return 'The student must upload the finance office receipt before this replacement card can be printed.';
    };

    const photoStatusLabel = (application: CardApplication) => {
        if (application.photoReviewStatus === 'APPROVED') return 'Approved';
        if (application.photoReviewStatus === 'REJECTED') return 'Rejected';
        return 'Needs review';
    };

    const photoStatusMessage = (application: CardApplication) => {
        if (application.photoReviewMessage) return application.photoReviewMessage;
        if (application.photoReviewStatus === 'REJECTED') return 'The student must upload a new proper passport photo.';
        return 'Check that the passport photo is clear and proper before printing.';
    };

    const printedDetails = (application: CardApplication) => {
        const date = application.printedAt ? new Date(application.printedAt).toLocaleDateString() : 'date not recorded';
        const manager = application.printedByName ? ` by ${application.printedByName}` : '';
        return `Printed ${date}${manager}`;
    };

    const buildReportHtml = (logoSrc: string, printMode = false) => {
        const filterLabel = statusFilter === 'all' ? 'All requests' : `${statusFilter.charAt(0).toUpperCase()}${statusFilter.slice(1)} requests`;
        const generatedAt = new Date().toLocaleString();
        const htmlRows = exportRows.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.studentNumber)}</td>
                <td>${escapeHtml(item.studentName)}</td>
            </tr>
        `).join('');

        return `
            <!doctype html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>AUCA Student Card Applications</title>
                    <style>
                        @page { margin: 18mm 14mm; }
                        * { box-sizing: border-box; }
                        body {
                            color: #10213d;
                            font-family: Arial, Helvetica, sans-serif;
                            margin: 0;
                            padding: ${printMode ? '0' : '24px'};
                        }
                        .report-shell { border: 1px solid #dbe4f0; }
                        .report-header {
                            align-items: center;
                            background: #f4f8fe;
                            border-bottom: 3px solid #2f4f86;
                            display: flex;
                            gap: 16px;
                            padding: 18px 20px;
                        }
                        .report-header img {
                            height: ${REPORT_LOGO_WIDTH}px;
                            object-fit: contain;
                            width: ${REPORT_LOGO_WIDTH}px;
                        }
                        .report-header h1 {
                            color: #0b2d5c;
                            font-size: 24px;
                            margin: 0 0 4px;
                        }
                        .report-header p {
                            color: #526982;
                            font-size: 13px;
                            font-weight: 700;
                            margin: 0;
                        }
                        table {
                            border-collapse: collapse;
                            margin: 18px 20px 20px;
                            width: calc(100% - 40px);
                        }
                        th {
                            background: #2f4f86;
                            color: #ffffff;
                            font-size: 11px;
                            padding: 9px 8px;
                            text-align: left;
                            text-transform: uppercase;
                        }
                        td {
                            border: 1px solid #dbe4f0;
                            color: #173462;
                            font-size: 12px;
                            padding: 8px;
                        }
                        tr:nth-child(even) td { background: #f8fbff; }
                        .empty {
                            color: #64748b;
                            font-weight: 700;
                            padding: 18px;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="report-shell">
                        <div class="report-header">
                            <img src="${logoSrc}" alt="AUCA logo" />
                            <div>
                                <h1>AUCA Student Card Applications</h1>
                                <p>Student Card Office Report • ${escapeHtml(filterLabel)} • Generated ${escapeHtml(generatedAt)}</p>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student ID</th>
                                    <th>Names</th>
                                </tr>
                            </thead>
                            <tbody>${htmlRows || '<tr><td colspan="3" class="empty">No student card records found.</td></tr>'}</tbody>
                        </table>
                    </div>
                </body>
            </html>
        `;
    };

    const buildExcelReportHtml = (logoSrc: string) => {
        const filterLabel = statusFilter === 'all' ? 'All requests' : `${statusFilter.charAt(0).toUpperCase()}${statusFilter.slice(1)} requests`;
        const generatedAt = new Date().toLocaleString();
        const htmlRows = exportRows.map((item, index) => `
            <tr>
                <td class="number">${index + 1}</td>
                <td>${escapeHtml(item.studentNumber)}</td>
                <td>${escapeHtml(item.studentName)}</td>
            </tr>
        `).join('');

        return `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8" />
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>Student Cards</x:Name>
                                    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                                </x:ExcelWorksheet>
                            </x:ExcelWorksheets>
                        </x:ExcelWorkbook>
                    </xml>
                    <![endif]-->
                    <style>
                        table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; }
                        td, th { border: 1px solid #c8d6ea; font-size: 11pt; padding: 7px; vertical-align: middle; }
                        .sheet { width: 100%; }
                        .logo-cell { background: #f4f8fe; border-bottom: 3px solid #2f4f86; text-align: center; width: 96px; }
                        .logo-cell img { height: ${EXCEL_LOGO_WIDTH}px; width: ${EXCEL_LOGO_WIDTH}px; }
                        .title-cell { background: #f4f8fe; border-bottom: 3px solid #2f4f86; color: #0b2d5c; font-size: 20pt; font-weight: 700; }
                        .subtitle { color: #526982; font-size: 10pt; font-weight: 700; }
                        .spacer td { border: 0; height: 10px; padding: 0; }
                        .table-head th { background: #2f4f86; color: #ffffff; font-size: 10pt; font-weight: 700; text-align: left; }
                        .number { text-align: center; }
                        .empty { color: #64748b; font-weight: 700; text-align: center; }
                    </style>
                </head>
                <body>
                    <table class="sheet">
                        <colgroup>
                            <col style="width: 45px;" />
                            <col style="width: 120px;" />
                            <col style="width: 260px;" />
                        </colgroup>
                        <tr>
                            <td class="logo-cell" rowspan="2"><img src="${logoSrc}" alt="AUCA logo" /></td>
                            <td class="title-cell" colspan="2">AUCA Student Card Applications</td>
                        </tr>
                        <tr>
                            <td class="subtitle" colspan="2">Student Card Office Report | ${escapeHtml(filterLabel)} | Generated ${escapeHtml(generatedAt)}</td>
                        </tr>
                        <tr class="spacer"><td colspan="3"></td></tr>
                        <tr class="table-head">
                            <th>#</th>
                            <th>Student ID</th>
                            <th>Names</th>
                        </tr>
                        ${htmlRows || '<tr><td colspan="3" class="empty">No student card records found.</td></tr>'}
                    </table>
                </body>
            </html>
        `;
    };

    const exportExcel = async () => {
        const logoDataUrl = await getLogoDataUrl();
        const reportHtml = buildExcelReportHtml(logoDataUrl);
        const blob = new Blob([reportHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'auca-student-card-applications.xls';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const exportPdf = async () => {
        const logoDataUrl = await getLogoDataUrl();
        const printWindow = window.open('', '_blank', 'width=980,height=720');
        if (!printWindow) {
            setError('Popup blocked. Allow popups to export PDF.');
            return;
        }
        printWindow.document.write(buildReportHtml(logoDataUrl, true));
        printWindow.document.close();
        printWindow.focus();
        printWindow.addEventListener('load', () => printWindow.print(), { once: true });
    };

    const handleDownload = async (application: CardApplication) => {
        setBusyId(application.id);
        setError('');
        setSuccess('');
        try {
            await downloadStudentCard({
                fullName: application.studentName,
                studentNumber: application.studentNumber,
                faculty: application.faculty,
                department: application.department,
                program: application.program || 'Day',
            }, `${API_BASE}/api/student-cards/${application.id}/photo`);
            setSuccess(`Student card files prepared for ${application.studentName}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download student card.');
        } finally {
            setBusyId(null);
        }
    };

    const handleMarkPrinted = async (application: CardApplication) => {
        setBusyId(application.id);
        setError('');
        setSuccess('');
        try {
            const requestBody = managerUserId > 0 ? { managerUserId } : {};
            const response = await fetch(`${API_BASE}/api/student-cards/${application.id}/printed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to mark card as printed.');
            }
            setSuccess(`${application.studentName}'s card is now marked as printed.`);
            await loadApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark card as printed.');
            await loadApplications();
        } finally {
            setBusyId(null);
        }
    };

    const handleViewReceipt = async (application: CardApplication) => {
        if (!application.financeReceiptUploaded) {
            setError('No receipt has been uploaded for this request yet.');
            return;
        }
        const receiptWindow = window.open('', '_blank', 'width=980,height=720');
        if (!receiptWindow) {
            setError('Popup blocked. Allow popups to view the uploaded receipt.');
            return;
        }
        receiptWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Loading receipt...</p>');
        receiptWindow.document.close();

        try {
            const response = await fetch(`${API_BASE}/api/student-cards/${application.id}/finance-receipt`);
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error ?? 'Receipt file is not available.');
            }

            const receiptBlob = await response.blob();
            const receiptUrl = URL.createObjectURL(receiptBlob);
            receiptWindow.location.href = receiptUrl;
            setTimeout(() => URL.revokeObjectURL(receiptUrl), 60_000);
            setError('');
            setViewedReceiptIds((current) => new Set(current).add(application.id));
        } catch (err) {
            receiptWindow.close();
            setError(err instanceof Error ? err.message : 'Failed to open uploaded receipt.');
        }
    };

    const reviewReceipt = async (application: CardApplication, approved: boolean) => {
        if (approved && !viewedReceiptIds.has(application.id)) {
            setError('Open and review the uploaded receipt before approving it.');
            return;
        }
        if (!application.financeReceiptUploaded && approved) {
            setError('The student has not uploaded a receipt yet, so it cannot be approved.');
            return;
        }
        setBusyId(application.id);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE}/api/student-cards/${application.id}/finance-receipt/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approved,
                    message: approved
                        ? 'Finance receipt approved. Your replacement card can now be printed.'
                        : application.financeReceiptUploaded
                            ? 'The uploaded finance receipt was rejected because it appears to be fake. Please upload a valid receipt from the finance office.'
                            : 'Your replacement card request was rejected because the finance office receipt was not uploaded. Please upload a valid receipt and try again.',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to review finance receipt.');
            }
            setSuccess(approved ? 'Finance receipt approved.' : 'Finance receipt rejected and student was notified.');
            await loadApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to review finance receipt.');
        } finally {
            setBusyId(null);
        }
    };

    const rejectPhoto = async (application: CardApplication) => {
        const message = window.prompt(
            'Why are you rejecting this passport photo?',
            'Passport photo is not proper. Please upload a clear passport photo with a plain background.'
        );
        if (message === null) return;
        setBusyId(application.id);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE}/api/student-cards/${application.id}/photo/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approved: false,
                    message: message.trim() || 'Passport photo was rejected. Please upload a clear, proper passport photo.',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to reject passport photo.');
            }
            setSuccess('Passport photo rejected. Student can upload a new photo.');
            await loadApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject passport photo.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="student-card-manager-page">
            <section className="card-manager-hero">
                <div>
                    <span>Student Card Office</span>
                    <h1>Student Card Management</h1>
                    <p>Review requests, download printable cards, and mark cards after printing.</p>
                </div>
                <IdCard size={24} />
            </section>

            {error && <div className="card-manager-alert error">{error}</div>}
            {success && <div className="card-manager-alert success">{success}</div>}

            <section className="card-manager-panel">
                <div className="card-manager-toolbar">
                    <div className="card-manager-tabs">
                        <button className={statusFilter === 'pending' ? 'active' : ''} onClick={() => { setStatusFilter('pending'); setPage(1); }}>Pending</button>
                        <button className={statusFilter === 'printed' ? 'active' : ''} onClick={() => { setStatusFilter('printed'); setPage(1); }}>Printed</button>
                        <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => { setStatusFilter('all'); setPage(1); }}>All</button>
                    </div>
                    <label className="card-manager-search">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                            placeholder="Search student cards..."
                        />
                    </label>
                    <div className="card-manager-export-actions">
                        <button type="button" onClick={() => void exportExcel()}>
                            <FileSpreadsheet size={15} />
                            Excel
                        </button>
                        <button type="button" onClick={() => void exportPdf()}>
                            <FileDown size={15} />
                            PDF
                        </button>
                    </div>
                </div>

                <div className="card-request-grid">
                    {isLoading && <div className="card-manager-empty">Loading student card requests...</div>}
                    {!isLoading && rows.length === 0 && <div className="card-manager-empty">No student card requests found.</div>}
                    {!isLoading && rows.map((application) => {
                        const isPrinted = application.status === 'PRINTED';
                        const receiptViewed = viewedReceiptIds.has(application.id);
                        return (
                            <article key={application.id} className="card-request-card">
                                <img src={`${API_BASE}/api/student-cards/${application.id}/photo`} alt={`${application.studentName} passport`} />
                                <div className="card-request-main">
                                    <div className="card-request-title">
                                        <div>
                                            <h3>{application.studentName}</h3>
                                            <span>{application.studentNumber}</span>
                                        </div>
                                        <em className={isPrinted ? 'printed' : ''}>{isPrinted ? 'Printed' : 'Pending'}</em>
                                    </div>
                                    <p>{application.faculty || 'Faculty not set'} - {application.department || 'Department not set'}</p>
                                    <small>Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'recently'}</small>
                                    {isPrinted && <small className="card-request-printed-details">{printedDetails(application)}</small>}
                                    <div className={`receipt-review-strip photo-${(application.photoReviewStatus || 'pending-review').toLowerCase().replaceAll('_', '-')}`}>
                                        <strong>Passport photo: {photoStatusLabel(application)}</strong>
                                        <span>{photoStatusMessage(application)}</span>
                                        {!isPrinted && (
                                            <div className="receipt-review-inline-actions">
                                                {application.photoReviewStatus === 'REJECTED' ? (
                                                    <span className="receipt-rejected-state">
                                                        <XCircle size={15} />
                                                        Photo Rejected
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="reject-receipt"
                                                        onClick={() => void rejectPhoto(application)}
                                                        disabled={busyId === application.id}
                                                    >
                                                        <XCircle size={15} />
                                                        Reject Photo
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`receipt-review-strip ${(application.financeReceiptStatus || 'not-required').toLowerCase().replaceAll('_', '-')}`}>
                                        <strong>Finance receipt: {receiptStatusLabel(application)}</strong>
                                        <span>{receiptStatusMessage(application)}</span>
                                        {!isPrinted && needsReceiptReview(application) && (
                                            <div className="receipt-review-inline-actions">
                                                <button
                                                    type="button"
                                                    className="view-receipt"
                                                    onClick={() => void handleViewReceipt(application)}
                                                    disabled={!application.financeReceiptUploaded}
                                                    title={!application.financeReceiptUploaded ? 'The student has not uploaded a receipt yet.' : undefined}
                                                >
                                                    <FileText size={15} />
                                                    {receiptViewed ? 'Receipt Viewed' : 'View Receipt'}
                                                </button>
                                                {application.financeReceiptUploaded && (
                                                    <button
                                                        type="button"
                                                        className="approve-receipt"
                                                        onClick={() => void reviewReceipt(application, true)}
                                                        disabled={busyId === application.id || application.financeReceiptStatus === 'APPROVED' || !receiptViewed}
                                                        title={!receiptViewed ? 'View the uploaded receipt first.' : undefined}
                                                    >
                                                        <CheckCircle2 size={15} />
                                                        Approve
                                                    </button>
                                                )}
                                                {application.financeReceiptStatus === 'REJECTED' ? (
                                                    <span className="receipt-rejected-state">
                                                        <XCircle size={15} />
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="reject-receipt"
                                                        onClick={() => void reviewReceipt(application, false)}
                                                        disabled={busyId === application.id || Boolean(application.financeReceiptUploaded && !receiptViewed)}
                                                        title={application.financeReceiptUploaded && !receiptViewed ? 'View the uploaded receipt first.' : undefined}
                                                    >
                                                        <XCircle size={15} />
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-request-actions">
                                        <button type="button" onClick={() => void handleDownload(application)} disabled={busyId === application.id}>
                                            <Download size={15} />
                                            Download Card
                                        </button>
                                        {!isPrinted && (
                                            <button
                                                type="button"
                                                className="mark-printed"
                                                onClick={() => void handleMarkPrinted(application)}
                                                disabled={busyId === application.id || application.photoReviewStatus === 'REJECTED' || Boolean(needsReceiptReview(application) && application.financeReceiptStatus !== 'APPROVED')}
                                                title={application.photoReviewStatus === 'REJECTED'
                                                    ? 'Student must upload a new passport photo first.'
                                                    : needsReceiptReview(application) && application.financeReceiptStatus !== 'APPROVED'
                                                        ? 'Approve the finance receipt first.'
                                                        : undefined}
                                            >
                                                <CheckCircle2 size={15} />
                                                Mark Printed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="card-manager-pagination">
                    <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
                    <div>
                        <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                        <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StudentCardManager;
