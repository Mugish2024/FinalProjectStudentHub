import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CalendarCheck2, Landmark, LayoutDashboard, Megaphone, WalletCards } from 'lucide-react';
import './FinancePaymentReview.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type ReceiptItem = {
    id: number;
    studentNumber: string;
    studentName?: string;
    amount: number;
    currency: string;
    externalReference?: string;
    payerPhoneNumber?: string;
    receiptStatus?: string;
    method?: string;
    ocrStudentNumber?: string;
    registryMatchStatus?: string;
};

type FinanceTab = 'overview' | 'budget-control' | 'expenses' | 'statements' | 'receipts';
type ExpenseCategory = 'operations' | 'events' | 'transport' | 'welfare' | 'equipment' | 'communication' | 'other';
type ExpenseMethod = 'cash' | 'bank' | 'mobile_money';
type UserRole = 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president' | null;
type FundRequestType = 'assigned_budget' | 'specific_request';
type FundRequestStatus = 'pending_guild_approval' | 'pending_chief_finance_approval' | 'approved' | 'rejected' | 'cancelled';

type FundRequestItem = {
    id: number;
    budgetId?: number | null;
    budgetTitle?: string | null;
    requestType: FundRequestType;
    status: FundRequestStatus;
    title: string;
    department: string;
    requestedBy: string;
    purpose: string;
    requestedAmount: number;
    approvedAmount?: number | null;
    spentAmount: number;
    remainingApprovedAmount: number;
    allocationStartDate: string;
    allocationEndDate: string;
    guildReviewNote?: string;
    chiefFinanceReviewNote?: string;
    communicationMessage?: string;
    invoiceAttachmentPath?: string;
};

type ExpenseItem = {
    id: number;
    budgetTitle?: string | null;
    fundRequestId?: number | null;
    fundRequestTitle?: string | null;
    expenseDate: string;
    category: ExpenseCategory;
    amount: number;
    method: ExpenseMethod;
    vendor: string;
    description: string;
    receiptAttachmentPath?: string | null;
};

type FinancialStatement = {
    asOfDate: string;
    totalAssignedBudget: number;
    totalUsedBudget: number;
    totalRemainingBudget: number;
    incomeStatement: {
        totalRevenue: number;
        totalExpense: number;
        netSurplus: number;
    };
    balanceSheet: {
        cashAndBank: number;
        receivables: number;
        totalAssets: number;
        liabilities: number;
        equity: number;
    };
};

type TransparencySummary = {
    totalCollected: number;
    totalApproved: number;
    totalSpent: number;
    remainingBalance: number;
    activeApprovedRequests: number;
    latestUpdates: Array<{
        id: number;
        title: string;
        message: string;
        publishedBy: string;
        createdAt: string;
    }>;
};

type FundRequestForm = {
    title: string;
    purpose: string;
    requestedAmount: string;
    allocationStartDate: string;
    allocationEndDate: string;
};

type ExpenseForm = {
    fundRequestId: string;
    expenseDate: string;
    category: ExpenseCategory;
    amount: string;
    method: ExpenseMethod;
    vendor: string;
    description: string;
};

interface FinancePaymentReviewProps {
    initialTab?: FinanceTab;
    currentUserRole?: UserRole;
    currentUserName?: string;
}

const toCurrency = (value: number) =>
    new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);

