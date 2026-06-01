import { Fragment, type FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown, FileBarChart2, Landmark, Megaphone, PiggyBank, ReceiptText, Search, Wallet } from 'lucide-react';
import './FinancePaymentReview.css';
import aucaLogo from '../assets/auca-logo.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';
const OPERATING_BUDGET_TITLE = 'AUCASA Collected Fees Operating Budget';

type PaymentRegistryItem = {
    id: number;
    studentNumber?: string;
    amount?: number;
    currency?: string;
    method?: string;
    status?: string;
    receiptStatus?: string;
    externalReference?: string;
    transactionId?: string;
    reference?: string;
    studentId?: string;
    studentCode?: string;
    studentName?: string;
    payerInfo?: {
        studentName?: string;
        studentCode?: string;
    };
    paidAt?: string;
};

type StudentBalanceRow = {
    studentNumber: string;
    studentName: string;
    totalBilled: number;
    paidAmount: number;
    balance: number;
    paymentCount: number;
};

type StudentSummaryItem = {
    studentId: number;
    studentNumber: string;
    fullName: string;
};

type FinanceTab = 'overview' | 'budget-control' | 'expenses' | 'statements' | 'receipts';
type StatementReportKind = 'income-statement' | 'balance-sheet' | 'cash-flow' | 'expense-report';
type StatementPeriodFilter = 'daily' | 'monthly' | 'quarterly' | 'annual';
type ExpenseCategory = 'operations' | 'events' | 'transport' | 'refreshments' | 'welfare' | 'staff_welfare' | 'equipment' | 'communication' | 'other';
type ExpenseMethod = 'cash' | 'bank' | 'mobile_money';
type UserRole = 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs' | null;
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
            earnedIncome?: number;
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

type IncomeItem = {
    id: number;
    incomeDate: string;
    source: string;
    amount: number;
    method: string;
    description: string;
};

