import React, { useEffect, useMemo, useState } from 'react';
import {
    ShieldCheck,
    Landmark,
    ArrowUpRight,
    Download,
    ScanText,
    AlertTriangle,
    CheckCircle2,
    LoaderCircle,
    X,
} from 'lucide-react';
import urubutoPayLogo from '../assets/urubutopay.png';
import './Payments.css';

interface PaymentRecord {
    id: number;
    studentNumber?: string;
    receiptNumber: string;
    externalReference?: string;
    status: string;
    amount: number;
    paidAt?: string;
    receiptStatus?: string;
    registryMatchStatus?: string;
    registryMatchMessage?: string;
}

interface WalletInfo {
    walletName: string;
    walletCode: string;
    provider: string;
    bankAccount: string;
    currency: string;
}

interface ReceiptQrResult {
    goodToGo: boolean;
    message: string;
    qrToken: string;
    studentName: string;
    studentNumber: string;
    receiptNumber: string;
}

const wrapReceiptNumber = (receiptNumber?: string) => {
    const value = receiptNumber || '-';
    return value.match(/.{1,24}/g)?.join('\n              ') ?? value;
};

const buildReceiptQrDisplayPayload = (receipt: ReceiptQrResult) => [
    'AUCASA RECEIPT VERIFICATION',
    '----------------------------',
    `Name        : ${receipt.studentName || '-'}`,
    `Student ID  : ${receipt.studentNumber || '-'}`,
    `Receipt No. : ${wrapReceiptNumber(receipt.receiptNumber)}`,
    `Status      : Safe to go`,
    '----------------------------',
    'Verified receipt. Please keep this confirmation.',
].join('\n');

interface TransparencySummary {
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
}

interface PaymentsProps {
    studentId: number | null;
    studentNumber: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';
const URUBUTO_PAY_URL = 'https://urubutopay.rw/pay-now/initiate';
const URUBUTO_MERCHANT_CODE = 'TH61132546';
const BK_ACCOUNT_CODE = '00040 - 00280275 - 75';
const formatRwf = (value?: number) => new Intl.NumberFormat('en-RW').format(Number(value ?? 0));
const PAID_STATUSES = new Set(['COMPLETED', 'VERIFIED', 'PAID']);

const Payments: React.FC<PaymentsProps> = ({ studentId, studentNumber }) => {
    const resolvedStudentId = studentId ?? 0;

    const [isLoading, setIsLoading] = useState(false);
    const [payment, setPayment] = useState<PaymentRecord | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'URUBUTO_PAY' | 'BANK_TRANSFER'>('URUBUTO_PAY');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [paymentSuccessToast, setPaymentSuccessToast] = useState('');
    const [transparency, setTransparency] = useState<TransparencySummary | null>(null);
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [history, setHistory] = useState<PaymentRecord[]>([]);
    const [mobilePhone, setMobilePhone] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [isStartingPayment, setIsStartingPayment] = useState(false);
    const [receiptQr, setReceiptQr] = useState<ReceiptQrResult | null>(null);
    const [isVerifyingReceipt, setIsVerifyingReceipt] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showMobilePromptModal, setShowMobilePromptModal] = useState(false);
    const resolvedPayerCode = String(resolvedStudentId || '').trim()
        || (studentNumber ?? '').trim()
        || (payment?.studentNumber ?? '').trim();
    const urubutoInitiateUrl = useMemo(() => {
        const externalReference = `AUCASA-${resolvedPayerCode}-${Date.now()}`;
        const params = new URLSearchParams({
            origin: 'internal',
            merchantCode: URUBUTO_MERCHANT_CODE,
            merchant_code: URUBUTO_MERCHANT_CODE,
            payerCode: resolvedPayerCode,
            payer_code: resolvedPayerCode,
            externalReference,
            external_reference: externalReference,
            reference: externalReference,
        });
        return `${URUBUTO_PAY_URL}?${params.toString()}`;
    }, [resolvedPayerCode]);

    const visiblePayments = useMemo(() => {
        const byId = new Map<number, PaymentRecord>();
        [...history, ...(payment ? [payment] : [])].forEach((item) => {
            if (item?.id) {
                byId.set(item.id, item);
            }
        });
        return Array.from(byId.values());
    }, [history, payment]);

    const balanceOwed = useMemo(
        () => visiblePayments.reduce((total, item) => (
            PAID_STATUSES.has(String(item.status ?? '').toUpperCase()) ? total : total + Number(item.amount ?? 0)
        ), 0),
        [visiblePayments]
    );