const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const FinancePaymentReview = ({
    initialTab = 'overview',
    currentUserRole = 'finance',
    currentUserName = 'Finance Office',
}: FinancePaymentReviewProps) => {
    const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [fundRequests, setFundRequests] = useState<FundRequestItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [statement, setStatement] = useState<FinancialStatement | null>(null);
    const [transparency, setTransparency] = useState<TransparencySummary | null>(null);
    const [receipts, setReceipts] = useState<ReceiptItem[]>([]);

    const [notes, setNotes] = useState<Record<number, string>>({});
    const [importSummary, setImportSummary] = useState('');
    const [importing, setImporting] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [publishTitle, setPublishTitle] = useState('');
    const [publishMessage, setPublishMessage] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [decisionModal, setDecisionModal] = useState<{ open: boolean; requestId: number | null; decision: 'APPROVE' | 'REJECT' }>({
        open: false,
        requestId: null,
        decision: 'APPROVE',
    });
    const [decisionReason, setDecisionReason] = useState('');
    const [requestInvoiceFile, setRequestInvoiceFile] = useState<File | null>(null);
    const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
    const pageSize = 10;

    const [fundRequestForm, setFundRequestForm] = useState<FundRequestForm>({
        title: '',
        purpose: '',
        requestedAmount: '',
        allocationStartDate: new Date().toISOString().slice(0, 10),
        allocationEndDate: new Date().toISOString().slice(0, 10),
    });

    const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
        fundRequestId: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        category: 'operations',
        amount: '',
        method: 'mobile_money',
        vendor: '',
        description: '',
    });

    const loadCoreFinanceData = async () => {
        const [fundRes, expenseRes, reportRes, transparencyRes] = await Promise.all([
            fetch(`${API_BASE}/api/finance/fund-requests`),
            fetch(`${API_BASE}/api/finance/expenses`),
            fetch(`${API_BASE}/api/finance/reports/financial-statement`),
            fetch(`${API_BASE}/api/finance/transparency/summary`),
        ]);

        const fundData = await fundRes.json().catch(() => []);
        const expenseData = await expenseRes.json().catch(() => []);
        const reportData = await reportRes.json().catch(() => null);
        const transparencyData = await transparencyRes.json().catch(() => null);

        if (!fundRes.ok || !expenseRes.ok || !reportRes.ok || !transparencyRes.ok) {
            throw new Error('Failed to load finance control data.');
        }

        setFundRequests(Array.isArray(fundData) ? fundData : []);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setStatement(reportData);
        setTransparency(transparencyData);
    };

    const loadReceipts = async () => {
        const response = await fetch(`${API_BASE}/api/payments/receipts/review`);
        const data = await response.json().catch(() => []);
        if (!response.ok) {
            throw new Error('Failed to load receipts.');
        }
        setReceipts(Array.isArray(data) ? data : []);
    };

    const refreshAll = async () => {
        setIsLoading(true);
        try {
            await Promise.all([loadCoreFinanceData(), loadReceipts()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load finance dashboard.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void refreshAll();
    }, []);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const approvedRequests = useMemo(
        () => fundRequests.filter((item) => item.status === 'approved' && Number(item.remainingApprovedAmount || 0) > 0),
        [fundRequests],
    );

    const categoryTotals = useMemo(() => {
        const map = new Map<string, number>();
        expenses.forEach((item) => {
            map.set(item.category, (map.get(item.category) ?? 0) + Number(item.amount || 0));
        });
        return Array.from(map.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 4);
    }, [expenses]);

    const filteredReceipts = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return receipts;
        return receipts.filter((item) =>
            [
                item.ocrStudentNumber,
                item.studentNumber,
                item.studentName,
                item.externalReference,
                item.payerPhoneNumber,
                item.method,
                item.receiptStatus,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        );
    }, [receipts, search]);

    const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pagedReceipts = filteredReceipts.slice(startIndex, startIndex + pageSize);

    const statusClass = (value?: string) => {
        const normalized = (value ?? '').toUpperCase();
        if (normalized === 'VALID') return 'chip chip--ok';
        if (normalized === 'PENDING') return 'chip chip--warn';
        if (normalized === 'REJECTED') return 'chip chip--bad';
        return 'chip';
    };

    const isAdminView = currentUserRole === 'admin';

    const fundRequestStatusClass = (status: FundRequestStatus) => {
        if (status === 'approved') return 'chip chip--ok';
        if (status === 'rejected' || status === 'cancelled') return 'chip chip--bad';
        return 'chip chip--warn';
    };

    const openFinanceDocument = (storedPath?: string | null) => {
        if (!storedPath) return;
        const target = `${API_BASE}/api/finance/documents/view?path=${encodeURIComponent(storedPath)}`;
        window.open(target, '_blank', 'noopener,noreferrer');
    };

    const visibleFundRequests = useMemo(() => {
        if (requestFilter === 'approved') {
            return fundRequests.filter((item) => item.status === 'approved');
        }
        if (requestFilter === 'pending') {
            return fundRequests.filter(
                (item) => item.status === 'pending_chief_finance_approval' || item.status === 'pending_guild_approval',
            );
        }
        return fundRequests;
    }, [fundRequests, requestFilter]);

    const submitFundRequest = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        if (!requestInvoiceFile) {
            setError('Please upload an invoice before submitting the request.');
            return;
        }
        const invoiceUpload = new FormData();
        invoiceUpload.append('type', 'invoice');
        invoiceUpload.append('file', requestInvoiceFile);
        const uploadResponse = await fetch(`${API_BASE}/api/finance/documents/upload`, {
            method: 'POST',
            body: invoiceUpload,
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
            setError(uploadData.error ?? 'Failed to upload invoice.');
            return;
        }
        const payload = {
            ...fundRequestForm,
            requestType: 'specific_request',
            department: 'Finance Office',
            requestedBy: currentUserName,
            actorRole: currentUserRole ?? 'finance',
            invoiceAttachmentPath: uploadData.storedPath ?? '',
        };
        const response = await fetch(`${API_BASE}/api/finance/fund-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to submit fund request.');
            return;
        }
        if (data.status === 'rejected') {
            setSuccess('Request was auto-rejected because it exceeds currently collected money. Check the decision note.');
        } else {
            setSuccess('Budget request submitted. Waiting for Chief Finance approval.');
        }
        setFundRequestForm((prev) => ({
            ...prev,
            title: '',
            purpose: '',
            requestedAmount: '',
        }));
        setRequestInvoiceFile(null);
        setShowRequestModal(false);
        await loadCoreFinanceData();
    };

    const reviewFundRequest = async (requestId: number, decision: 'APPROVE' | 'REJECT', note: string) => {
        setError('');
        setSuccess('');
        if (!note.trim()) {
            setError('Reason is required for approval or rejection.');
            return;
        }
        const payload = {
            actorRole: currentUserRole ?? '',
            decision,
            note,
        };
        const response = await fetch(`${API_BASE}/api/finance/fund-requests/${requestId}/chief-review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to review request.');
            return;
        }
        setSuccess(
            data.status === 'rejected'
                ? 'Request was rejected. Decision note has been recorded and is visible in the register.'
                : 'Request status updated.'
        );
        setDecisionModal({ open: false, requestId: null, decision: 'APPROVE' });
        setDecisionReason('');
        await loadCoreFinanceData();
    };

    const submitExpense = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        if (!expenseReceiptFile) {
            setError('Please upload the receipt before posting this expense.');
            return;
        }
        const receiptUpload = new FormData();
        receiptUpload.append('type', 'receipt');
        receiptUpload.append('file', expenseReceiptFile);
        const uploadResponse = await fetch(`${API_BASE}/api/finance/documents/upload`, {
            method: 'POST',
            body: receiptUpload,
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
            setError(uploadData.error ?? 'Failed to upload receipt.');
            return;
        }
        const payload = {
            ...expenseForm,
            fundRequestId: Number(expenseForm.fundRequestId),
            receiptAttachmentPath: uploadData.storedPath ?? '',
        };
        const response = await fetch(`${API_BASE}/api/finance/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to post expense.');
            return;
        }
        setSuccess('Expense posted successfully.');
        setExpenseForm({
            fundRequestId: '',
            expenseDate: new Date().toISOString().slice(0, 10),
            category: 'operations',
            amount: '',
            method: 'mobile_money',
            vendor: '',
            description: '',
        });
        setExpenseReceiptFile(null);
        setShowExpenseModal(false);
        await loadCoreFinanceData();
    };

    const publishUpdate = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        const response = await fetch(`${API_BASE}/api/finance/transparency/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: publishTitle,
                message: publishMessage,
                publishedBy: currentUserName,
                actorRole: currentUserRole ?? 'finance',
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to publish student update.');
            return;
        }
        setSuccess('Student transparency update published.');
        setPublishTitle('');
        setPublishMessage('');
        setTransparency(data);
    };

    const verifyReceipt = async (id: number, decision: 'VALID' | 'REJECTED') => {
        setError('');
        const response = await fetch(`${API_BASE}/api/payments/${id}/receipt/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision, notes: notes[id] ?? '' }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to verify receipt.');
            return;
        }
        setSuccess(`Receipt ${decision === 'VALID' ? 'validated' : 'rejected'}.`);
        await loadReceipts();
    };

    const importTransactions = async (file: File) => {
        setError('');
        setImportSummary('');
        setImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${API_BASE}/api/payments/transactions/import`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to import transaction list.');
                return;
            }
            setImportSummary(`Imported ${data.imported ?? 0}. Skipped ${data.duplicates ?? 0}. Errors ${data.errors ?? 0}.`);
            await loadReceipts();
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="finance-main finance-main--full">
            {error && <div className="banner banner--error">{error}</div>}
            {success && <div className="banner banner--ok">{success}</div>}
            {importSummary && <div className="banner banner--ok">{importSummary}</div>}

            {activeTab === 'overview' && (
                <>
                    <section className="hero-card">
                        <div>
                            <p className="kicker">Institutional Oversight</p>
                            <h2>Finance Control Center</h2>
                            <p>Track collected fees, approved requests, daily spending, and student-facing accountability updates.</p>
                        </div>
                        <div className="hero-icon">
                            <Landmark size={28} />
                        </div>
                    </section>

                    <section className="kpi-row">
                        <article className="kpi">
                            <small>Total Collected</small>
                            <strong>{toCurrency(transparency?.totalCollected ?? 0)}</strong>
                            <span>From verified student association payments</span>
                        </article>
                        <article className="kpi kpi--dark">
                            <small>Total Approved</small>
                            <strong>{toCurrency(transparency?.totalApproved ?? 0)}</strong>
                            <div className="kpi-progress"><span /></div>
                        </article>
                        <article className="kpi">
                            <small>Total Spent</small>
                            <strong>{toCurrency(transparency?.totalSpent ?? 0)}</strong>
                            <span>{transparency?.activeApprovedRequests ?? 0} active approved requests</span>
                        </article>
                        <article className="kpi">
                            <small>Remaining Balance</small>
                            <strong className="good">{toCurrency(transparency?.remainingBalance ?? 0)}</strong>
                            <span>Communicate this regularly to students</span>
                        </article>
                    </section>

                    <section className="overview-grid">
                        <article className="tile" onClick={() => setActiveTab('budget-control')}>
                            <WalletCards size={24} />
                            <h3>Budget & Approvals</h3>
                            <p>Submit requests and follow guild then chief-finance workflow.</p>
                        </article>
                        <article className="tile" onClick={() => setActiveTab('expenses')}>
                            <CalendarCheck2 size={24} />
                            <h3>Controlled Expenses</h3>
                            <p>Post spending only against approved fund requests.</p>
                        </article>
                        <article className="tile" onClick={() => setActiveTab('statements')}>
                            <LayoutDashboard size={24} />
                            <h3>Financial Statements</h3>
                            <p>Income statement and balance sheet with export-ready format.</p>
                        </article>
                        <article className="tile" onClick={() => setActiveTab('receipts')}>
                            <BadgeCheck size={24} />
                            <h3>Receipt Validation</h3>
                            <p>Validate student payments before they enter collected funds.</p>
                        </article>

                        <article className="panel">
                            <h3>Publish Student Update</h3>
                            <form className="form-grid" onSubmit={publishUpdate}>
                                <input
                                    placeholder="Update title"
                                    value={publishTitle}
                                    onChange={(e) => setPublishTitle(e.target.value)}
                                    required
                                />
                                <textarea
                                    rows={3}
                                    placeholder="Explain how funds were used and what remains."
                                    value={publishMessage}
                                    onChange={(e) => setPublishMessage(e.target.value)}
                                    required
                                />
                                <button type="submit">
                                    <Megaphone size={14} /> Publish Update
                                </button>
                            </form>
                        </article>

                        <article className="widget">
                            <h3>Recent Student Updates</h3>
                            <div className="cat-list">
                                {(transparency?.latestUpdates ?? []).map((item) => (
                                    <div key={item.id} className="cat-row">
                                        <div className="cat-head">
                                            <span>{item.title}</span>
                                            <strong>{formatDate(item.createdAt)}</strong>
                                        </div>
                                        <p>{item.message}</p>
                                    </div>
                                ))}
                                {(transparency?.latestUpdates ?? []).length === 0 && <p className="empty">No published updates yet.</p>}
                            </div>
                        </article>
                    </section>
                </>
            )}

            {activeTab === 'budget-control' && (
                <section className="budget-registry-page">
                    <div className="registry-layout">
                        <header className="registry-header-block">
                            <p className="kicker">Financial Operations</p>
                            <h2>Budget Registry</h2>
                            <p>
                                Manage institutional resource allocations. Every request undergoes a rigorous vetting process initiated by the Finance Committee and finalized by Administrative Audit.
                            </p>
                        </header>
                        <div className="registry-header-icon">
                            <Landmark size={28} />
                        </div>
                    </div>

                    <div className="registry-top-row">
                        <article className="registry-request-card">
                            <h3>New Budget Request</h3>
                            <p>Formalize a new financial allocation. Define purpose, specify line items, and attach supporting documentation for review.</p>
                            {!isAdminView ? (
                                <button type="button" onClick={() => setShowRequestModal(true)}>
                                    Initiate Submission
                                </button>
                            ) : (
                                <small>Chief Finance reviews submitted requests. Creation is finance-only.</small>
                            )}
                            <small className="request-meta">Processing time: 2-3 Business Days</small>
                        </article>

                        <article className="registry-steps-card">
                            <h4>Approval Pipeline</h4>
                            <ol className="approval-steps">
                                <li>
                                    <strong>Finance Committee Submission</strong>
                                    <small>Request created with itemized ledger.</small>
                                </li>
                                <li>
                                    <strong>Departmental Validation</strong>
                                    <small>Faculty advisor reviews operational impact.</small>
                                </li>
                                <li>
                                    <strong>Final Administrative Audit</strong>
                                    <small>Disbursement approval or formal rejection.</small>
                                </li>
                            </ol>
                        </article>
                    </div>

                    <article className="panel registry-table">
                        <div className="registry-table-head">
                            <h3>Approval Register</h3>
                            <div className="registry-filters">
                                <button
                                    type="button"
                                    className={requestFilter === 'all' ? 'active' : ''}
                                    onClick={() => setRequestFilter('all')}
                                >
                                    All Requests
                                </button>
                                <button
                                    type="button"
                                    className={requestFilter === 'pending' ? 'active' : ''}
                                    onClick={() => setRequestFilter('pending')}
                                >
                                    Pending
                                </button>
                                <button
                                    type="button"
                                    className={requestFilter === 'approved' ? 'active' : ''}
                                    onClick={() => setRequestFilter('approved')}
                                >
                                    Approved
                                </button>
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Request Name</th>
                                        <th>Requested</th>
                                        <th>Approved</th>
                                        <th>Spent</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleFundRequests.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>{item.title}</strong>
                                                <small>REF: FR-{String(item.id).padStart(4, '0')}</small>
                                                {item.status === 'rejected' && item.chiefFinanceReviewNote && (
                                                    <small className="note-bad">Reason: {item.chiefFinanceReviewNote}</small>
                                                )}
                                            </td>
                                            <td>{toCurrency(item.requestedAmount)}</td>
                                            <td>{toCurrency(item.approvedAmount ?? 0)}</td>
                                            <td>
                                                <div className="spent-cell">
                                                    <div className="spent-meter">
                                                        <span
                                                            style={{
                                                                width: `${Math.max(
                                                                    0,
                                                                    Math.min(
                                                                        100,
                                                                        ((item.spentAmount ?? 0) / Math.max(item.approvedAmount ?? 1, 1)) * 100,
                                                                    ),
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <small>{toCurrency(item.spentAmount ?? 0)}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`registry-status ${fundRequestStatusClass(item.status)}`}>
                                                    {item.status === 'pending_guild_approval' || item.status === 'pending_chief_finance_approval'
                                                        ? 'Pending'
                                                        : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="registry-actions">
                                                    <button
                                                        type="button"
                                                        className="link-btn"
                                                        onClick={() => openFinanceDocument(item.invoiceAttachmentPath)}
                                                        disabled={!item.invoiceAttachmentPath}
                                                    >
                                                        View Details
                                                    </button>
                                                    {isAdminView && item.status === 'pending_chief_finance_approval' && (
                                                        <div className="action-row">
                                                            <button onClick={() => {
                                                                setDecisionModal({ open: true, requestId: item.id, decision: 'APPROVE' });
                                                                setDecisionReason('');
                                                            }}>Approve</button>
                                                            <button className="danger" onClick={() => {
                                                                setDecisionModal({ open: true, requestId: item.id, decision: 'REJECT' });
                                                                setDecisionReason('');
                                                            }}>Reject</button>
                                                        </div>
                                                    )}
                                                    {item.status !== 'pending_chief_finance_approval' && item.chiefFinanceReviewNote && item.status !== 'rejected' && (
                                                        <small className="note-ok">{item.chiefFinanceReviewNote}</small>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!isLoading && visibleFundRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="empty">No fund requests found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="registry-table-footer">
                            <small>Showing {visibleFundRequests.length} of {fundRequests.length} active entries</small>
                        </div>
                    </article>

                    <article className="registry-advisory">
                        <h4>Regulatory Advisory</h4>
                        <p>
                            Financial submissions must include complete invoice support before approval. Non-compliant filings are automatically returned for correction.
                        </p>
                    </article>
                </section>
            )}

            {activeTab === 'expenses' && (
                <section className="split-layout">
                    <article className="panel">
                        <h3>Post Daily Expense</h3>
                        <p className="hint-text">
                            After using approved money, upload receipt and post the expense.
                        </p>
                        <button type="button" onClick={() => setShowExpenseModal(true)}>
                            Log Expense + Upload Receipt
                        </button>
                    </article>

                    <article className="panel">
                        <h3>Expense Ledger</h3>
                        <div className="cat-list">
                            {categoryTotals.map((row) => (
                                <div key={row.category} className="cat-row">
                                    <div className="cat-head">
                                        <span>{row.category.replace('_', ' ')}</span>
                                        <strong>{toCurrency(row.amount)}</strong>
                                    </div>
                                    <div className="meter"><span /></div>
                                </div>
                            ))}
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Request</th>
                                        <th>Budget</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Receipt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.slice(0, 30).map((item) => (
                                        <tr key={item.id}>
                                            <td>{formatDate(item.expenseDate)}</td>
                                            <td>{item.fundRequestTitle ?? '-'}</td>
                                            <td>{item.budgetTitle ?? '-'}</td>
                                            <td>{item.category.replace('_', ' ')}</td>
                                            <td>{toCurrency(item.amount)}</td>
                                            <td>
                                                {item.receiptAttachmentPath ? (
                                                    <button type="button" className="link-btn" onClick={() => openFinanceDocument(item.receiptAttachmentPath)}>
                                                        View
                                                    </button>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {!isLoading && expenses.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="empty">No expenses found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </article>
                </section>
            )}

            {activeTab === 'statements' && (
                <section className="panel">
                    <h3>Financial Statements</h3>
                    <div className="kpi-row compact">
                        <article className="kpi">
                            <small>Total Revenue</small>
                            <strong>{toCurrency(statement?.incomeStatement.totalRevenue ?? 0)}</strong>
                        </article>
                        <article className="kpi">
                            <small>Total Expense</small>
                            <strong>{toCurrency(statement?.incomeStatement.totalExpense ?? 0)}</strong>
                        </article>
                        <article className="kpi">
                            <small>Net Surplus</small>
                            <strong className="good">{toCurrency(statement?.incomeStatement.netSurplus ?? 0)}</strong>
                        </article>
                    </div>
                    <div className="statement-actions">
                        <button onClick={() => window.open(`${API_BASE}/api/finance/reports/financial-statement/pdf`, '_blank', 'noopener,noreferrer')}>
                            Download Financial Statement PDF
                        </button>
                    </div>
                </section>
            )}

            {activeTab === 'receipts' && (
                <section className="panel">
                    <div className="receipt-head">
                        <h3>Receipt Validation Queue</h3>
                        <div className="receipt-tools">
                            <input
                                placeholder="Search receipts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <label className="import-btn">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) void importTransactions(file);
                                    }}
                                    disabled={importing}
                                />
                                {importing ? 'Importing...' : 'Import CSV'}
                            </label>
                            <button onClick={() => window.open(`${API_BASE}/api/payments/receipts/report/pdf`, '_blank', 'noopener,noreferrer')}>
                                Download Receipts PDF
                            </button>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Method</th>
                                    <th>Transaction</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedReceipts.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.ocrStudentNumber ?? item.studentNumber ?? 'N/A'}</strong>
                                            <small>{item.studentName ?? '-'}</small>
                                        </td>
                                        <td>{item.method ?? '-'}</td>
                                        <td>{item.externalReference ?? '-'}</td>
                                        <td>{item.amount} {item.currency}</td>
                                        <td>
                                            <span className={statusClass(item.receiptStatus)}>{item.receiptStatus ?? 'PENDING'}</span>
                                            <small>{item.registryMatchStatus ?? ''}</small>
                                        </td>
                                        <td>
                                            <textarea
                                                rows={2}
                                                placeholder="Notes"
                                                value={notes[item.id] ?? ''}
                                                onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                            />
                                            <div className="action-row">
                                                <button onClick={() => void verifyReceipt(item.id, 'VALID')}>Validate</button>
                                                <button className="danger" onClick={() => void verifyReceipt(item.id, 'REJECTED')}>Reject</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!isLoading && pagedReceipts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="empty">No receipts found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pager">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
                        <span>Page {safePage} of {totalPages}</span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Next</button>
                    </div>
                </section>
            )}

            {showRequestModal && (
                <div className="popup-backdrop">
                    <div className="popup-card">
                        <h3>New Budget Request</h3>
                        <form onSubmit={submitFundRequest} className="form-grid">
                            <input
                                placeholder="Request title"
                                value={fundRequestForm.title}
                                onChange={(e) => setFundRequestForm((prev) => ({ ...prev, title: e.target.value }))}
                                required
                            />
                            <div className="two-col">
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Requested amount"
                                    value={fundRequestForm.requestedAmount}
                                    onChange={(e) => setFundRequestForm((prev) => ({ ...prev, requestedAmount: e.target.value }))}
                                    required
                                />
                                <input
                                    type="date"
                                    value={fundRequestForm.allocationStartDate}
                                    onChange={(e) => setFundRequestForm((prev) => ({ ...prev, allocationStartDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <input
                                type="date"
                                value={fundRequestForm.allocationEndDate}
                                onChange={(e) => setFundRequestForm((prev) => ({ ...prev, allocationEndDate: e.target.value }))}
                                required
                            />
                            <textarea
                                rows={3}
                                placeholder="Describe exactly what this money will be used for"
                                value={fundRequestForm.purpose}
                                onChange={(e) => setFundRequestForm((prev) => ({ ...prev, purpose: e.target.value }))}
                                required
                            />
                            <label className="import-btn">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setRequestInvoiceFile(e.target.files?.[0] ?? null)}
                                />
                                {requestInvoiceFile ? `Invoice: ${requestInvoiceFile.name}` : 'Upload Invoice'}
                            </label>
                            <div className="action-row">
                                <button type="submit">Submit Request</button>
                                <button type="button" className="danger" onClick={() => setShowRequestModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="popup-backdrop">
                    <div className="popup-card">
                        <h3>Log Expense + Receipt</h3>
                        <form onSubmit={submitExpense} className="form-grid">
                            <select
                                value={expenseForm.fundRequestId}
                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, fundRequestId: e.target.value }))}
                                required
                            >
                                <option value="">Select approved request</option>
                                {approvedRequests.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title} ({toCurrency(item.remainingApprovedAmount)} left)
                                    </option>
                                ))}
                            </select>
                            <div className="two-col">
                                <input
                                    type="date"
                                    value={expenseForm.expenseDate}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                                    required
                                />
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Amount"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                                    required
                                />
                            </div>
                            <input
                                placeholder="Vendor"
                                value={expenseForm.vendor}
                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendor: e.target.value }))}
                                required
                            />
                            <textarea
                                rows={3}
                                placeholder="Expense description"
                                value={expenseForm.description}
                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                                required
                            />
                            <div className="two-col">
                                <select
                                    value={expenseForm.category}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                                >
                                    <option value="operations">Operations</option>
                                    <option value="events">Events</option>
                                    <option value="transport">Transport</option>
                                    <option value="welfare">Welfare</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="communication">Communication</option>
                                    <option value="other">Other</option>
                                </select>
                                <select
                                    value={expenseForm.method}
                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, method: e.target.value as ExpenseMethod }))}
                                >
                                    <option value="mobile_money">Mobile Money</option>
                                    <option value="bank">Bank</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>
                            <label className="import-btn">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setExpenseReceiptFile(e.target.files?.[0] ?? null)}
                                />
                                {expenseReceiptFile ? `Receipt: ${expenseReceiptFile.name}` : 'Upload Usage Receipt'}
                            </label>
                            <div className="action-row">
                                <button type="submit">Submit Expense</button>
                                <button type="button" className="danger" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {decisionModal.open && (
                <div className="popup-backdrop">
                    <div className="popup-card">
                        <h3>{decisionModal.decision === 'APPROVE' ? 'Approve Request' : 'Reject Request'}</h3>
                        <p className="hint-text">Chief Finance must provide a reason.</p>
                        <textarea
                            rows={4}
                            placeholder="Reason for this decision"
                            value={decisionReason}
                            onChange={(e) => setDecisionReason(e.target.value)}
                            required
                        />
                        <div className="action-row">
                            <button
                                type="button"
                                onClick={() => {
                                    if (decisionModal.requestId) {
                                        void reviewFundRequest(decisionModal.requestId, decisionModal.decision, decisionReason);
                                    }
                                }}
                            >
                                Confirm
                            </button>
                            <button
                                type="button"
                                className="danger"
                                onClick={() => {
                                    setDecisionModal({ open: false, requestId: null, decision: 'APPROVE' });
                                    setDecisionReason('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancePaymentReview;
