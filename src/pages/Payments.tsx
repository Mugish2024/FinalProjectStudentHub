import React, { useEffect, useMemo, useState } from 'react';
import {
    ShieldCheck,
    Landmark,
    ArrowUpRight,
} from 'lucide-react';
import urubutoPayLogo from '../assets/urubutopay.png';
import './Payments.css';

interface PaymentRecord {
    id: number;
    studentNumber?: string;
    receiptNumber: string;
    status: string;
    amount: number;
    paidAt?: string;
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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';
const URUBUTO_PAY_URL = 'https://urubutopay.rw/pay-now/initiate?origin=internal';
const URUBUTO_MERCHANT_CODE = 'TH61132546';
const BK_ACCOUNT_CODE = '00040 - 00280275 - 75';
const formatRwf = (value?: number) => new Intl.NumberFormat('en-RW').format(Number(value ?? 0));
const STUDENT_ASSOCIATION_FEE_LABEL = 'Student Association fee';

const Payments: React.FC<PaymentsProps> = ({ studentId, studentNumber }) => {
    const resolvedStudentId = studentId ?? 0;

    const [isLoading, setIsLoading] = useState(false);
    const [payment, setPayment] = useState<PaymentRecord | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'URUBUTO_PAY' | 'BANK_TRANSFER'>('URUBUTO_PAY');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [transparency, setTransparency] = useState<TransparencySummary | null>(null);

    const resolvedPayerCode = (studentNumber ?? '').trim()
        || (payment?.studentNumber ?? '').trim()
        || String(resolvedStudentId || '');

    const defaultAmount = useMemo(() => {
        if (payment?.amount) return String(payment.amount);
        return '3000';
    }, [payment?.amount]);

    const urubutoInitiateUrl = useMemo(() => {
        const amount = Number(defaultAmount || 3000);
        const externalReference = `AUCASA-${resolvedPayerCode}-${Date.now()}`;
        const params = new URLSearchParams({
            origin: 'internal',
            merchantCode: URUBUTO_MERCHANT_CODE,
            payerCode: resolvedPayerCode,
            amount: String(Number.isFinite(amount) ? amount : 3000),
            feeName: STUDENT_ASSOCIATION_FEE_LABEL,
            purpose: STUDENT_ASSOCIATION_FEE_LABEL,
            description: STUDENT_ASSOCIATION_FEE_LABEL,
            narration: STUDENT_ASSOCIATION_FEE_LABEL,
            externalReference,
            reference: externalReference,
        });
        return `https://urubutopay.rw/pay-now/initiate?${params.toString()}`;
    }, [defaultAmount, resolvedPayerCode]);

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
            status: data.status,
            amount: data.amount,
            paidAt: data.paidAt,
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
                await ensureObligation();
                await loadTransparencySummary();
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
                                <span>Urubuto Merchant Code</span>
                                <strong>{URUBUTO_MERCHANT_CODE}</strong>
                            </div>
                            <div>
                                <span>BK Account Code</span>
                                <strong>{BK_ACCOUNT_CODE}</strong>
                            </div>
                        </div>

                        <div className="method-actions">
                            <button
                                className="primary-btn"
                                onClick={() => window.open(urubutoInitiateUrl || URUBUTO_PAY_URL, '_blank', 'noopener,noreferrer')}
                            >
                                Continue with Urubuto <ArrowUpRight size={16} />
                            </button>
                            <p style={{ marginTop: '0.45rem', color: '#55657f', fontSize: '0.82rem' }}>
                                Merchant code, payer code (your student number), amount, and fee purpose are auto-filled.
                            </p>
                        </div>
                    </article>

                    <article className="panel info-panel">
                        <h2>Payment Information</h2>
                        <div className="info-grid">
                            <div>
                                <span>Payer Code (Student Number)</span>
                                <strong>{resolvedPayerCode || '-'}</strong>
                            </div>
                            <div>
                                <span>Reference</span>
                                <strong>{payment?.receiptNumber ?? '-'}</strong>
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
                            <div className="tx-row">
                                <span>{payment?.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</span>
                                <span>{payment?.receiptNumber ?? '-'}</span>
                                <span>{payment?.status ?? 'PENDING'}</span>
                                <span>{payment?.amount ? `${payment.amount} RWF` : '3,000 RWF'}</span>
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

            </section>
        </div>
    );
};

export default Payments;