type IncomeForm = {
    incomeDate: string;
    source: string;
    amount: string;
    method: string;
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

const toCompactCurrency = (value: number) =>
    new Intl.NumberFormat('en-RW', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value || 0);

const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAID_STATUSES = new Set(['COMPLETED', 'VERIFIED', 'PAID']);

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
    const [incomes, setIncomes] = useState<IncomeItem[]>([]);
    const [statement, setStatement] = useState<FinancialStatement | null>(null);
    const [transparency, setTransparency] = useState<TransparencySummary | null>(null);
    const [localPayments, setLocalPayments] = useState<PaymentRegistryItem[]>([]);
    const [students, setStudents] = useState<StudentSummaryItem[]>([]);
    const [allPayments, setAllPayments] = useState<PaymentRegistryItem[]>([]);
    const [showAllPaymentsModal, setShowAllPaymentsModal] = useState(false);
    const [isLoadingAllPayments, setIsLoadingAllPayments] = useState(false);

    const [importSummary, setImportSummary] = useState('');
    const [importing, setImporting] = useState(false);
    const [clearingStudentNumber, setClearingStudentNumber] = useState('');
    const [clearConfirmRow, setClearConfirmRow] = useState<StudentBalanceRow | null>(null);
    const [clearConfirmBank, setClearConfirmBank] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [budgetPage, setBudgetPage] = useState(1);
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expensePage, setExpensePage] = useState(1);
    const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null);
    const [selectedStatementReport, setSelectedStatementReport] = useState<StatementReportKind | null>('income-statement');
    const [statementPeriodFilter, setStatementPeriodFilter] = useState<StatementPeriodFilter | ''>('monthly');
    const [publishTitle, setPublishTitle] = useState('');
    const [publishMessage, setPublishMessage] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestStep, setRequestStep] = useState(1);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [expenseStep, setExpenseStep] = useState(1);
    const [expenseSubmitAttempted, setExpenseSubmitAttempted] = useState(false);
    const [decisionModal, setDecisionModal] = useState<{ open: boolean; requestId: number | null; decision: 'APPROVE' | 'REJECT' }>({
        open: false,
        requestId: null,
        decision: 'APPROVE',
    });
    const [decisionReason, setDecisionReason] = useState('');
    const [requestInvoiceFile, setRequestInvoiceFile] = useState<File | null>(null);
    const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
    const pageSize = 4;
    const budgetPageSize = 4;
    const expensePageSize = 4;

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

    const [incomeForm, setIncomeForm] = useState<IncomeForm>({
        incomeDate: new Date().toISOString().slice(0, 10),
        source: '',
        amount: '',
        method: 'cash',
        description: '',
    });

    const loadCoreFinanceData = async () => {
        const [fundRes, expenseRes, incomeRes, reportRes, transparencyRes] = await Promise.all([
            fetch(`${API_BASE}/api/finance/fund-requests`),
            fetch(`${API_BASE}/api/finance/expenses`),
            fetch(`${API_BASE}/api/finance/incomes`),
            fetch(`${API_BASE}/api/finance/reports/financial-statement`),
            fetch(`${API_BASE}/api/finance/transparency/summary`),
        ]);

        const fundData = await fundRes.json().catch(() => []);
        const expenseData = await expenseRes.json().catch(() => []);
        const incomeData = await incomeRes.json().catch(() => []);
        const reportData = await reportRes.json().catch(() => null);
        const transparencyData = await transparencyRes.json().catch(() => null);

        if (!fundRes.ok || !expenseRes.ok || !incomeRes.ok || !reportRes.ok || !transparencyRes.ok) {
            throw new Error('Failed to load finance control data.');
        }

        setFundRequests(Array.isArray(fundData) ? fundData : []);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setIncomes(Array.isArray(incomeData) ? incomeData : []);
        setStatement(reportData);
        setTransparency(transparencyData);
    };

    const mapPaymentRecord = (item: Record<string, unknown>): PaymentRegistryItem => ({
        id: Number(item.id ?? 0),
        studentNumber: String(item.studentNumber ?? ''),
        amount: Number(item.amount ?? 0),
        currency: String(item.currency ?? 'RWF'),
        method: String(item.method ?? ''),
        status: String(item.status ?? ''),
        receiptStatus: String(item.receiptStatus ?? ''),
        externalReference: String(item.externalReference ?? ''),
        transactionId: String(item.externalReference ?? ''),
        paidAt: String(item.paidAt ?? ''),
        studentName: String(item.studentName ?? ''),
        studentId: String(item.studentId ?? ''),
        studentCode: String(item.studentNumber ?? ''),
    });

    const loadLocalPayments = async () => {
        await fetch(`${API_BASE}/api/payments/obligations/active-term`, {
            method: 'POST',
        }).catch(() => null);
        const response = await fetch(`${API_BASE}/api/payments`);
        const data = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(data)) {
            throw new Error('Failed to load student balances.');
        }
        setLocalPayments((data as Array<Record<string, unknown>>).map(mapPaymentRecord));
    };

    const loadStudents = async () => {
        const response = await fetch(`${API_BASE}/api/students/summary`);
        const data = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(data)) {
            throw new Error('Failed to load students.');
        }
        setStudents((data as Array<Record<string, unknown>>).map((item) => ({
            studentId: Number(item.studentId ?? 0),
            studentNumber: String(item.studentNumber ?? ''),
            fullName: String(item.fullName ?? ''),
        })));
    };

    const loadAllPayments = async () => {
        setIsLoadingAllPayments(true);
        try {
            const response = await fetch(`${API_BASE}/api/payments/ims/registry/all`);
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                const rows = Array.isArray((data as { data?: unknown[] }).data)
                    ? ((data as { data: unknown[] }).data as PaymentRegistryItem[])
                    : [];
                setAllPayments(rows);
                return;
            }

            // Simulation/local fallback: pull from local payment records directly.
            const fallbackRes = await fetch(`${API_BASE}/api/payments`);
            const fallbackData = await fallbackRes.json().catch(() => []);
            if (!fallbackRes.ok || !Array.isArray(fallbackData)) {
                throw new Error('Failed to load all payments.');
            }

            const mapped = (fallbackData as Array<Record<string, unknown>>).map(mapPaymentRecord);

            setAllPayments(mapped);
        } catch (err) {
            setAllPayments([]);
            setError(err instanceof Error ? err.message : 'Failed to load all payments.');
        } finally {
            setIsLoadingAllPayments(false);
        }
    };

    const refreshAll = async () => {
        setIsLoading(true);
        try {
            await Promise.all([loadCoreFinanceData(), loadLocalPayments(), loadStudents()]);
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
        const timer = window.setInterval(() => {
            void refreshAll();
        }, 15000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const onFocus = () => {
            void refreshAll();
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const approvedRequests = useMemo(
        () => fundRequests
            .filter((item) => item.status === 'approved')
            .sort((a, b) => {
                if (a.title === OPERATING_BUDGET_TITLE) return -1;
                if (b.title === OPERATING_BUDGET_TITLE) return 1;
                return 0;
            })
            .filter((item, index, list) => {
                if (item.title !== OPERATING_BUDGET_TITLE) return true;
                return list.findIndex((candidate) => candidate.title === OPERATING_BUDGET_TITLE) === index;
            }),
        [fundRequests],
    );

    const usageChart = useMemo(() => {
        const categories: Array<{ key: ExpenseCategory; label: string }> = [
            { key: 'operations', label: 'Operations' },
            { key: 'events', label: 'Events' },
            { key: 'transport', label: 'Transport' },
            { key: 'refreshments', label: 'Refreshments' },
            { key: 'staff_welfare', label: 'Staff' },
            { key: 'equipment', label: 'Equipment' },
            { key: 'other', label: 'Other' },
        ];
        const totals = new Map<ExpenseCategory, number>();
        expenses.forEach((item) => {
            totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount || 0));
        });
        const maxValue = Math.max(...categories.map((item) => totals.get(item.key) ?? 0), 1);
        const bars = categories.map((item) => {
            const amount = totals.get(item.key) ?? 0;
            return {
                ...item,
                amount,
                pct: Math.max(4, (amount / maxValue) * 100),
            };
        });
        return { bars, maxValue };
    }, [expenses]);

    const statementFilteredExpenses = useMemo(() => {
        if (!statementPeriodFilter) {
            return expenses;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        const today = now.toISOString().slice(0, 10);

        return expenses.filter((item) => {
            const expenseDate = String(item.expenseDate ?? '').slice(0, 10);
            const parsedDate = new Date(expenseDate);
            if (Number.isNaN(parsedDate.getTime())) return false;

            if (statementPeriodFilter === 'daily') {
                return expenseDate === today;
            }

            if (statementPeriodFilter === 'monthly') {
                return parsedDate.getFullYear() === currentYear && parsedDate.getMonth() === currentMonth;
            }

            if (statementPeriodFilter === 'quarterly') {
                return parsedDate.getFullYear() === currentYear && Math.floor(parsedDate.getMonth() / 3) === currentQuarter;
            }

            return parsedDate.getFullYear() === currentYear;
        });
    }, [expenses, statementPeriodFilter]);

    const statementFilteredIncomes = useMemo(() => {
        if (!statementPeriodFilter) {
            return incomes;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        const today = now.toISOString().slice(0, 10);

        return incomes.filter((item) => {
            const incomeDate = String(item.incomeDate ?? '').slice(0, 10);
            const parsedDate = new Date(incomeDate);
            if (Number.isNaN(parsedDate.getTime())) return false;

            if (statementPeriodFilter === 'daily') {
                return incomeDate === today;
            }

            if (statementPeriodFilter === 'monthly') {
                return parsedDate.getFullYear() === currentYear && parsedDate.getMonth() === currentMonth;
            }

            if (statementPeriodFilter === 'quarterly') {
                return parsedDate.getFullYear() === currentYear && Math.floor(parsedDate.getMonth() / 3) === currentQuarter;
            }

            return parsedDate.getFullYear() === currentYear;
        });
    }, [incomes, statementPeriodFilter]);

    const statementFilteredExpenseTotal = useMemo(
        () => statementFilteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        [statementFilteredExpenses],
    );
    const statementFilteredIncomeTotal = useMemo(
        () => statementFilteredIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        [statementFilteredIncomes],
    );

    const statementUsageChart = useMemo(() => {
        const categories: Array<{ key: ExpenseCategory; label: string }> = [
            { key: 'operations', label: 'Operations' },
            { key: 'events', label: 'Events' },
            { key: 'transport', label: 'Transport' },
            { key: 'refreshments', label: 'Refreshments' },
            { key: 'staff_welfare', label: 'Staff' },
            { key: 'equipment', label: 'Equipment' },
            { key: 'other', label: 'Other' },
        ];
        const totals = new Map<ExpenseCategory, number>();
        statementFilteredExpenses.forEach((item) => {
            totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount || 0));
        });
        const maxValue = Math.max(...categories.map((item) => totals.get(item.key) ?? 0), 1);
        const bars = categories.map((item) => {
            const amount = totals.get(item.key) ?? 0;
            return {
                ...item,
                amount,
                pct: Math.max(4, (amount / maxValue) * 100),
            };
        });
        return { bars, maxValue };
    }, [statementFilteredExpenses]);

    const currentBudgetRows = useMemo(() => {
        const rows = fundRequests
            .filter((item) => item.status === 'approved')
            .map((item) => {
                const amount = item.title === OPERATING_BUDGET_TITLE
                    ? Number(transparency?.totalCollected ?? item.approvedAmount ?? item.requestedAmount ?? 0)
                    : Number(item.approvedAmount ?? item.requestedAmount ?? 0);
                const period = item.allocationStartDate && item.allocationEndDate
                    ? `${formatDate(item.allocationStartDate)} - ${formatDate(item.allocationEndDate)}`
                    : 'Current period';
                return {
                    id: item.id,
                    title: item.title,
                    amount,
                    period,
                    startDate: item.allocationStartDate,
                };
            })
            .filter((item) => item.amount > 0);

        if (rows.length === 0 && Number(transparency?.totalCollected ?? 0) > 0) {
            return [{
                id: 0,
                title: OPERATING_BUDGET_TITLE,
                amount: Number(transparency?.totalCollected ?? 0),
                period: 'Current period',
                startDate: '',
            }];
        }

        const seen = new Set<string>();
        return rows
            .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
            .filter((item) => {
                const key = `${item.title}-${item.period}-${item.amount}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }, [fundRequests, transparency?.totalCollected]);

    const budgetTotalPages = Math.max(1, Math.ceil(currentBudgetRows.length / budgetPageSize));
    const safeBudgetPage = Math.min(budgetPage, budgetTotalPages);
    const pagedBudgetRows = currentBudgetRows.slice((safeBudgetPage - 1) * budgetPageSize, safeBudgetPage * budgetPageSize);
    const budgetChartItems = useMemo(() => {
        const grouped = new Map<string, number>();
        currentBudgetRows.forEach((item) => {
            grouped.set(item.period, (grouped.get(item.period) ?? 0) + item.amount);
        });
        const items = Array.from(grouped.entries()).map(([period, amount]) => ({ period, amount })).slice(0, 7);
        const fallback = items.length > 0 ? items : [{ period: 'Current period', amount: 0 }];
        const maxValue = Math.max(...fallback.map((item) => item.amount), 1);
        return { items: fallback, maxValue };
    }, [currentBudgetRows]);
    const budgetChartPoints = budgetChartItems.items.map((item, index, list) => {
        const x = 24 + (index * 252) / Math.max(list.length - 1, 1);
        const y = 128 - (item.amount / budgetChartItems.maxValue) * 86;
        return { ...item, x, y };
    });
    const budgetLinePoints = budgetChartPoints.map((point) => `${point.x},${point.y}`).join(' ');
    const budgetAreaPoints = `24,138 ${budgetLinePoints} 276,138`;

    const filteredExpenses = useMemo(() => {
        const term = expenseSearch.trim().toLowerCase();
        if (!term) return expenses;
        return expenses.filter((item) => {
            const haystack = [
                formatDate(item.expenseDate),
                item.budgetTitle,
                item.fundRequestTitle,
                expenseCategoryLabel(item.category),
                item.vendor,
                item.description,
                toCurrency(item.amount),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(term);
        });
    }, [expenses, expenseSearch]);

    const expenseTotalPages = Math.max(1, Math.ceil(filteredExpenses.length / expensePageSize));
    const safeExpensePage = Math.min(expensePage, expenseTotalPages);
    const pagedExpenses = filteredExpenses.slice((safeExpensePage - 1) * expensePageSize, safeExpensePage * expensePageSize);
    const ledgerChartPoints = usageChart.bars.map((bar, index, list) => {
        const x = 24 + (index * 252) / Math.max(list.length - 1, 1);
        const y = 128 - (bar.amount / usageChart.maxValue) * 86;
        return { ...bar, x, y };
    });
    const ledgerLinePoints = ledgerChartPoints.map((point) => `${point.x},${point.y}`).join(' ');
    const ledgerAreaPoints = `24,138 ${ledgerLinePoints} 276,138`;

    useEffect(() => {
        setExpensePage(1);
    }, [expenseSearch]);

    const renderUsageLineChart = (label: string, chart = usageChart) => {
        const activeBars = chart.bars.filter((bar) => bar.amount > 0);
        const chartItems = activeBars.length > 0 ? activeBars : chart.bars.slice(0, 4);
        const totalAmount = chartItems.reduce((sum, item) => sum + item.amount, 0);
        const chartMax = Math.max(...chartItems.map((item) => item.amount), 1);
        const chartLeft = 42;
        const chartRight = 292;
        const chartTop = 34;
        const chartBottom = 142;
        const chartHeight = chartBottom - chartTop;
        const chartPoints = chartItems.map((item, index, list) => {
            const x = chartLeft + (index * (chartRight - chartLeft)) / Math.max(list.length - 1, 1);
            const y = chartBottom - (item.amount / chartMax) * chartHeight;
            return { ...item, x, y };
        });
        const linePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
        const areaPoints = `${chartLeft},${chartBottom} ${linePoints} ${chartRight},${chartBottom}`;

        return (
            <div className="usage-line-chart" role="img" aria-label={label}>
                <svg viewBox="0 0 320 192" aria-hidden="true">
                    <defs>
                        <linearGradient id="usageLineArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#2F4F86" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#2F4F86" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                    {[chartTop, chartTop + chartHeight / 2, chartBottom].map((y) => (
                        <line key={y} className="usage-line-grid" x1={chartLeft} x2={chartRight} y1={y} y2={y} />
                    ))}
                    <text className="usage-line-axis-label" x="8" y={chartTop + 4}>{toCompactCurrency(chartMax)}</text>
                    <text className="usage-line-axis-label" x="14" y={chartBottom + 4}>0</text>
                    <polygon className="usage-line-area" points={areaPoints} />
                    <polyline className="usage-line-path" points={linePoints} />
                    {chartPoints.map((point) => (
                        <g key={point.key}>
                            <circle className="usage-line-dot" cx={point.x} cy={point.y} r="4.8" />
                            <text className="usage-line-value" x={point.x} y={Math.max(14, point.y - 11)}>
                                {point.amount > 0 ? toCompactCurrency(point.amount) : '0'}
                            </text>
                            <text className="usage-line-label" x={point.x} y="174">
                                {point.label}
                            </text>
                        </g>
                    ))}
                </svg>
                <div className="usage-line-summary">
                    {chartItems.map((item) => (
                        <div key={item.key}>
                            <span>{item.label}</span>
                            <strong>{toCurrency(item.amount)}</strong>
                            <small>{totalAmount > 0 ? `${Math.round((item.amount / totalAmount) * 100)}% of shown spending` : 'No spending recorded'}</small>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const studentBalanceRows = useMemo<StudentBalanceRow[]>(() => {
        const grouped = new Map<string, StudentBalanceRow>();
        students.forEach((student) => {
            const studentNumber = String(student.studentNumber ?? '').trim();
            if (!studentNumber) return;
            grouped.set(studentNumber, {
                studentNumber,
                studentName: student.fullName || '-',
                totalBilled: 0,
                paidAmount: 0,
                balance: 0,
                paymentCount: 0,
            });
        });
        localPayments.forEach((item) => {
            const studentNumber = String(item.studentNumber ?? item.studentCode ?? item.studentId ?? '').trim();
            if (!studentNumber) return;
            const amount = Number(item.amount ?? 0);
            const status = String(item.status ?? '').toUpperCase();
            const existing = grouped.get(studentNumber) ?? {
                studentNumber,
                studentName: String(item.studentName ?? item.payerInfo?.studentName ?? '-'),
                totalBilled: 0,
                paidAmount: 0,
                balance: 0,
                paymentCount: 0,
            };
            existing.totalBilled += amount;
            existing.paymentCount += 1;
            if (PAID_STATUSES.has(status)) {
                existing.paidAmount += amount;
            }
            existing.balance = Math.max(existing.totalBilled - existing.paidAmount, 0);
            if ((!existing.studentName || existing.studentName === '-') && item.studentName) {
                existing.studentName = item.studentName;
            }
            grouped.set(studentNumber, existing);
        });
        return Array.from(grouped.values()).sort((a, b) => b.balance - a.balance || a.studentNumber.localeCompare(b.studentNumber));
    }, [localPayments, students]);

    const filteredStudentBalances = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return studentBalanceRows;
        return studentBalanceRows.filter((item) =>
            [
                item.studentNumber,
                item.studentName,
                item.totalBilled,
                item.paidAmount,
                item.balance,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        );
    }, [studentBalanceRows, search]);

    const totalPages = Math.max(1, Math.ceil(filteredStudentBalances.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pagedStudentBalances = filteredStudentBalances.slice(startIndex, startIndex + pageSize);

    const isAdminView = currentUserRole === 'admin';
    const selectedExpenseRequest = approvedRequests.find((item) => String(item.id) === expenseForm.fundRequestId);
    const expenseAmountNumber = Number(expenseForm.amount || 0);
    const selectedRemainingAfterExpense = selectedExpenseRequest
        ? Number(selectedExpenseRequest.remainingApprovedAmount || 0) - (Number.isFinite(expenseAmountNumber) ? expenseAmountNumber : 0)
        : 0;
    const expenseSectionErrors = {
        one: !expenseForm.fundRequestId || !expenseForm.expenseDate || !Number.isFinite(expenseAmountNumber) || expenseAmountNumber <= 0 || selectedRemainingAfterExpense < 0,
        two: !expenseForm.vendor.trim() || !expenseForm.description.trim(),
        three: !expenseForm.category || !expenseForm.method,
        four: !expenseReceiptFile,
    };
    const todayExpenseTotal = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return expenses
            .filter((item) => String(item.expenseDate).slice(0, 10) === today)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }, [expenses]);
    const monthExpenseTotal = useMemo(() => {
        const month = new Date().toISOString().slice(0, 7);
        return expenses
            .filter((item) => String(item.expenseDate).slice(0, 7) === month)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }, [expenses]);
    const todayIncomeTotal = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return incomes
            .filter((item) => String(item.incomeDate).slice(0, 10) === today)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }, [incomes]);
    const monthIncomeTotal = useMemo(() => {
        const month = new Date().toISOString().slice(0, 7);
        return incomes
            .filter((item) => String(item.incomeDate).slice(0, 7) === month)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }, [incomes]);
    const finalBalance = Number(statement?.totalRemainingBudget ?? transparency?.remainingBalance ?? 0);
    const statementPeriodLabel = useMemo(() => {
        const now = new Date();
        if (!statementPeriodFilter) {
            return 'Selected reporting period';
        }
        if (statementPeriodFilter === 'daily') {
            return `Daily report - ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }
        if (statementPeriodFilter === 'monthly') {
            return `Monthly report - ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
        }
        if (statementPeriodFilter === 'quarterly') {
            const quarter = Math.floor(now.getMonth() / 3) + 1;
            return `Quarterly report - Q${quarter} ${now.getFullYear()}`;
        }
        return `Annual report - ${now.getFullYear()}`;
    }, [statementPeriodFilter]);
    const statementReportCards: Array<{ kind: StatementReportKind; title: string; description: string }> = [
        {
            kind: 'income-statement',
            title: 'Income Statement',
            description: 'Revenue, expenses, and net surplus for the selected period.',
        },
        {
            kind: 'balance-sheet',
            title: 'Balance Sheet',
            description: 'Assets, liabilities, and AUCASA equity position.',
        },
        {
            kind: 'cash-flow',
            title: 'Cash Flow Statement',
            description: 'Cash received, cash used, and ending cash balance.',
        },
        {
            kind: 'expense-report',
            title: 'Expense Report',
            description: 'Expense lines with category, receiver, description, and amount.',
        },
    ];
    const downloadSelectedStatementReport = () => {
        if (!selectedStatementReport || !statementPeriodFilter) return;
        const params = new URLSearchParams({
            type: selectedStatementReport,
            period: statementPeriodFilter,
        });
        window.open(`${API_BASE}/api/finance/reports/financial-statement/pdf?${params.toString()}`, '_blank', 'noopener,noreferrer');
    };

    const openFinanceDocument = (storedPath?: string | null) => {
        if (!storedPath) return;
        const target = `${API_BASE}/api/finance/documents/view?path=${encodeURIComponent(storedPath)}`;
        window.open(target, '_blank', 'noopener,noreferrer');
    };

    const renderStatementPreview = () => {
        if (!selectedStatementReport) {
            return (
                <div className="statement-preview-empty">
                    <strong>Select a report to review</strong>
                    <span>Choose one statement above. The preview will appear here before you download anything.</span>
                </div>
            );
        }

        const selectedMeta = statementReportCards.find((item) => item.kind === selectedStatementReport);
        const income = statement?.incomeStatement;
        const balance = statement?.balanceSheet;
        const baseRevenue = Number(income?.totalRevenue ?? 0) - Number(income?.earnedIncome ?? 0);
        const hasStatementFilters = Boolean(statementPeriodFilter);
        const revenue = hasStatementFilters ? baseRevenue + statementFilteredIncomeTotal : Number(income?.totalRevenue ?? 0);
        const expenseTotal = hasStatementFilters ? statementFilteredExpenseTotal : Number(income?.totalExpense ?? 0);
        const netSurplus = revenue - expenseTotal;
        const cashAndBank = Number(balance?.cashAndBank ?? finalBalance);
        const receivables = Number(balance?.receivables ?? 0);
        const liabilities = Number(balance?.liabilities ?? 0);
        const equity = Number(balance?.equity ?? finalBalance);

        return (
            <article className="statement-document-preview">
                <header className="statement-document-head">
                    <img src={aucaLogo} alt="AUCA logo" />
                    <div>
                        <small>Adventist University of Central Africa</small>
                        <h2>{selectedMeta?.title}</h2>
                        <span>AUCASA Finance Office - {statementPeriodLabel}</span>
                    </div>
                </header>

                {selectedStatementReport === 'income-statement' && (
                    <div className="statement-document-section">
                        <h3>Income Statement</h3>
                        <div className="statement-line"><span>Student collections</span><strong>{toCurrency(baseRevenue)}</strong></div>
                        <div className="statement-line"><span>Earned daily income</span><strong>{toCurrency(statementFilteredIncomeTotal)}</strong></div>
                        <div className="statement-line"><span>Total revenue</span><strong>{toCurrency(revenue)}</strong></div>
                        <div className="statement-line"><span>Total expenses</span><strong>{toCurrency(expenseTotal)}</strong></div>
                        <div className="statement-line total"><span>Net surplus</span><strong>{toCurrency(netSurplus)}</strong></div>
                    </div>
                )}

                {selectedStatementReport === 'balance-sheet' && (
                    <div className="statement-document-section">
                        <h3>Balance Sheet</h3>
                        <div className="statement-line"><span>Cash and bank</span><strong>{toCurrency(cashAndBank)}</strong></div>
                        <div className="statement-line"><span>Receivables</span><strong>{toCurrency(receivables)}</strong></div>
                        <div className="statement-line total"><span>Total assets</span><strong>{toCurrency(cashAndBank + receivables)}</strong></div>
                        <div className="statement-line"><span>Liabilities</span><strong>{toCurrency(liabilities)}</strong></div>
                        <div className="statement-line total"><span>Owner equity</span><strong>{toCurrency(equity)}</strong></div>
                    </div>
                )}

                {selectedStatementReport === 'cash-flow' && (
                    <div className="statement-document-section">
                        <h3>Statement of Cash Flows</h3>
                        <div className="statement-line"><span>Cash received from student collections</span><strong>{toCurrency(revenue)}</strong></div>
                        <div className="statement-line"><span>Cash used for operating expenses</span><strong>({toCurrency(expenseTotal)})</strong></div>
                        <div className="statement-line total"><span>Net cash movement</span><strong>{toCurrency(revenue - expenseTotal)}</strong></div>
                        <div className="statement-line total"><span>Cash balance at period end</span><strong>{toCurrency(cashAndBank)}</strong></div>
                    </div>
                )}

                {selectedStatementReport === 'expense-report' && (
                    <div className="statement-document-section">
                        <h3>Expense Report</h3>
                        <div className="statement-expense-table">
                            <div className="statement-expense-row head">
                                <span>Date</span>
                                <span>Description</span>
                                <span>Category</span>
                                <span>Amount</span>
                            </div>
                            {statementFilteredExpenses.slice(0, 8).map((item) => (
                                <div className="statement-expense-row" key={item.id}>
                                    <span>{formatDate(item.expenseDate)}</span>
                                    <span>{item.description || item.vendor || '-'}</span>
                                    <span>{expenseCategoryLabel(item.category)}</span>
                                    <strong>{toCurrency(item.amount)}</strong>
                                </div>
                            ))}
                            {statementFilteredExpenses.length === 0 && <div className="statement-expense-empty">No expenses match this filter.</div>}
                        </div>
                        {statementFilteredExpenses.length > 8 && <p className="statement-preview-note">Showing first 8 matching expenses in preview. The PDF download uses the full report export.</p>}
                        <div className="statement-line total"><span>Total expenses</span><strong>{toCurrency(expenseTotal)}</strong></div>
                    </div>
                )}

                <footer className="statement-document-actions">
                    <button type="button" onClick={downloadSelectedStatementReport}>
                        Download {selectedMeta?.title} PDF
                    </button>
                </footer>
            </article>
        );
    };

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
        setExpenseSubmitAttempted(true);
        if (!expenseReceiptFile) {
            setExpenseStep(4);
            setError('Please upload the receipt before posting this expense.');
            return;
        }
        if (!selectedExpenseRequest) {
            setExpenseStep(1);
            setError('Please select an approved assigned budget before posting this expense.');
            return;
        }
        if (!expenseForm.description.trim()) {
            setExpenseStep(2);
            setError('Expense description is required.');
            return;
        }
        if (!expenseForm.vendor.trim()) {
            setExpenseStep(2);
            setError('Receiver is required.');
            return;
        }
        if (!expenseForm.category) {
            setExpenseStep(3);
            setError('Expense category is required.');
            return;
        }
        if (!Number.isFinite(expenseAmountNumber) || expenseAmountNumber <= 0) {
            setExpenseStep(1);
            setError('Expense amount must be greater than zero.');
            return;
        }
        if (selectedRemainingAfterExpense < 0) {
            setExpenseStep(1);
            setError(`This expense exceeds the assigned budget balance. Remaining amount is ${toCurrency(selectedExpenseRequest.remainingApprovedAmount)}.`);
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
        setExpenseSubmitAttempted(false);
        setShowExpenseModal(false);
        await loadCoreFinanceData();
    };

    const submitIncome = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        const amount = Number(incomeForm.amount || 0);
        if (!incomeForm.source.trim() || !incomeForm.description.trim() || !Number.isFinite(amount) || amount <= 0) {
            setError('Income source, amount, and description are required.');
            return;
        }
        const response = await fetch(`${API_BASE}/api/finance/incomes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incomeForm),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to record income.');
            return;
        }
        setSuccess('Daily income recorded successfully.');
        setIncomeForm({
            incomeDate: new Date().toISOString().slice(0, 10),
            source: '',
            amount: '',
            method: 'cash',
            description: '',
        });
        setShowIncomeModal(false);
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
            await loadLocalPayments();
        } finally {
            setImporting(false);
        }
    };

    const clearStudentDebt = async (studentNumber: string) => {
        setError('');
        setSuccess('');
        const bankName = clearConfirmBank;
        if (!bankName) {
            setError(`Select the bank ${studentNumber} paid through before clearing the balance.`);
            return;
        }

        setClearingStudentNumber(studentNumber);
        try {
            const response = await fetch(`${API_BASE}/api/payments/clear-debt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber,
                    bankName,
                    notes: `Receipt checked and accepted by finance. Paid through ${bankName}.`,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to clear student debt.');
                return;
            }
            setSuccess(
                `Debt cleared for student ${data.studentNumber ?? studentNumber}. ` +
                `${data.clearedCount ?? 0} payment(s), ${toCurrency(Number(data.clearedAmount ?? 0))}. Bank: ${bankName}.`
            );
            setClearConfirmBank('');
            await Promise.all([loadCoreFinanceData(), loadLocalPayments(), loadStudents()]);
        } finally {
            setClearingStudentNumber('');
            setClearConfirmRow(null);
        }
    };

    return (
        <div className="finance-workspace">
            <div className="finance-main finance-main--full">
            {error && <div className="banner banner--error">{error}</div>}
            {success && <div className="banner banner--ok">{success}</div>}
            {importSummary && <div className="banner banner--ok">{importSummary}</div>}

            {activeTab === 'overview' && (
                <>
                    <header className="finance-page-bar">
                        <h1>Finance Control Center</h1>
                        <p>Fees, spending, and student transparency at a glance.</p>
                    </header>

                    <section className="kpi-row finance-summary-row">
                        <article className="kpi">
                            <div className="kpi-head">
                                <small>Collected</small>
                                <span className="kpi-icon"><Wallet size={17} /></span>
                            </div>
                            <strong>{toCurrency(transparency?.totalCollected ?? 0)}</strong>
                            <span>Verified student payments</span>
                        </article>
                        <article className="kpi">
                            <div className="kpi-head">
                                <small>Spent</small>
                                <span className="kpi-icon"><ReceiptText size={17} /></span>
                            </div>
                            <strong>{toCurrency(transparency?.totalSpent ?? 0)}</strong>
                            <span>Recorded usage receipts</span>
                        </article>
                        <article className="kpi">
                            <div className="kpi-head">
                                <small>Remaining</small>
                                <span className="kpi-icon"><PiggyBank size={17} /></span>
                            </div>
                            <strong className="good">{toCurrency(transparency?.remainingBalance ?? 0)}</strong>
                            <span>Available AUCASA balance</span>
                        </article>
                    </section>

                    <section className="panel overview-report-access">
                        <div>
                            <span className="overview-report-access__icon"><FileBarChart2 size={17} /></span>
                            <div>
                                <h3>Financial Reports</h3>
                                <p>Open income statements, balance sheets, cash flow, and expense reports.</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setActiveTab('statements')}>
                            View Reports
                        </button>
                    </section>

                    <section className="overview-grid">
                        <article className="widget overview-compact-card">
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
                        <article className="panel overview-compact-card">
                            <h3>Publish Student Update</h3>
                            <form className="form-grid overview-publish-form" onSubmit={publishUpdate}>
                                <input
                                    placeholder="Update title"
                                    value={publishTitle}
                                    onChange={(e) => setPublishTitle(e.target.value)}
                                    required
                                />
                                <textarea
                                    rows={2}
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
                                Review budgets, approve requests, and track available funds.
                            </p>
                        </header>
                        <div className="registry-header-icon">
                            <Landmark size={28} />
                        </div>
                    </div>

                    <div className="registry-top-row">
                        <article className="registry-request-card">
                            <h3>Supplementary Budget Request</h3>
                            <p>Request extra funds only when the operating budget is not enough.</p>
                            {!isAdminView ? (
                                <button type="button" onClick={() => {
                                    setRequestStep(1);
                                    setShowRequestModal(true);
                                }}>
                                    Request Supplementary Budget
                                </button>
                            ) : (
                                <small>Chief Finance reviews requests above the available balance.</small>
                            )}
                            <small className="request-meta">Use daily expenses first.</small>
                        </article>

                        <article className="registry-steps-card">
                            <h4>Approval Pipeline</h4>
                            <ol className="approval-steps">
                                <li>
                                    <strong>Operating Budget</strong>
                                    <small>Verified collections become available funds.</small>
                                </li>
                                <li>
                                    <strong>Log Expenses</strong>
                                    <small>Daily spending updates the balance.</small>
                                </li>
                                <li>
                                    <strong>Approve Extra Funds</strong>
                                    <small>Used only when funds are short.</small>
                                </li>
                            </ol>
                        </article>
                    </div>

                    <article className="panel budget-current-panel">
                        <div className="budget-current-head">
                            <div>
                                <h3>Current Budget Registry</h3>
                                <p>Total collected and approved money available by allocation period.</p>
                            </div>
                            <span>{toCurrency(currentBudgetRows.reduce((sum, item) => sum + item.amount, 0))}</span>
                        </div>
                        <div className="budget-current-body">
                            <section className="budget-period-chart" aria-label="Budget by period chart">
                                <div className="expense-ledger-chart-head">
                                    <div>
                                        <small>Budget Trend</small>
                                        <strong>{toCurrency(currentBudgetRows.reduce((sum, item) => sum + item.amount, 0))}</strong>
                                    </div>
                                    <span>By period</span>
                                </div>
                                <svg viewBox="0 0 300 168" role="img" aria-label="Blue budget allocation line chart">
                                    <defs>
                                        <linearGradient id="budgetPeriodArea" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#2f7fe8" stopOpacity="0.26" />
                                            <stop offset="100%" stopColor="#2f7fe8" stopOpacity="0.03" />
                                        </linearGradient>
                                    </defs>
                                    {[46, 78, 110, 142].map((y) => (
                                        <line key={y} className="ledger-chart-grid" x1="20" x2="280" y1={y} y2={y} />
                                    ))}
                                    <polygon className="budget-chart-area" points={budgetAreaPoints} />
                                    <polyline className="ledger-chart-line ledger-chart-line--ghost" points="24,114 66,104 108,110 150,90 192,82 234,94 276,72" />
                                    <polyline className="ledger-chart-line" points={budgetLinePoints} />
                                    {budgetChartPoints.map((point) => (
                                        <circle key={point.period} className="ledger-chart-dot" cx={point.x} cy={point.y} r="4.2" />
                                    ))}
                                </svg>
                                <div className="budget-chart-labels">
                                    {budgetChartPoints.slice(0, 3).map((point) => (
                                        <span key={point.period}>{point.period}</span>
                                    ))}
                                </div>
                            </section>

                            <div className="budget-table-stack">
                                <div className="table-wrap budget-current-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Amount</th>
                                                <th>Period</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedBudgetRows.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.title}</td>
                                                    <td>{toCurrency(item.amount)}</td>
                                                    <td>{item.period}</td>
                                                </tr>
                                            ))}
                                            {!isLoading && currentBudgetRows.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="empty">No approved budgets found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="expense-ledger-pager">
                                    <button type="button" onClick={() => setBudgetPage((current) => Math.max(1, current - 1))} disabled={safeBudgetPage <= 1}>
                                        Previous
                                    </button>
                                    <span>Page {safeBudgetPage} of {budgetTotalPages}</span>
                                    <button type="button" onClick={() => setBudgetPage((current) => Math.min(budgetTotalPages, current + 1))} disabled={safeBudgetPage >= budgetTotalPages}>
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>

                </section>
            )}

            {activeTab === 'expenses' && (
                <>
                <header className="finance-page-bar">
                    <h1>Expense Management</h1>
                    <p>Log spending and review category breakdowns.</p>
                </header>
                <section className="split-layout">
                    <article className="panel expense-action-card">
                        <h3>Post Daily Expense</h3>
                        <p className="hint-text">
                            Use the automatically assigned collected-fees budget first. Supplementary requests are only needed when this balance cannot cover an expense.
                        </p>
                        <button type="button" onClick={() => {
                            setExpenseStep(1);
                            setExpenseSubmitAttempted(false);
                            setShowExpenseModal(true);
                        }}>
                            Log Expense + Upload Receipt
                        </button>
                        <button type="button" className="secondary-action" onClick={() => setShowIncomeModal(true)}>
                            Log Daily Income
                        </button>
                        <section className="expense-ledger-chart" aria-label="Expense trend chart">
                            <div className="expense-ledger-chart-head">
                                <div>
                                    <small>Spend Trend</small>
                                    <strong>{toCurrency(statement?.incomeStatement.totalExpense ?? 0)}</strong>
                                </div>
                                <span>Category view</span>
                            </div>
                            <svg viewBox="0 0 300 168" role="img" aria-label="Blue expense usage line chart">
                                <defs>
                                    <linearGradient id="expenseLedgerArea" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#2f7fe8" stopOpacity="0.28" />
                                        <stop offset="100%" stopColor="#2f7fe8" stopOpacity="0.03" />
                                    </linearGradient>
                                </defs>
                                {[46, 78, 110, 142].map((y) => (
                                    <line key={y} className="ledger-chart-grid" x1="20" x2="280" y1={y} y2={y} />
                                ))}
                                <polygon className="ledger-chart-area" points={ledgerAreaPoints} />
                                <polyline className="ledger-chart-line ledger-chart-line--ghost" points="24,112 66,118 108,96 150,104 192,76 234,88 276,72" />
                                <polyline className="ledger-chart-line" points={ledgerLinePoints} />
                                {ledgerChartPoints.map((point) => (
                                    <circle key={point.key} className="ledger-chart-dot" cx={point.x} cy={point.y} r="4.2" />
                                ))}
                            </svg>
                            <div className="expense-ledger-chart-labels">
                                {ledgerChartPoints.slice(0, 4).map((point) => (
                                    <span key={point.key}>{point.label}</span>
                                ))}
                            </div>
                        </section>
                    </article>

                    <article className="panel">
                        <div className="expense-ledger-head">
                            <h3>Expense Ledger</h3>
                            <label className="expense-report-jump">
                                <span>Open report</span>
                                <select
                                    value=""
                                    onChange={(event) => {
                                        const value = event.target.value as StatementReportKind | '';
                                        if (!value) return;
                                        setSelectedStatementReport(value);
                                        setStatementPeriodFilter((current) => current || 'monthly');
                                        setActiveTab('statements');
                                    }}
                                >
                                    <option value="">Choose report</option>
                                    {statementReportCards.map((report) => (
                                        <option key={report.kind} value={report.kind}>
                                            Review {report.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="expense-summary-grid">
                            <div>
                                <small>Daily Expense Report</small>
                                <strong>{toCurrency(todayExpenseTotal)}</strong>
                                <span>Expenses logged today</span>
                            </div>
                            <div>
                                <small>Daily Income</small>
                                <strong>{toCurrency(todayIncomeTotal)}</strong>
                                <span>Income recorded today</span>
                            </div>
                            <div>
                                <small>Monthly Summary</small>
                                <strong>{toCurrency(monthIncomeTotal - monthExpenseTotal)}</strong>
                                <span>This month net movement</span>
                            </div>
                            <div>
                                <small>Final Balance Sheet</small>
                                <strong>{toCurrency(finalBalance)}</strong>
                                <span>Remaining after expenses</span>
                            </div>
                        </div>
                        <div className="expense-ledger-toolbar">
                            <div>
                                <h4>Recent Expense Records</h4>
                                <small>Showing 4 rows per page. Select a row to view full details.</small>
                            </div>
                            <label className="expense-ledger-search">
                                <Search size={14} />
                                <input
                                    type="search"
                                    placeholder="Search expenses..."
                                    value={expenseSearch}
                                    onChange={(e) => setExpenseSearch(e.target.value)}
                                />
                            </label>
                        </div>
                        <div className="expense-ledger-table-stack">
                                <div className="table-wrap expense-ledger-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Category</th>
                                                <th>Budget</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedExpenses.map((item) => (
                                                <Fragment key={item.id}>
                                                    <tr
                                                        className={`expense-ledger-row ${expandedExpenseId === item.id ? 'is-open' : ''}`}
                                                        onClick={() => setExpandedExpenseId((current) => (current === item.id ? null : item.id))}
                                                    >
                                                        <td>{formatDate(item.expenseDate)}</td>
                                                        <td>
                                                            <span className="expense-category-pill">{expenseCategoryLabel(item.category)}</span>
                                                        </td>
                                                        <td>{item.budgetTitle ?? '-'}</td>
                                                        <td>
                                                            <strong>{toCurrency(item.amount)}</strong>
                                                            <ChevronDown size={15} />
                                                        </td>
                                                    </tr>
                                                    {expandedExpenseId === item.id && (
                                                        <tr className="expense-ledger-details">
                                                            <td colSpan={4}>
                                                                <div className="expense-detail-grid">
                                                                    <div>
                                                                        <small>Request</small>
                                                                        <strong>{item.fundRequestTitle ?? '-'}</strong>
                                                                    </div>
                                                                    <div>
                                                                        <small>Receiver/Vendor</small>
                                                                        <strong>{item.vendor || '-'}</strong>
                                                                    </div>
                                                                    <div>
                                                                        <small>Description</small>
                                                                        <p>{item.description || '-'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <small>Receipt</small>
                                                                        {item.receiptAttachmentPath ? (
                                                                            <button type="button" className="link-btn" onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                openFinanceDocument(item.receiptAttachmentPath);
                                                                            }}>
                                                                                View Receipt
                                                                            </button>
                                                                        ) : (
                                                                            <strong>-</strong>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                            {!isLoading && filteredExpenses.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="empty">No expenses found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="expense-ledger-pager">
                                    <button type="button" onClick={() => setExpensePage((current) => Math.max(1, current - 1))} disabled={safeExpensePage <= 1}>
                                        Previous
                                    </button>
                                    <span>Page {safeExpensePage} of {expenseTotalPages}</span>
                                    <button type="button" onClick={() => setExpensePage((current) => Math.min(expenseTotalPages, current + 1))} disabled={safeExpensePage >= expenseTotalPages}>
                                        Next
                                    </button>
                                </div>
                        </div>
                    </article>
                </section>
                </>
            )}

            {activeTab === 'statements' && (
                <>
                <header className="finance-page-bar">
                    <h1>Financial Statements</h1>
                    <p>Review each report clearly first, then download only the document you need.</p>
                </header>
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
                    <section className="statement-filter-bar" aria-label="Financial statement filters">
                        <label>
                            Category
                            <select
                                value={selectedStatementReport ?? ''}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSelectedStatementReport(value ? value as StatementReportKind : null);
                                }}
                            >
                                <option value="">Choose report</option>
                                {statementReportCards.map((report) => (
                                    <option key={report.kind} value={report.kind}>
                                        Review {report.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Period
                            <select
                                value={statementPeriodFilter}
                                onChange={(event) => setStatementPeriodFilter(event.target.value as StatementPeriodFilter | '')}
                            >
                                <option value="">Choose period</option>
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annual">Annual</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedStatementReport(null);
                                setStatementPeriodFilter('');
                            }}
                        >
                            Clear Filters
                        </button>
                    </section>
                    <section className="statement-report-tools">
                        <article className="statement-usage-graph">
                            <div className="finance-usage-head">
                                <h3>Expense breakdown</h3>
                                <span className="finance-usage-total">{toCurrency(statementFilteredExpenseTotal)}</span>
                            </div>
                            {renderUsageLineChart('Line chart showing financial report spending by category', statementUsageChart)}
                        </article>
                        <div className="statement-review-stack">
                            {renderStatementPreview()}
                        </div>
                    </section>
                </section>
                </>
            )}

            {activeTab === 'receipts' && (
                <>
                <header className="finance-page-bar">
                    <h1>Receipt Validation</h1>
                    <p>Review receipts and reconcile the payment registry.</p>
                </header>
                <section className="panel">
                    <div className="receipt-head">
                        <div>
                            <h3>Student Balances</h3>
                            <small>All student association fee balances. Choose BK or Equity before clearing a student.</small>
                        </div>
                        <div className="receipt-tools">
                            <input
                                placeholder="Search student ID or name..."
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
                        </div>
                    </div>
                    <div className="table-wrap urubuto-payment-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Total Billed</th>
                                    <th>Paid</th>
                                    <th>Current Balance</th>
                                    <th>Finance Standing</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedStudentBalances.map((item) => (
                                    <tr key={item.studentNumber}>
                                        <td>{item.studentNumber}</td>
                                        <td>{item.studentName || '-'}</td>
                                        <td>{toCurrency(item.totalBilled)}</td>
                                        <td>{toCurrency(item.paidAmount)}</td>
                                        <td>
                                            <strong className={item.balance > 0 ? 'balance-owed-text' : 'balance-clear-text'}>
                                                {toCurrency(item.balance)}
                                            </strong>
                                        </td>
                                        <td>
                                            <span className={item.balance > 0 ? 'finance-standing debt' : 'finance-standing clear'}>
                                                {item.balance > 0 ? 'In debt' : 'Clear'}
                                            </span>
                                        </td>
                                        {item.balance > 0 ? (
                                            <td>
                                                <button
                                                    type="button"
                                                    className="clear-row-action"
                                                    onClick={() => {
                                                        setClearConfirmRow(item);
                                                        setClearConfirmBank('');
                                                    }}
                                                    disabled={clearingStudentNumber === item.studentNumber}
                                                >
                                                    {clearingStudentNumber === item.studentNumber ? 'Clearing...' : 'Clear'}
                                                </button>
                                            </td>
                                        ) : (
                                            <td>
                                                <span className="no-debt-note">No debt to clear</span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {!isLoading && pagedStudentBalances.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="empty">No student balances found.</td>
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
                </>
            )}

            {clearConfirmRow && (
                <div className="popup-backdrop">
                    <div className="popup-card clear-confirm-card">
                        <div className="clear-confirm-head">
                            <span className="clear-confirm-icon"><Landmark size={20} /></span>
                            <div>
                                <h3>Confirm Student Payment</h3>
                                <p>Choose the bank shown on the student receipt before clearing this balance.</p>
                            </div>
                        </div>
                        <div className="clear-confirm-detail">
                            <div>
                                <span>Student</span>
                                <strong>{clearConfirmRow.studentName || '-'}</strong>
                            </div>
                            <div>
                                <span>Student ID</span>
                                <strong>{clearConfirmRow.studentNumber}</strong>
                            </div>
                            <div>
                                <span>Outstanding Balance</span>
                                <strong>{toCurrency(clearConfirmRow.balance)}</strong>
                            </div>
                            <div>
                                <span>Current Standing</span>
                                <strong>In debt</strong>
                            </div>
                        </div>
                        <label className="clear-bank-field">
                            <span>Bank paid through</span>
                            <select value={clearConfirmBank} onChange={(event) => setClearConfirmBank(event.target.value)}>
                                <option value="">Select bank from receipt</option>
                                <option value="BK">BK</option>
                                <option value="EQUITY">Equity</option>
                            </select>
                        </label>
                        <div className="popup-actions">
                            <button
                                type="button"
                                className="secondary-action"
                                onClick={() => {
                                    setClearConfirmRow(null);
                                    setClearConfirmBank('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void clearStudentDebt(clearConfirmRow.studentNumber)}
                                disabled={clearingStudentNumber === clearConfirmRow.studentNumber || !clearConfirmBank}
                            >
                                {clearingStudentNumber === clearConfirmRow.studentNumber ? 'Clearing...' : 'Yes, Clear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRequestModal && (
                <div className="popup-backdrop">
                    <div className="popup-card expense-popup">
                        <h3>Supplementary Budget Request</h3>
                        <form onSubmit={submitFundRequest} className="expense-stepper-form">
                            <section className={`expense-step-section ${requestStep === 1 ? 'active' : ''}`} onClick={() => setRequestStep(1)}>
                                <div className="expense-step-number">1</div>
                                <div className="expense-step-content">
                                    <h4>Request Information</h4>
                                    <div className="expense-step-fields">
                                        <label>
                                            Request Title
                                            <input placeholder="Supplementary request title" value={fundRequestForm.title} onChange={(e) => setFundRequestForm((prev) => ({ ...prev, title: e.target.value }))} required />
                                        </label>
                                        <label>
                                            Requested Amount
                                            <input type="number" min={1} placeholder="Amount in RWF" value={fundRequestForm.requestedAmount} onChange={(e) => setFundRequestForm((prev) => ({ ...prev, requestedAmount: e.target.value }))} required />
                                        </label>
                                    </div>
                                </div>
                            </section>
                            <section className={`expense-step-section ${requestStep === 2 ? 'active' : ''}`} onClick={() => setRequestStep(2)}>
                                <div className="expense-step-number">2</div>
                                <div className="expense-step-content">
                                    <h4>Budget Period</h4>
                                    <div className="expense-step-fields two-col">
                                        <label>
                                            Start Date
                                            <input type="date" value={fundRequestForm.allocationStartDate} onChange={(e) => setFundRequestForm((prev) => ({ ...prev, allocationStartDate: e.target.value }))} required />
                                        </label>
                                        <label>
                                            End Date
                                            <input type="date" value={fundRequestForm.allocationEndDate} onChange={(e) => setFundRequestForm((prev) => ({ ...prev, allocationEndDate: e.target.value }))} required />
                                        </label>
                                    </div>
                                </div>
                            </section>
                            <section className={`expense-step-section ${requestStep === 3 ? 'active' : ''}`} onClick={() => setRequestStep(3)}>
                                <div className="expense-step-number">3</div>
                                <div className="expense-step-content">
                                    <h4>Justification</h4>
                                    <div className="expense-step-fields">
                                        <label>
                                            Purpose and Reason
                                            <textarea rows={3} placeholder="Explain why the automatically assigned operating budget cannot cover this expense." value={fundRequestForm.purpose} onChange={(e) => setFundRequestForm((prev) => ({ ...prev, purpose: e.target.value }))} required />
                                        </label>
                                    </div>
                                </div>
                            </section>
                            <section className={`expense-step-section ${requestStep === 4 ? 'active' : ''}`} onClick={() => setRequestStep(4)}>
                                <div className="expense-step-number">4</div>
                                <div className="expense-step-content">
                                    <h4>Invoice Support</h4>
                                    <label className="expense-upload-field">
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setRequestInvoiceFile(e.target.files?.[0] ?? null)} />
                                        <em>{requestInvoiceFile ? requestInvoiceFile.name : 'Upload invoice file'}</em>
                                    </label>
                                </div>
                            </section>
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
                    <div className="popup-card expense-popup">
                        <h3>Log Expense + Receipt</h3>
                        <form onSubmit={submitExpense} className="expense-stepper-form" noValidate>
                            <section className={`expense-step-section ${expenseStep === 1 ? 'active' : ''} ${expenseSubmitAttempted && expenseSectionErrors.one ? 'has-error' : ''}`} onClick={() => setExpenseStep(1)}>
                                <div className="expense-step-number">1</div>
                                <div className="expense-step-content">
                                    <h4>Budget and Expense Details</h4>
                                    <div className="expense-step-fields">
                                        <label>
                                            Assigned Budget
                                            <select
                                                value={expenseForm.fundRequestId}
                                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, fundRequestId: e.target.value }))}
                                                required
                                            >
                                                <option value="">Select approved assigned budget</option>
                                                {approvedRequests.length === 0 && (
                                                    <option value="" disabled>No approved assigned budget found</option>
                                                )}
                                                {approvedRequests.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.title === OPERATING_BUDGET_TITLE ? 'Collected Fees Operating Budget' : item.title} ({toCurrency(item.remainingApprovedAmount)} left)
                                                    </option>
                                                ))}
                                            </select>
                                            {approvedRequests.length === 0 && (
                                                <span className="expense-field-note warning">
                                                    No approved budget is ready yet. Verify collected fees or approve a supplementary budget first.
                                                </span>
                                            )}
                                        </label>
                                        <div className="two-col">
                                            <label>
                                                Expense Date
                                                <input
                                                    type="date"
                                                    value={expenseForm.expenseDate}
                                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                                                    required
                                                />
                                            </label>
                                            <label>
                                                Amount Used
                                                <input
                                                    type="number"
                                                    min={1}
                                                    placeholder="Enter amount in RWF"
                                                    value={expenseForm.amount}
                                                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                                                    required
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section className={`expense-step-section ${expenseStep === 2 ? 'active' : ''} ${expenseSubmitAttempted && expenseSectionErrors.two ? 'has-error' : ''}`} onClick={() => setExpenseStep(2)}>
                                <div className="expense-step-number">2</div>
                                <div className="expense-step-content">
                                    <h4>Receiver and Description</h4>
                                    <div className="expense-step-fields">
                                        <label>
                                            Receiver
                                            <input
                                                placeholder="Enter receiver"
                                                value={expenseForm.vendor}
                                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendor: e.target.value }))}
                                                required
                                            />
                                        </label>
                                        <label>
                                            Expense Description
                                            <textarea
                                                rows={3}
                                                placeholder="Describe what the money was used for"
                                                value={expenseForm.description}
                                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                                                required
                                            />
                                        </label>
                                    </div>
                                </div>
                            </section>
                            <section className={`expense-step-section ${expenseStep === 3 ? 'active' : ''} ${expenseSubmitAttempted && expenseSectionErrors.three ? 'has-error' : ''}`} onClick={() => setExpenseStep(3)}>
                                <div className="expense-step-number">3</div>
                                <div className="expense-step-content">
                                    <h4>Category and Payment Method</h4>
                                    <div className="expense-step-fields two-col">
                                        <label>
                                            Expense Category
                                            <select
                                                value={expenseForm.category}
                                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                                            >
                                                <option value="operations">Operations</option>
                                                <option value="events">Events</option>
                                                <option value="transport">Transport</option>
                                                <option value="refreshments">Refreshments</option>
                                                <option value="welfare">Welfare</option>
                                                <option value="staff_welfare">Staff Welfare</option>
                                                <option value="equipment">Equipment</option>
                                                <option value="communication">Communication</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </label>
                                        <label>
                                            Payment Method
                                            <select
                                                value={expenseForm.method}
                                                onChange={(e) => setExpenseForm((prev) => ({ ...prev, method: e.target.value as ExpenseMethod }))}
                                            >
                                                <option value="mobile_money">Mobile Money</option>
                                                <option value="bank">Bank</option>
                                                <option value="cash">Cash</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </section>
                            <section className={`expense-step-section ${expenseStep === 4 ? 'active' : ''} ${expenseSubmitAttempted && expenseSectionErrors.four ? 'has-error' : ''}`} onClick={() => setExpenseStep(4)}>
                                <div className="expense-step-number">4</div>
                                <div className="expense-step-content">
                                    <h4>Usage Receipt</h4>
                                    <label className="expense-upload-field">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setExpenseReceiptFile(e.target.files?.[0] ?? null)}
                                        />
                                        <em>{expenseReceiptFile ? expenseReceiptFile.name : 'Upload receipt file'}</em>
                                    </label>
                                </div>
                            </section>
                            {selectedExpenseRequest && (
                                <div className={`expense-balance-preview ${selectedRemainingAfterExpense < 0 ? 'danger' : ''}`}>
                                    <div>
                                        <small>Assigned Budget</small>
                                        <strong>{selectedExpenseRequest.title}</strong>
                                    </div>
                                    <div>
                                        <small>Current Balance</small>
                                        <strong>{toCurrency(selectedExpenseRequest.remainingApprovedAmount)}</strong>
                                    </div>
                                    <div>
                                        <small>Balance After Expense</small>
                                        <strong>{toCurrency(Math.max(selectedRemainingAfterExpense, 0))}</strong>
                                    </div>
                                </div>
                            )}
                            <div className="action-row">
                                <button type="submit">Submit Expense</button>
                                <button type="button" className="danger" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showIncomeModal && (
                <div className="popup-backdrop">
                    <div className="popup-card expense-popup">
                        <h3>Log Daily Income</h3>
                        <p className="hint-text">Record income earned from services such as printing, photocopying, or other daily activities.</p>
                        <form onSubmit={submitIncome} className="form-grid">
                            <div className="two-col">
                                <label>
                                    Income Date
                                    <input
                                        type="date"
                                        value={incomeForm.incomeDate}
                                        onChange={(e) => setIncomeForm((prev) => ({ ...prev, incomeDate: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Amount Gained
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Enter amount in RWF"
                                        value={incomeForm.amount}
                                        onChange={(e) => setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))}
                                        required
                                    />
                                </label>
                            </div>
                            <div className="two-col">
                                <label>
                                    Income Source
                                    <input
                                        placeholder="Example: Printer service"
                                        value={incomeForm.source}
                                        onChange={(e) => setIncomeForm((prev) => ({ ...prev, source: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Payment Method
                                    <select
                                        value={incomeForm.method}
                                        onChange={(e) => setIncomeForm((prev) => ({ ...prev, method: e.target.value }))}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="mobile_money">Mobile Money</option>
                                        <option value="bank">Bank</option>
                                    </select>
                                </label>
                            </div>
                            <label>
                                Income Description
                                <textarea
                                    rows={3}
                                    placeholder="Describe how this income was earned"
                                    value={incomeForm.description}
                                    onChange={(e) => setIncomeForm((prev) => ({ ...prev, description: e.target.value }))}
                                    required
                                />
                            </label>
                            <div className="action-row">
                                <button type="submit">Submit Income</button>
                                <button type="button" className="danger" onClick={() => setShowIncomeModal(false)}>Cancel</button>
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

            {showAllPaymentsModal && (
                <div className="popup-backdrop">
                    <div className="popup-card" style={{ width: 'min(1200px, 95vw)', maxHeight: '85vh', overflow: 'auto' }}>
                        <h3>All Payment Registry</h3>
                        <p className="hint-text">Complete payment records used for registry validation and student clearance.</p>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Student</th>
                                        <th>Transaction</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Receipt</th>
                                        <th>Paid At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPayments.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>
                                                <strong>{item.studentNumber ?? item.studentCode ?? item.studentId ?? item.payerInfo?.studentCode ?? '-'}</strong>
                                                <small>{item.studentName ?? item.payerInfo?.studentName ?? '-'}</small>
                                            </td>
                                            <td>{item.transactionId ?? item.externalReference ?? item.reference ?? '-'}</td>
                                            <td>{item.amount ?? 0} {item.currency ?? 'RWF'}</td>
                                            <td>{item.method ?? '-'}</td>
                                            <td>{item.status ?? '-'}</td>
                                            <td>{item.receiptStatus ?? '-'}</td>
                                            <td>{formatDate(item.paidAt)}</td>
                                        </tr>
                                    ))}
                                    {!isLoadingAllPayments && allPayments.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="empty">No payment records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="action-row" style={{ marginTop: '0.9rem' }}>
                            <button type="button" onClick={() => void loadAllPayments()} disabled={isLoadingAllPayments}>
                                {isLoadingAllPayments ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button type="button" className="danger" onClick={() => setShowAllPaymentsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

const expenseCategoryLabel = (value?: string) => {
    const labels: Record<string, string> = {
        operations: 'Operations',
        events: 'Events',
        transport: 'Transport',
        refreshments: 'Refreshments',
        welfare: 'Welfare',
        staff_welfare: 'Staff Welfare',
        equipment: 'Equipment',
        communication: 'Communication',
        other: 'Other',
    };
    return labels[String(value ?? '').toLowerCase()] ?? String(value ?? '-').replace('_', ' ');
};

export default FinancePaymentReview;