    const paidTotal = useMemo(
        () => visiblePayments.reduce((total, item) => (
            PAID_STATUSES.has(String(item.status ?? '').toUpperCase()) ? total + Number(item.amount ?? 0) : total
        ), 0),
        [visiblePayments]
    );

    const balanceMessage = balanceOwed > 0
        ? `You owe ${formatRwf(balanceOwed)} RWF. Please clear this balance.`
        : 'Your balance is 0 RWF. You are fully paid.';
    const isBalanceClear = balanceOwed <= 0;

    const ensureObligation = async (): Promise<PaymentRecord> => {
        const response = await fetch(`${API_BASE}/api/payments/obligations/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: resolvedStudentId }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error ?? 'Failed to create/find payment obligation.');
        }

        const data = await response.json();
            const mapped: PaymentRecord = {
                id: data.id,
                studentNumber: data.studentNumber,
                receiptNumber: data.receiptNumber,
                externalReference: data.externalReference,
                status: data.status,
                amount: data.amount,
                paidAt: data.paidAt,
                receiptStatus: data.receiptStatus,
                registryMatchStatus: data.registryMatchStatus,
                registryMatchMessage: data.registryMatchMessage,
            };
        setPayment(mapped);
        return mapped;
    };

    const mapPaymentRecord = (data: Partial<PaymentRecord>): PaymentRecord => ({
        id: Number(data.id),
        studentNumber: data.studentNumber,
        receiptNumber: String(data.receiptNumber ?? ''),
        externalReference: data.externalReference,
        status: String(data.status ?? 'PENDING'),
        amount: Number(data.amount ?? 0),
        paidAt: data.paidAt,
        receiptStatus: data.receiptStatus,
        registryMatchStatus: data.registryMatchStatus,
        registryMatchMessage: data.registryMatchMessage,
    });

    const resolveCurrentPayment = async (): Promise<PaymentRecord> => {
        if (!payment?.id) {
            return ensureObligation();
        }
        const response = await fetch(`${API_BASE}/api/payments/${payment.id}`);
        if (response.ok) {
            const data = await response.json();
            const mapped = mapPaymentRecord(data);
            setPayment(mapped);
            return mapped;
        }
        if (response.status === 404) {
            setPayment(null);
            return ensureObligation();
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not refresh payment record.');
    };

    const loadTransparencySummary = async () => {
        const response = await fetch(`${API_BASE}/api/finance/transparency/summary`);
        if (!response.ok) {
            return;
        }
        const data = await response.json().catch(() => null);
        setTransparency(data);
    };

    const loadWallet = async () => {
        const response = await fetch(`${API_BASE}/api/payments/wallet`);
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        setWallet(data);
    };

    const loadHistory = async () => {
        if (!resolvedStudentId) return;
        const response = await fetch(`${API_BASE}/api/payments/history/student/${resolvedStudentId}`);
        if (!response.ok) return;
        const data = await response.json().catch(() => []);
        const rows = Array.isArray(data) ? data : [];
        setHistory(rows);
        if (rows.length > 0) {
            const latest = rows[0] as PaymentRecord;
            setPayment((prev) => prev ?? latest);
        }
    };

    const handleStartMobileMoneyPayment = async () => {
        if (isBalanceClear) {
            setError('Your balance is 0 RWF. New payments are blocked.');
            return;
        }
        if (!mobilePhone.trim()) {
            setError('Phone number is required to start mobile payment.');
            return;
        }
        setError('');
        setInfo('');
        setPaymentSuccessToast('');
        setIsStartingPayment(true);
        try {
            const activePayment = payment?.id ? payment : await ensureObligation();
            const response = await fetch(`${API_BASE}/api/payments/${activePayment.id}/start-mobile-money`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: mobilePhone.trim() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to start payment.');
            }

            const updatedPayment = data.payment ? {
                id: data.payment.id,
                studentNumber: data.payment.studentNumber,
                receiptNumber: data.payment.receiptNumber,
                externalReference: data.payment.externalReference,
                status: data.payment.status,
                amount: data.payment.amount,
                paidAt: data.payment.paidAt,
                receiptStatus: data.payment.receiptStatus,
                registryMatchStatus: data.payment.registryMatchStatus,
                registryMatchMessage: data.payment.registryMatchMessage,
            } : null;
            if (updatedPayment) {
                setPayment(updatedPayment);
            }
            await loadHistory();
            await loadTransparencySummary();
            const isPaid = updatedPayment && PAID_STATUSES.has(String(updatedPayment.status ?? '').toUpperCase());
            const successMessage = isPaid
                ? `Payment successful. Your current balance is 0 RWF for this paid item.`
                : (data.message ?? `Payment prompt sent to ${mobilePhone.trim()}. Please confirm on your phone, then refresh or validate your receipt.`);
            setInfo(successMessage);
            if (isPaid) {
                setPaymentSuccessToast(successMessage);
                window.setTimeout(() => setPaymentSuccessToast(''), 6000);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start payment.');
        } finally {
            setIsStartingPayment(false);
        }
    };

    const handleVerifyReceipt = async (targetPayment?: PaymentRecord) => {
        const paymentToVerify = targetPayment ?? payment;
        if (!paymentToVerify?.id || !resolvedStudentId) {
            setError('Missing payment/student record for verification.');
            return;
        }
        setError('');
        setInfo('');
        setIsVerifyingReceipt(true);
        try {
            const response = await fetch(`${API_BASE}/api/payments/${paymentToVerify.id}/receipt/verify-self`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: resolvedStudentId }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Receipt verification failed.');
            }
            setReceiptQr(data as ReceiptQrResult);
            setInfo((data as ReceiptQrResult).message || 'Receipt verified.');
            await loadHistory();
            await loadTransparencySummary();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Receipt verification failed.');
            setReceiptQr(null);
        } finally {
            setIsVerifyingReceipt(false);
        }
    };

    const handleGenerateQr = async () => {
        setError('');
        setInfo('');

        // Ask the backend to verify/clear the receipt and issue the QR. This allows
        // already-submitted transaction IDs to return the existing clearance QR.
        try {
            const activePayment = await resolveCurrentPayment();
            await handleVerifyReceipt(activePayment);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not prepare payment for QR generation.');
        }
    };

    const handleDownloadReceipt = () => {
        if (!payment?.id) {
            setError('No payment record found.');
            return;
        }
        const hasReceipt = Boolean(payment.receiptStatus || payment.paidAt || payment.externalReference);
        if (!hasReceipt) {
            setError('Receipt is not available yet. Complete payment first.');
            return;
        }
        window.open(`${API_BASE}/api/payments/${payment.id}/receipt/file`, '_blank', 'noopener,noreferrer');
    };

    const openReceiptValidationModal = () => {
        if (isBalanceClear) {
            setError('Your balance is 0 RWF. New receipt payments are blocked.');
            return;
        }
        setError('');
        setInfo('');
        setShowVerifyModal(true);
    };

    const closeReceiptValidationModal = () => {
        setShowVerifyModal(false);
        setError('');
        setInfo('');
    };

    const handleUploadReceipt = async () => {
        if (isBalanceClear) {
            setError('Your balance is 0 RWF. New receipt payments are blocked.');
            return;
        }
        if (!receiptFile) {
            setError('Please select a receipt image first.');
            return;
        }
        if (!mobilePhone.trim()) {
            setError('Enter your phone number before uploading receipt.');
            return;
        }

        setError('');
        setInfo('');
        setIsUploadingReceipt(true);
        try {
            const activePayment = await resolveCurrentPayment();
            const formData = new FormData();
            formData.append('phoneNumber', mobilePhone.trim());
            formData.append('method', 'URUBUTO_PAY');
            formData.append('autoVerify', 'false');
            if (transactionId.trim()) {
                formData.append('transactionId', transactionId.trim());
            }
            formData.append('receiptFile', receiptFile);

            const response = await fetch(`${API_BASE}/api/payments/${activePayment.id}/receipt/submit`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Failed to upload receipt.');
            }

            setPayment({
                id: data.id,
                studentNumber: data.studentNumber,
                receiptNumber: data.receiptNumber,
                externalReference: data.externalReference,
                status: data.status,
                amount: data.amount,
                paidAt: data.paidAt,
                receiptStatus: data.receiptStatus,
                registryMatchStatus: data.registryMatchStatus,
                registryMatchMessage: data.registryMatchMessage,
            });
            setInfo(data.registryMatchMessage || 'Receipt uploaded and sent for registry validation.');
            setReceiptFile(null);
            setTransactionId('');
            await loadHistory();
            await handleVerifyReceipt();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to upload receipt.');
        } finally {
            setIsUploadingReceipt(false);
        }
    };

    useEffect(() => {
        const run = async () => {
            setError('');
            setInfo('');
            setPayment(null);
            if (!resolvedStudentId) {
                setError('Your student profile is missing. Please sign in again.');
                return;
            }
            try {
                setIsLoading(true);
                await loadTransparencySummary();
                await loadWallet();
                await ensureObligation();
                await loadHistory();
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not load payment page.');
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, [resolvedStudentId, studentNumber]);

    return (
        <div className="finance-page finance-page--student">
            {paymentSuccessToast && (
                <div className="payment-success-toast">
                    <CheckCircle2 size={20} />
                    <span>{paymentSuccessToast}</span>
                    <button type="button" onClick={() => setPaymentSuccessToast('')} aria-label="Close payment success message">
                        <X size={16} />
                    </button>
                </div>
            )}
            {showVerifyModal && (isUploadingReceipt || error || info) && (
                <div className={`payment-feedback-popup ${error ? 'error' : isUploadingReceipt ? 'loading' : 'success'}`}>
                    <div className="payment-feedback-icon">
                        {error ? <AlertTriangle size={20} /> : isUploadingReceipt ? <LoaderCircle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                        <strong>{error ? 'Receipt validation failed' : isUploadingReceipt ? 'Validating receipt with OCR' : 'Receipt update'}</strong>
                        <p>{error || (isUploadingReceipt ? 'Uploading your receipt and reading the transaction details. Please wait...' : info)}</p>
                    </div>
                </div>
            )}
            <header className="finance-page-bar payments-page-bar">
                <h1>Payments &amp; Receipts</h1>
                <p>Pay fees, validate receipts, and view fund transparency.</p>
            </header>
            {error && <div className="finance-alert error">{error}</div>}
            {info && <div className="finance-alert success">{info}</div>}
            <section className="finance-grid">
                <div className="finance-main">
                    <article className={`panel balance-panel ${balanceOwed > 0 ? 'balance-panel--owed' : 'balance-panel--clear'}`}>
                        <div>
                            <span>Student Balance</span>
                            <strong>{formatRwf(balanceOwed)} RWF</strong>
                            <p>{balanceMessage}</p>
                        </div>
                        <div className="balance-mini-grid">
                            <div>
                                <span>Total Paid</span>
                                <strong>{formatRwf(paidTotal)} RWF</strong>
                            </div>
                            <div>
                                <span>Unpaid Items</span>
                                <strong>{visiblePayments.filter((item) => !PAID_STATUSES.has(String(item.status ?? '').toUpperCase())).length}</strong>
                            </div>
                        </div>
                    </article>
                    <article className="panel methods-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Payment Methods</h2>
                                <p>Choose your preferred payment channel and continue.</p>
                            </div>
                            <ShieldCheck size={18} />
                        </div>

                        <div className="method-cards">
                            <button
                                className={`method-card ${selectedMethod === 'URUBUTO_PAY' ? 'active' : ''}`}
                                onClick={() => setSelectedMethod('URUBUTO_PAY')}
                            >
                                <div className="method-icon logo">
                                    <img src={urubutoPayLogo} alt="UrubutoPay" />
                                </div>
                                <h3>UrubutoPay</h3>
                                <p>Fast mobile and web payment processing.</p>
                                <span className="method-link">Recommended</span>
                            </button>

                            <button
                                className={`method-card ${selectedMethod === 'BANK_TRANSFER' ? 'active' : ''}`}
                                onClick={() => setSelectedMethod('BANK_TRANSFER')}
                            >
                                <div className="method-icon">
                                    <Landmark size={20} />
                                </div>
                                <h3>Bank of Kigali</h3>
                                <p>Direct bank transfer using official account details.</p>
                                <span className="method-link">Bank transfer details</span>
                            </button>
                        </div>

                        <div className="code-strip">
                            <div>
                                <span>Wallet Code</span>
                                <strong>{wallet?.walletCode ?? URUBUTO_MERCHANT_CODE}</strong>
                            </div>
                            <div>
                                <span>BK Account Code</span>
                                <strong>{wallet?.bankAccount ?? BK_ACCOUNT_CODE}</strong>
                            </div>
                        </div>

                        <div className="method-actions">
                            <div className="payment-action-row primary-actions">
                                <button
                                    className="primary-btn action-btn-wide"
                                    onClick={() => setShowMobilePromptModal(true)}
                                    disabled={isStartingPayment || isBalanceClear}
                                >
                                    {isBalanceClear ? 'Balance Clear' : isStartingPayment ? 'Sending Prompt...' : 'Pay Now'}
                                </button>
                                <button
                                    className="primary-btn action-btn-wide"
                                    onClick={() => window.open(urubutoInitiateUrl || URUBUTO_PAY_URL, '_blank', 'noopener,noreferrer')}
                                    disabled={isBalanceClear}
                                >
                                    Continue with Urubuto <ArrowUpRight size={16} />
                                </button>
                            </div>
                            <div className="payment-action-row secondary-actions">
                                <button className="ghost-action-btn ocr-action-btn" onClick={openReceiptValidationModal} disabled={isBalanceClear}>
                                    <ScanText size={16} />
                                    Validate Receipt with OCR
                                </button>
                                <button className="ghost-action-btn" onClick={handleDownloadReceipt}>
                                    <Download size={16} />
                                    Download Your Receipt
                                </button>
                                <button
                                    className="ghost-action-btn"
                                    onClick={handleGenerateQr}
                                    disabled={isVerifyingReceipt}
                                >
                                    {isVerifyingReceipt ? 'Generating QR...' : 'Generate QR'}
                                </button>
                            </div>
                            <p style={{ marginTop: '0.45rem', color: '#55657f', fontSize: '0.82rem' }}>
                                Merchant code, payer code (your student ID), amount, and fee purpose are auto-filled.
                            </p>
                            {receiptQr?.goodToGo && receiptQr.qrToken && (
                                <div className="receipt-qr-card">
                                    <strong>{receiptQr.message}</strong>
                                    <div className="receipt-qr-body">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(buildReceiptQrDisplayPayload(receiptQr))}`}
                                            alt={`Verified receipt QR for ${receiptQr.studentName}`}
                                            className="receipt-qr-image"
                                        />
                                        <div className="receipt-qr-details">
                                            <div>
                                                <span>Name</span>
                                                <strong>{receiptQr.studentName}</strong>
                                            </div>
                                            <div>
                                                <span>Student ID</span>
                                                <strong>{receiptQr.studentNumber}</strong>
                                            </div>
                                            <div>
                                                <span>Receipt Number</span>
                                                <strong>{receiptQr.receiptNumber}</strong>
                                            </div>
                                            <div>
                                                <span>Status</span>
                                                <strong>Safe to go</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </article>

                    <div className="finance-info-row">
                        <article className="panel info-panel">
                            <h2>Payment Information</h2>
                            <div className="info-grid">
                                <div>
                                    <span>Payer Code (Student ID)</span>
                                    <strong>{resolvedPayerCode || '-'}</strong>
                                </div>
                                <div>
                                    <span>Reference</span>
                                    <strong>{payment?.receiptNumber ?? '-'}</strong>
                                </div>
                                <div>
                                    <span>Transaction ID</span>
                                    <strong>{payment?.externalReference ?? '-'}</strong>
                                </div>
                                <div>
                                    <span>Status</span>
                                    <strong>{payment?.status ?? (isLoading ? 'Loading...' : 'Pending')}</strong>
                                </div>
                                <div>
                                    <span>Current Item Amount</span>
                                    <strong>{payment?.amount ? `${formatRwf(payment.amount)} RWF` : '3,000 RWF'}</strong>
                                </div>
                                <div>
                                    <span>Amount You Owe</span>
                                    <strong>{`${formatRwf(balanceOwed)} RWF`}</strong>
                                </div>
                            </div>
                        </article>

                        <article className="panel info-panel">
                            <h2>Student Finance Transparency</h2>
                            <div className="info-grid">
                                <div>
                                    <span>Total Collected</span>
                                    <strong>{transparency ? `${formatRwf(transparency.totalCollected)} RWF` : '-'}</strong>
                                </div>
                                <div>
                                    <span>Total Approved</span>
                                    <strong>{transparency ? `${formatRwf(transparency.totalApproved)} RWF` : '-'}</strong>
                                </div>
                                <div>
                                    <span>Total Spent</span>
                                    <strong>{transparency ? `${formatRwf(transparency.totalSpent)} RWF` : '-'}</strong>
                                </div>
                                <div>
                                    <span>Remaining Balance</span>
                                    <strong>{transparency ? `${formatRwf(transparency.remainingBalance)} RWF` : '-'}</strong>
                                </div>
                            </div>
                            <div style={{ marginTop: '0.75rem' }}>
                                <strong style={{ color: '#12335f', fontSize: '0.9rem' }}>Latest updates from Finance</strong>
                                {(transparency?.latestUpdates ?? []).slice(0, 3).map((item) => (
                                    <div key={item.id} style={{ marginTop: '0.45rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.45rem' }}>
                                        <div style={{ fontWeight: 700, color: '#1f3357', fontSize: '0.85rem' }}>{item.title}</div>
                                        <div style={{ color: '#52627c', fontSize: '0.82rem' }}>{item.message}</div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>

                    <article className="panel transactions-panel">
                        <div className="panel-head">
                            <h2>Recent Transactions</h2>
                        </div>
                        <div className="tx-table">
                            <div className="tx-row header">
                                <span>Date</span>
                                <span>Phone Number</span>
                                <span>Status</span>
                                <span>Amount</span>
                            </div>
                            {(visiblePayments.length > 0 ? visiblePayments : [payment]).filter(Boolean).map((item) => (
                                <div className="tx-row" key={item?.id}>
                                    <span>{item?.paidAt ? new Date(item.paidAt).toLocaleDateString() : '-'}</span>
                                    <span>{mobilePhone.trim() || '-'}</span>
                                    <span>{item?.status ?? 'PENDING'}</span>
                                    <span>{item?.amount ? `${formatRwf(item.amount)} RWF` : '3,000 RWF'}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                </div>

            </section>
            {showVerifyModal && (
                <div className="payment-modal-backdrop">
                    <div className="payment-modal-card receipt-validation-modal">
                        <button className="payment-modal-close" onClick={closeReceiptValidationModal} aria-label="Close receipt validation">
                            <X size={18} />
                        </button>
                        <div className="receipt-validation-head">
                            <span className="receipt-validation-icon">
                                <ScanText size={22} />
                            </span>
                            <div>
                                <h3>Validate Receipt with OCR</h3>
                                <p>Upload your receipt and let the system read the payment details automatically.</p>
                            </div>
                        </div>
                        <div className="receipt-validation-form">
                            <label>
                                Mobile Number
                                <input
                                    type="text"
                                    placeholder="e.g. 078xxxxxxx"
                                    value={mobilePhone}
                                    onChange={(e) => setMobilePhone(e.target.value)}
                                />
                            </label>
                            <label>
                                Receipt Image
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,image/*"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                                />
                                <span className="receipt-file-preview">{receiptFile ? receiptFile.name : 'Choose JPG or PNG receipt image'}</span>
                            </label>
                            <label>
                                Transaction ID
                                <input
                                    type="text"
                                    placeholder="Optional if OCR reads it"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                />
                            </label>
                            <div className="receipt-validation-actions">
                                <button
                                    className="receipt-primary-action"
                                    onClick={handleUploadReceipt}
                                    disabled={isUploadingReceipt}
                                >
                                    {isUploadingReceipt ? 'Uploading Receipt...' : 'Upload and Scan Receipt'}
                                </button>
                                <button
                                    className="receipt-secondary-action"
                                    onClick={() => void handleVerifyReceipt()}
                                    disabled={isVerifyingReceipt}
                                >
                                    {isVerifyingReceipt ? 'Verifying...' : 'Verify Existing Receipt'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMobilePromptModal && (
                <div className="payment-modal-backdrop">
                    <div className="payment-modal-card mobile-payment-modal">
                        <h3>Start Mobile Payment Prompt</h3>
                        <p>
                            Enter your phone number to receive a payment prompt.
                        </p>
                        <div className="mobile-payment-form">
                            <input
                                type="text"
                                placeholder="Mobile number (e.g. 078xxxxxxx)"
                                value={mobilePhone}
                                onChange={(e) => setMobilePhone(e.target.value)}
                            />
                            <button
                                className="primary-btn"
                                onClick={async () => {
                                    await handleStartMobileMoneyPayment();
                                    setShowMobilePromptModal(false);
                                }}
                                disabled={isStartingPayment || isBalanceClear}
                            >
                                {isBalanceClear ? 'Balance Clear' : isStartingPayment ? 'Sending Prompt...' : 'Send Prompt'}
                            </button>
                            <button
                                className="primary-btn secondary-modal-btn"
                                onClick={() => setShowMobilePromptModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
