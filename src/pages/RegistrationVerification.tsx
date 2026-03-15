import React, { useState } from 'react';
import { Check } from 'lucide-react';
import './RegistrationVerification.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

interface RegistrationResult {
    studentId: number;
    studentNumber: string;
    fullName: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
}

const RegistrationVerification: React.FC = () => {
    const [studentNumber, setStudentNumber] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [faculty, setFaculty] = useState('');
    const [department, setDepartment] = useState('');
    const [program, setProgram] = useState('');
    const [credits, setCredits] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingDemo, setIsCreatingDemo] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<RegistrationResult | null>(null);
    const [demoResults, setDemoResults] = useState<RegistrationResult[]>([]);
    const [accountStudentNumber, setAccountStudentNumber] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [accountStatus, setAccountStatus] = useState('');
    const [isSettingUpAccount, setIsSettingUpAccount] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setDemoResults([]);
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/api/students/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber,
                    firstName,
                    lastName,
                    faculty,
                    department,
                    program,
                    credits: credits ? Number(credits) : 0,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Registration failed.');
            }

            setResult(data as RegistrationResult);
            setAccountStudentNumber((data as RegistrationResult).studentNumber ?? '');
            setStudentNumber('');
            setFirstName('');
            setLastName('');
            setFaculty('');
            setDepartment('');
            setProgram('');
            setCredits('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const facultyDepartments: Record<string, string[]> = {
        'Information Technology': [
            'Software Engineering',
            'Information Management',
            'Networks and Communication Systems',
        ],
        'Business Administration': [
            'Accounting',
            'Finance',
            'Marketing',
            'Management',
        ],
        'Education': [
            'Theology',
            'Geography & History',
            'English Language and Literature',
            'Accounting & IT',
        ],
        'Theology': [
            'Theology',
        ],
        'Nursing': [
            'Bachelor of Science in Nursing',
            'Bachelor of Science in Midwifery',
        ],
    };

    const departments = faculty ? (facultyDepartments[faculty] ?? []) : [];

    const handleCreateDemoStudents = async () => {
        setError('');
        setResult(null);
        setDemoResults([]);
        setIsCreatingDemo(true);

        try {
            const response = await fetch(`${API_BASE}/api/students/register/demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error('Failed to create demo students.');
            }

            setDemoResults(Array.isArray(data) ? (data as RegistrationResult[]) : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create demo students.');
        } finally {
            setIsCreatingDemo(false);
        }
    };

    const handleAccountSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAccountStatus('');
        setIsSettingUpAccount(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentNumber: accountStudentNumber,
                    password: accountPassword,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error ?? 'Account setup failed.');
            }

            setAccountStatus('Account created successfully. You can now login.');
            setAccountPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Account setup failed.');
        } finally {
            setIsSettingUpAccount(false);
        }
    };

    return (
        <div className="registration-container">
            <h1 className="page-title">STUDENT REGISTRATION & VERIFICATION</h1>

            <section className="section-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h3 className="section-title">REGISTER NEW STUDENT</h3>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <strong>Student registered successfully.</strong><br />
                        Internal ID: {result.studentId} | Student ID: {result.studentNumber} | Name: {result.fullName}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="search-row" style={{ marginBottom: '1rem' }}>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Student ID (e.g AUCA/UG/123/020)"
                                className="search-input"
                                value={studentNumber}
                                onChange={(e) => setStudentNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="search-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder="First Name"
                                className="search-input"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Last Name"
                                className="search-input"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="search-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <select
                                className="search-input"
                                value={faculty}
                                onChange={(e) => {
                                    setFaculty(e.target.value);
                                    setDepartment('');
                                }}
                                required
                            >
                                <option value="">Select Faculty</option>
                                {Object.keys(facultyDepartments).map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <select
                                className="search-input"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                                disabled={!faculty}
                            >
                                <option value="">
                                    {faculty ? 'Select Department' : 'Select Faculty First'}
                                </option>
                                {departments.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="search-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Program (e.g. Day / Evening)"
                                className="search-input"
                                value={program}
                                onChange={(e) => setProgram(e.target.value)}
                            />
                        </div>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="number"
                                placeholder="Credits (e.g. 12)"
                                className="search-input"
                                value={credits}
                                onChange={(e) => setCredits(e.target.value)}
                                min={0}
                            />
                        </div>
                    </div>

                    <button className="btn-gold" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Registering...' : 'Register Student'}
                    </button>
                    <button
                        className="btn-gold"
                        type="button"
                        onClick={handleCreateDemoStudents}
                        disabled={isCreatingDemo}
                        style={{ marginLeft: '0.75rem' }}
                    >
                        {isCreatingDemo ? 'Creating...' : 'Create 3 Demo Students'}
                    </button>
                </form>

                {demoResults.length > 0 && (
                    <div style={{ marginTop: '1rem', background: '#eff6ff', color: '#1e3a8a', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                        <strong>Demo students ready:</strong>
                        {demoResults.map((item) => (
                            <div key={item.studentId}>
                                Internal ID: {item.studentId} | Student ID: {item.studentNumber} | Name: {item.fullName}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="section-block" style={{ maxWidth: '900px', margin: '1rem auto 0' }}>
                <h3 className="section-title">CREATE LOGIN ACCOUNT</h3>

                {accountStatus && (
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        {accountStatus}
                    </div>
                )}

                <form onSubmit={handleAccountSetup}>
                    <div className="search-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Student ID (e.g AUCA/UG/123/020)"
                                className="search-input"
                                value={accountStudentNumber}
                                onChange={(e) => setAccountStudentNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="password"
                                placeholder="Create Password"
                                className="search-input"
                                value={accountPassword}
                                onChange={(e) => setAccountPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button className="btn-gold" type="submit" disabled={isSettingUpAccount}>
                        {isSettingUpAccount ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
            </section>

            <section className="section-block" style={{ maxWidth: '900px', margin: '1rem auto 0' }}>
                <h3 className="section-title">NEXT STEP FOR PAYMENT TEST</h3>
                <div className="status-row" style={{ justifyContent: 'flex-start' }}>
                    <div className="status-pill success">
                        <div className="check-circle"><Check size={12} /></div>
                        <span>After registration, use returned Internal ID in Payments page.</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RegistrationVerification;
