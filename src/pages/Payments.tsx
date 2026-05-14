import React, { useEffect, useMemo, useState } from 'react';
import {
    ShieldCheck,
    Landmark,
    ArrowUpRight,
    Download,
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

interface ImsPaymentSnapshot {
    studentId?: string;
    balance?: unknown;
    fees?: unknown;
    paymentInfo?: unknown;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';
const URUBUTO_PAY_URL = 'https://urubutopay.rw/pay-now/initiate';
const URUBUTO_MERCHANT_CODE = 'TH61132546';
const BK_ACCOUNT_CODE = '00040 - 00280275 - 75';
const formatRwf = (value?: number) => new Intl.NumberFormat('en-RW').format(Number(value ?? 0));

const Payments: React.FC<PaymentsProps> = ({ studentId, studentNumber }) => {
    const resolvedStudentId = studentId ?? 0;

    const [isLoading, setIsLoading] = useState(false);
    const [payment, setPayment] = useState<PaymentRecord | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'URUBUTO_PAY' | 'BANK_TRANSFER'>('URUBUTO_PAY');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
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
    const [imsSnapshot, setImsSnapshot] = useState<ImsPaymentSnapshot | null>(null);

    const resolvedPayerCode = String(resolvedStudentId || '').trim()
        || (studentNumber ?? '').trim()
        || (payment?.studentNumber ?? '').trim();
    const isPaymentSettled = ['PAID', 'VERIFIED', 'COMPLETED'].includes((payment?.status ?? '').toUpperCase());

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

    const loadImsSnapshot = async () => {
        const lookupId = (studentNumber ?? '').trim() || String(resolvedStudentId || '').trim();
        if (!lookupId) return;
        const response = await fetch(`${API_BASE}/api/payments/ims/student/${encodeURIComponent(lookupId)}/snapshot`);
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        if (data && typeof data === 'object') {
            setImsSnapshot(data as ImsPaymentSnapshot);
        }
    };

    const handleStartMobileMoneyPayment = async () => {
        if (!mobilePhone.trim()) {
            setError('Phone number is required to start mobile payment.');
            return;
        }
        setError('');
        setInfo('');
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

            if (data.payment) {
            setPayment({
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
            });
            }
            setInfo(data.message ?? 'Payment prompt sent. Please confirm on your phone.');
            await loadHistory();
            await loadTransparencySummary();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start payment.');
        } finally {
            setIsStartingPayment(false);
        }
    };

    const handleVerifyReceipt = async () => {
        if (!payment?.id || !resolvedStudentId) {
            setError('Missing payment/student record for verification.');
            return;
        }
        setError('');
        setInfo('');
        setIsVerifyingReceipt(true);
        try {
            const response = await fetch(`${API_BASE}/api/payments/${payment.id}/receipt/verify-self`, {
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
        if (!payment?.id) {
            setError('No payment record found.');
            return;
        }

        // Always re-check status from backend DB before blocking QR generation.
        try {
            const latestRes = await fetch(`${API_BASE}/api/payments/${payment.id}`);
            const latest = await latestRes.json().catch(() => ({}));
            if (latestRes.ok && latest && typeof latest === 'object') {
                const latestStatus = String((latest as { status?: string }).status ?? '').toUpperCase();
                const settled = ['PAID', 'VERIFIED', 'COMPLETED'].includes(latestStatus);
                setPayment((prev) => prev ? ({
                    ...prev,
                    status: String((latest as { status?: string }).status ?? prev.status),
                    receiptStatus: String((latest as { receiptStatus?: string }).receiptStatus ?? prev.receiptStatus ?? ''),
                    externalReference: String((latest as { externalReference?: string }).externalReference ?? prev.externalReference ?? ''),
                    paidAt: String((latest as { paidAt?: string }).paidAt ?? prev.paidAt ?? ''),
                }) : prev);

                if (!settled) {
                    setError(`Payment is still ${latestStatus || 'PENDING'} in database. Complete payment first, then generate QR.`);
                    return;
                }
            }
        } catch {
            // If refresh fails, fall back to current local state check.
            if (!isPaymentSettled) {
                setError('Complete payment first, then generate QR.');
                return;
            }
        }

        await handleVerifyReceipt();
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

    const handleUploadReceipt = async () => {
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
            const activePayment = payment?.id ? payment : await ensureObligation();
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
                await loadHistory();
                await loadImsSnapshot();
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not load payment page.');
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, [resolvedStudentId, studentNumber]);

    return (
        <div className="finance-page">
            {error && <div className="finance-alert error">{error}</div>}
            {info && <div className="finance-alert info">{info}</div>}

            <section className="finance-hero">
                <span className="hero-kicker">Financial Portal</span>
                <h1>Payment Verification</h1>
                <p>
                    Pay using UrubutoPay or Bank of Kigali, then submit your receipt for secure finance validation.
                    Every receipt is tracked and reviewed by the AUCASA finance team.
                </p>
            </section>

            <section className="finance-grid">
                <div className="finance-main">
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
                                <span>Collection Wallet</span>
                                <strong>{wallet?.walletName ?? 'AUCASA Student Association Wallet'}</strong>
                            </div>
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
                            <div style={{ display: 'grid', gap: '0.4rem', marginBottom: '0.7rem' }}>
                                <button
                                    className="primary-btn"
                                    onClick={() => setShowMobilePromptModal(true)}
                                    disabled={isStartingPayment}
                                >
                                    {isStartingPayment ? 'Sending Prompt...' : 'Start Mobile Payment Prompt'}
                                </button>
                            </div>
                            <button
                                className="primary-btn"
                                onClick={() => window.open(urubutoInitiateUrl || URUBUTO_PAY_URL, '_blank', 'noopener,noreferrer')}
                            >
                                Continue with Urubuto <ArrowUpRight size={16} />
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.55rem' }}>
                                <button
                                    className="primary-btn"
                                    onClick={handleDownloadReceipt}
                                    style={{
                                        background: 'linear-gradient(135deg, #0f766e, #0b5e58)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 8px 18px rgba(15,118,110,0.28)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                    }}
                                >
                                    <Download size={16} />
                                    Download Your Receipt
                                </button>
                                <button
                                    className="primary-btn"
                                    onClick={handleGenerateQr}
                                    style={{ background: '#166534' }}
                                    disabled={isVerifyingReceipt}
                                >
                                    {isVerifyingReceipt ? 'Generating QR...' : 'Generate QR'}
                                </button>
                            </div>
                            <p style={{ marginTop: '0.45rem', color: '#55657f', fontSize: '0.82rem' }}>
                                Merchant code, payer code (your student ID), amount, and fee purpose are auto-filled.
                            </p>
                            {receiptQr?.goodToGo && receiptQr.qrToken && (
                                <div style={{ marginTop: '0.8rem', padding: '0.75rem', border: '1px solid #cde4da', borderRadius: 10, background: '#f0fdf7' }}>
                                    <strong style={{ color: '#0f5132' }}>{receiptQr.message}</strong>
                                    <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(receiptQr.qrToken)}`}
                                            alt={`Verified receipt QR for ${receiptQr.studentName}`}
                                            style={{ width: 180, height: 180, borderRadius: 10, border: '1px solid #b7d8c9' }}
                                        />
                                        <div style={{ color: '#12523a', fontSize: '0.9rem' }}>
                                            <div><strong>Name:</strong> {receiptQr.studentName}</div>
                                            <div><strong>Student ID:</strong> {receiptQr.studentNumber}</div>
                                            <div><strong>Receipt:</strong> {receiptQr.receiptNumber}</div>
                                            <div><strong>Status:</strong> Safe to go</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </article>

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
                                <span>Amount</span>
                                <strong>{payment?.amount ? `${payment.amount} RWF` : '3,000 RWF'}</strong>
                            </div>
                        </div>
                    </article>

                    <article className="panel transactions-panel">
                        <div className="panel-head">
                            <h2>Recent Transactions</h2>
                        </div>
                        <div className="tx-table">
                            <div className="tx-row header">
                                <span>Date</span>
                                <span>Reference</span>
                                <span>Status</span>
                                <span>Amount</span>
                            </div>
                            {(history.length > 0 ? history : [payment]).filter(Boolean).map((item) => (
                                <div className="tx-row" key={item?.id}>
                                    <span>{item?.paidAt ? new Date(item.paidAt).toLocaleDateString() : '-'}</span>
                                    <span>{item?.receiptNumber ?? '-'}</span>
                                    <span>{item?.status ?? 'PENDING'}</span>
                                    <span>{item?.amount ? `${item.amount} RWF` : '3,000 RWF'}</span>
                                </div>
                            ))}
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

                    <article className="panel info-panel">
                        <h2>IMS Payment Snapshot</h2>
                        <div className="info-grid">
                            <div>
                                <span>IMS Student ID</span>
                                <strong>{imsSnapshot?.studentId ?? '-'}</strong>
                            </div>
                            <div>
                                <span>Balance (IMS)</span>
                                <strong>{imsSnapshot?.balance ? JSON.stringify(imsSnapshot.balance) : '-'}</strong>
                            </div>
                            <div>
                                <span>Fees (IMS)</span>
                                <strong>{imsSnapshot?.fees ? JSON.stringify(imsSnapshot.fees) : '-'}</strong>
                            </div>
                            <div>
                                <span>Payment Info (IMS)</span>
                                <strong>{imsSnapshot?.paymentInfo ? JSON.stringify(imsSnapshot.paymentInfo) : '-'}</strong>
                            </div>
                        </div>
                    </article>
                </div>

            </section>

            {showVerifyModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.48)',
                    zIndex: 1200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        width: 'min(520px, 96vw)',
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #dbe5f5',
                        padding: '1rem',
                    }}>
                        <h3 style={{ margin: 0, color: '#12335f' }}>Verify Your Receipt</h3>
                        <p style={{ margin: '0.45rem 0 0.8rem', color: '#5d6f8b', fontSize: '0.9rem' }}>
                            Enter your phone number and upload receipt, then verify.
                        </p>
                        <div style={{ display: 'grid', gap: '0.55rem' }}>
                            <input
                                type="text"
                                placeholder="Mobile number (e.g. 078xxxxxxx)"
                                value={mobilePhone}
                                onChange={(e) => setMobilePhone(e.target.value)}
                                style={{ padding: '0.65rem 0.75rem', border: '1px solid #d4deef', borderRadius: 10 }}
                            />
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,image/*"
                                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                                style={{ padding: '0.45rem', border: '1px solid #d4deef', borderRadius: 10, background: '#fff' }}
                            />
                            <input
                                type="text"
                                placeholder="Transaction ID (optional if OCR reads it)"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                style={{ padding: '0.65rem 0.75rem', border: '1px solid #d4deef', borderRadius: 10 }}
                            />
                            <button
                                className="primary-btn"
                                onClick={handleUploadReceipt}
                                disabled={isUploadingReceipt}
                                style={{ background: '#1d4ed8' }}
                            >
                                {isUploadingReceipt ? 'Uploading Receipt...' : 'Upload Receipt'}
                            </button>
                            <button
                                className="primary-btn"
                                onClick={handleVerifyReceipt}
                                disabled={isVerifyingReceipt}
                                style={{ background: '#0f766e' }}
                            >
                                {isVerifyingReceipt ? 'Verifying...' : 'Verify Now'}
                            </button>
                            <button
                                className="primary-btn"
                                onClick={() => setShowVerifyModal(false)}
                                style={{ background: '#64748b' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMobilePromptModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.48)',
                    zIndex: 1200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        width: 'min(460px, 96vw)',
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #dbe5f5',
                        padding: '1rem',
                    }}>
                        <h3 style={{ margin: 0, color: '#12335f' }}>Start Mobile Payment Prompt</h3>
                        <p style={{ margin: '0.45rem 0 0.8rem', color: '#5d6f8b', fontSize: '0.9rem' }}>
                            Enter your phone number to receive a payment prompt.
                        </p>
                        <div style={{ display: 'grid', gap: '0.55rem' }}>
                            <input
                                type="text"
                                placeholder="Mobile number (e.g. 078xxxxxxx)"
                                value={mobilePhone}
                                onChange={(e) => setMobilePhone(e.target.value)}
                                style={{ padding: '0.65rem 0.75rem', border: '1px solid #d4deef', borderRadius: 10 }}
                            />
                            <button
                                className="primary-btn"
                                onClick={async () => {
                                    await handleStartMobileMoneyPayment();
                                    setShowMobilePromptModal(false);
                                }}
                                disabled={isStartingPayment}
                            >
                                {isStartingPayment ? 'Sending Prompt...' : 'Send Prompt'}
                            </button>
                            <button
                                className="primary-btn"
                                onClick={() => setShowMobilePromptModal(false)}
                                style={{ background: '#64748b' }}
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
