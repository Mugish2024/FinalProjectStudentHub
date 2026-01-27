import React, { useState } from 'react';
import { CreditCard, Smartphone, Check, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import './Payments.css';

type PaymentStep = 'initial' | 'methods' | 'details' | 'success';

const Payments: React.FC = () => {
    const [step, setStep] = useState<PaymentStep>('initial');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleMethodSelect = (method: string) => {
        setSelectedMethod(method);
        setStep('details');
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setStep('success');
        }, 2000);
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
                <div style={{ color: '#22c55e', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    • Annual Membership Fee
                </div>
            </div>

            <div>
                <button className="btn-pay-large" onClick={() => setStep('methods')}>
                    Pay Now <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderMethods = () => (
        <div className="payment-hero">
            <button className="btn-back" onClick={() => setStep('initial')} style={{ position: 'absolute', left: '2rem', top: '7rem' }}>
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
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>MTN / Airtel Money</p>
                </div>

                <div className="method-card" onClick={() => handleMethodSelect('card')}>
                    <div className="method-icon">
                        <CreditCard size={32} />
                    </div>
                    <h3>Card Payment</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Visa / Mastercard</p>
                </div>
            </div>
        </div>
    );

    const renderDetails = () => (
        <div className="payment-hero">
            <button className="btn-back" onClick={() => setStep('methods')} style={{ position: 'absolute', left: '2rem', top: '7rem' }}>
                <ChevronLeft size={24} /> Back
            </button>

            <h2 className="hero-title">
                {selectedMethod === 'mobile' ? 'Mobile Money Details' : 'Card Details'}
            </h2>

            <form className="payment-form-container" onSubmit={handlePayment}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div className="amount-value" style={{ fontSize: '2rem' }}>3,000 RWF</div>
                    <div style={{ color: '#94a3b8' }}>To: AUCASA Association</div>
                </div>

                {selectedMethod === 'mobile' ? (
                    <div className="input-group">
                        <label>Phone Number</label>
                        <input type="text" placeholder="078..." className="input-field" required />
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
                    {isProcessing ? 'Processing...' : `Pay 3,000 RWF`}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
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
            <h2 className="hero-title">Payment Successful!</h2>
            <p className="hero-subtitle">
                Your payment has been processed successfully. A receipt has been sent to your student email.
            </p>

            <div className="amount-card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Transaction ID</span>
                    <span>#TXN-88293</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Date</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                    <span style={{ color: '#94a3b8' }}>Amount</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>3,000 RWF</span>
                </div>
            </div>

            <div>
                <button
                    className="btn-pay-large"
                    onClick={() => setStep('initial')}
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="payments-container">
            {step === 'initial' && renderInitial()}
            {step === 'methods' && renderMethods()}
            {step === 'details' && renderDetails()}
            {step === 'success' && renderSuccess()}
        </div>
    );
};

export default Payments;
