import React, { useState } from 'react';
import { Check } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { getPasswordStrength } from '../utils/passwordPolicy';
import './RegistrationVerification.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

interface RegistrationResult {
    studentId: number;
    studentNumber: string;
    fullName: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
    semester: number;
    gpa: number;
}

const RegistrationVerification: React.FC = () => {
    const [studentNumber, setStudentNumber] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [faculty, setFaculty] = useState('');
    const [department, setDepartment] = useState('');
    const [program, setProgram] = useState('');
    const [credits, setCredits] = useState('');
    const [semester, setSemester] = useState('1');
    const [gpa, setGpa] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<RegistrationResult | null>(null);
    const [accountStudentNumber, setAccountStudentNumber] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [accountStatus, setAccountStatus] = useState('');
    const [isSettingUpAccount, setIsSettingUpAccount] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
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
                    semester: semester ? Number(semester) : 1,
                    gpa: gpa ? Number(gpa) : 0,
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
            setSemester('1');
            setGpa('0');
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

    const handleAccountSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAccountStatus('');
        if (!getPasswordStrength(accountPassword).isValid) {
            setError('Please create a stronger password that meets all requirements.');
            return;
        }
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

            <section className="section-block" style={{ maxWidth: '1180px', margin: '0 auto' }}>
                <h3 className="section-title">REGISTER NEW STUDENT</h3>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{ background: '#2F4F86', color: '#2F4F86', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <strong>Student registered successfully.</strong><br />
                        Student ID: {result.studentNumber} | Name: {result.fullName}
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

                    <div className="search-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="number"
                                placeholder="Semester (e.g. 1)"
                                className="search-input"
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                min={1}
                            />
                        </div>
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <input
                                type="number"
                                placeholder="GPA (0.00 - 20.00)"
                                className="search-input"
                                value={gpa}
                                onChange={(e) => setGpa(e.target.value)}
                                min={0}
                                max={20}
                                step="0.01"
                            />
                        </div>
                    </div>

                    <button className="btn-gold" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Register Student'}
                    </button>
                </form>
            </section>

            <section className="section-block" style={{ maxWidth: '1180px', margin: '1rem auto 0' }}>
                <h3 className="section-title">CREATE LOGIN ACCOUNT</h3>

                {accountStatus && (
                    <div style={{ background: '#2F4F86', color: '#2F4F86', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
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
                                minLength={8}
                                placeholder="Create Password"
                                className="search-input"
                                value={accountPassword}
                                onChange={(e) => setAccountPassword(e.target.value)}
                                required
                            />
                            <PasswordStrengthMeter password={accountPassword} />
                        </div>
                    </div>

                    <button className="btn-gold" type="submit" disabled={isSettingUpAccount}>
                        {isSettingUpAccount ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
            </section>

            <section className="section-block" style={{ maxWidth: '1180px', margin: '1rem auto 0' }}>
                <h3 className="section-title">NEXT STEP FOR PAYMENT TEST</h3>
                <div className="status-row" style={{ justifyContent: 'flex-start' }}>
                    <div className="status-pill success">
                        <div className="check-circle"><Check size={12} /></div>
                        <span>After registration, continue to Payments and follow the UrubutoPay instructions.</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RegistrationVerification;
