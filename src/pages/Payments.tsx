import React, { useState } from 'react';
import { CreditCard, Smartphone, Check, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import './Payments.css';

type PaymentStep = 'initial' | 'methods' | 'details' | 'success';

interface PaymentRecord {
    id: number;
    receiptNumber: string;
    status: string;
    amount: number;
    paidAt?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

const Payments: React.FC = () => {
    const [step, setStep] = useState<PaymentStep>('initial');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [payment, setPayment] = useState<PaymentRecord | null>(null);
    const [studentId, setStudentId] = useState<number>(1);
    const [termId, setTermId] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [awaitingMobileApproval, setAwaitingMobileApproval] = useState(false);

    const ensureObligation = async (): Promise<PaymentRecord> => {
        const response = await fetch(`${API_BASE}/api/payments/obligations/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId,
                termId: termId ? Number(termId) : null,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error ?? 'Failed to create/find mandatory payment obligation.');
        }

        const data = await response.json();
        const mapped: PaymentRecord = {
            id: data.id,
            receiptNumber: data.receiptNumber,
            status: data.status,
            amount: data.amount,
            paidAt: data.paidAt,
        };
        setPayment(mapped);
        return mapped;
    };

    const startPaymentFlow = async () => {
        setError('');
        setInfo('');
        try {
            setIsProcessing(true);
            await ensureObligation();
            setStep('methods');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not start payment flow.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMethodSelect = (method: string) => {
        setSelectedMethod(method);
        setError('');
        setInfo('');
        setStep('details');
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setIsProcessing(true);

        try {
            const current = payment ?? await ensureObligation();
            const method = selectedMethod === 'mobile' ? 'MOBILE_MONEY' : 'CARD';

            const response = await fetch(`${API_BASE}/api/payments/${current.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method,
                    phoneNumber: selectedMethod === 'mobile' ? phoneNumber : null,
                    externalReference: selectedMethod === 'card' ? `WEB-CARD-${Date.now()}` : null,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Payment submission failed.');
            }

            const nextPayment: PaymentRecord = {
                id: data.id,
                receiptNumber: data.receiptNumber,
                status: data.status,
                amount: data.amount,
                paidAt: data.paidAt,
            };
            setPayment(nextPayment);

            if (selectedMethod === 'mobile') {
                const isSimulated = typeof data.externalReference === 'string' && data.externalReference.startsWith('SIM-');
                if (isSimulated) {
                    setAwaitingMobileApproval(false);
                    setInfo('Simulation mode is active on backend. No real MTN prompt is sent. Configure provider credentials and disable simulate mode.');
                } else {
                    setAwaitingMobileApproval(true);
                    setInfo('Payment prompt sent to your phone. Approve it, then click "I have approved on phone".');
                }
            } else {
                setAwaitingMobileApproval(false);
                setInfo('Card payment submitted successfully.');
            }

            setStep('success');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmMobileOnPhone = async () => {
        if (!payment) return;

        setError('');
        setIsProcessing(true);
        try {
            const callbackResp = await fetch(`${API_BASE}/api/payments/mobile-money/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiptNumber: payment.receiptNumber,
                    providerReference: `SIM-CB-${Date.now()}`,
                    success: true,
                }),
            });

            if (!callbackResp.ok) {
                const err = await callbackResp.json().catch(() => ({}));
                throw new Error(err.error ?? 'Callback confirmation failed.');
            }

            const verifyResp = await fetch(`${API_BASE}/api/payments/${payment.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!verifyResp.ok) {
                const err = await verifyResp.json().catch(() => ({}));
                throw new Error(err.error ?? 'Verification failed.');
            }

            const verified = await verifyResp.json();
            setPayment({
                id: verified.id,
                receiptNumber: verified.receiptNumber,
                status: verified.status,
                amount: verified.amount,
                paidAt: verified.paidAt,
            });
            setAwaitingMobileApproval(false);
            setInfo('Mobile money payment verified successfully.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not confirm phone payment.');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderInitial = () => (
        <div className="payment-hero">
            <h2 className="hero-title">Support Your Association</h2>
            <p className="hero-subtitle">
                Your contributions help us organize better events, improve student services, and create a vibrant campus life.
            </p>

            <div className="amount-card">
                <div className="amount-label">Outstanding Balance</div>
                <div className="amount-value">3,000 RWF</div>
                <div className="fee-info">Annual Membership Fee</div>
            </div>

            <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto 1rem' }}>
                <div className="input-group">
                    <label>Student Internal ID</label>
                    <input
                        type="number"
                        className="input-field"
                        value={studentId}
                        onChange={(e) => setStudentId(Number(e.target.value || 1))}
                        min={1}
                    />
                </div>
                <div className="input-group">
                    <label>Term ID (optional)</label>
                    <input
                        type="number"
                        className="input-field"
                        placeholder="Leave blank to use active term"
                        value={termId}
                        onChange={(e) => setTermId(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <button className="btn-pay-large" onClick={startPaymentFlow} disabled={isProcessing}>
                    Pay Now <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderMethods = () => (
        <div className="payment-hero">
            <button className="btn-back" onClick={() => setStep('initial')} style={{ position: 'absolute', left: '0', top: '0' }}>
                <ChevronLeft size={24} /> Back
            </button>
            <h2 className="hero-title">Select Payment Method</h2>
            <p className="hero-subtitle">Choose how you would like to complete your payment.</p>

            <div className="methods-grid">
                <div className="method-card" onClick={() => handleMethodSelect('mobile')}>
                    <div className="method-icon">
                        <Smartphone size={32} />
                    </div>
                    <h3>Mobile Money</h3>
                    <p style={{ color: 'var(--text-grey)', fontSize: '0.9rem' }}>MTN / Airtel Money</p>
                </div>

                <div className="method-card" onClick={() => handleMethodSelect('card')}>
                    <div className="method-icon">
                        <CreditCard size={32} />
                    </div>
                    <h3>Card Payment</h3>
                    <p style={{ color: 'var(--text-grey)', fontSize: '0.9rem' }}>Visa / Mastercard</p>
                </div>
            </div>
        </div>
    );

    const renderDetails = () => (
        <div className="payment-hero">
            <button className="btn-back" onClick={() => setStep('methods')} style={{ position: 'absolute', left: '0', top: '0' }}>
                <ChevronLeft size={24} /> Back
            </button>

            <h2 className="hero-title">
                {selectedMethod === 'mobile' ? 'Mobile Money Details' : 'Card Details'}
            </h2>

            <form className="payment-form-container" onSubmit={handlePayment}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div className="amount-value" style={{ fontSize: '2.5rem' }}>3,000 RWF</div>
                    <div style={{ color: 'var(--text-grey)' }}>To: AUCASA Association</div>
                </div>

                {selectedMethod === 'mobile' ? (
                    <div className="input-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            placeholder="078..."
                            className="input-field"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                ) : (
                    <>
                        <div className="input-group">
                            <label>Card Number</label>
                            <input type="text" placeholder="0000 0000 0000 0000" className="input-field" required />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Expiry</label>
                                <input type="text" placeholder="MM/YY" className="input-field" required />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>CVC</label>
                                <input type="text" placeholder="123" className="input-field" required />
                            </div>
                        </div>
                    </>
                )}

                <button
                    className="btn-pay-large"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Pay 3,000 RWF'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--text-grey)', fontSize: '0.85rem' }}>
                    <ShieldCheck size={16} /> Secure Payment
                </div>
            </form>
        </div>
    );

    const renderSuccess = () => (
        <div className="success-container">
            <div className="success-icon">
                <Check size={48} color="white" strokeWidth={3} />
            </div>
            <h2 className="hero-title" style={{ fontSize: '2rem' }}>
                {awaitingMobileApproval ? 'Awaiting Phone Confirmation' : 'Payment Successful!'}
            </h2>
            <p className="hero-subtitle">
                {awaitingMobileApproval
                    ? 'Approve the mobile money prompt on your phone to complete payment.'
                    : 'Your payment has been processed successfully. A receipt has been generated.'}
            </p>

            <div className="amount-card" style={{ padding: '1.5rem', marginTop: '1rem', width: '100%', maxWidth: '400px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-grey)' }}>Transaction ID</span>
                    <span style={{ fontWeight: 600 }}>{payment?.receiptNumber ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-grey)' }}>Status</span>
                    <span style={{ fontWeight: 600 }}>{payment?.status ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-grey)' }}>Amount</span>
                    <span style={{ color: '#22c55e', fontWeight: '800' }}>3,000 RWF</span>
                </div>
            </div>

            {awaitingMobileApproval && (
                <button
                    className="btn-pay-large"
                    style={{ marginBottom: '1rem' }}
                    onClick={confirmMobileOnPhone}
                    disabled={isProcessing}
                >
                    I have approved on phone
                </button>
            )}

            <div>
                <button
                    className="btn-pay-large"
                    onClick={() => {
                        setStep('initial');
                        setSelectedMethod('');
                        setPhoneNumber('');
                        setAwaitingMobileApproval(false);
                        setInfo('');
                        setError('');
                    }}
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="payments-container">
            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}
            {info && (
                <div style={{ background: '#e0f2fe', color: '#075985', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    {info}
                </div>
            )}

            {step === 'initial' && renderInitial()}
            {step === 'methods' && renderMethods()}
            {step === 'details' && renderDetails()}
            {step === 'success' && renderSuccess()}
        </div>
    );
};

export default Payments;
