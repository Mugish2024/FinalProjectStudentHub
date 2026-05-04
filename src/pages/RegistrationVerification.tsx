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
    const [students, setStudents] = useState<RegistrationResult[]>([]);
    const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<RegistrationResult | null>(null);
    const [accountStudentNumber, setAccountStudentNumber] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [accountStatus, setAccountStatus] = useState('');
    const [isSettingUpAccount, setIsSettingUpAccount] = useState(false);

    const loadStudents = async () => {
        const response = await fetch(`${API_BASE}/api/students/summary`);
        if (!response.ok) {
            throw new Error('Failed to load students.');
        }
        const data = await response.json().catch(() => []);
        setStudents(Array.isArray(data) ? data : []);
    };

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
            await loadStudents();
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

    const resetForm = () => {
        setStudentNumber('');
        setFirstName('');
        setLastName('');
        setFaculty('');
        setDepartment('');
        setProgram('');
        setCredits('');
        setSemester('1');
        setGpa('0');
        setEditingStudentId(null);
    };

    const handleEditStudent = (item: RegistrationResult) => {
        setEditingStudentId(item.studentId);
        setStudentNumber(item.studentNumber ?? '');
        const nameParts = (item.fullName ?? '').trim().split(' ');
        setFirstName(nameParts[0] ?? '');
        setLastName(nameParts.slice(1).join(' ') ?? '');
        setFaculty(item.faculty ?? '');
        setDepartment(item.department ?? '');
        setProgram(item.program ?? '');
        setCredits(String(item.credits ?? 0));
        setSemester(String(item.semester ?? 1));
        setGpa(String(item.gpa ?? 0));
    };

    const handleUpdateStudent = async () => {
        if (!editingStudentId) return;
        setError('');
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/api/students/${editingStudentId}`, {
                method: 'PUT',
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
                throw new Error(data.error ?? 'Update failed.');
            }
            setResult(data as RegistrationResult);
            resetForm();
            await loadStudents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStudent = async (id: number) => {
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/students/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Delete failed.');
            }
            if (editingStudentId === id) {
                resetForm();
            }
            await loadStudents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
    };

    React.useEffect(() => {
        loadStudents().catch(() => undefined);
    }, []);

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
                    {editingStudentId && (
                        <>
                            <button
                                className="btn-gold"
                                type="button"
                                onClick={handleUpdateStudent}
                                disabled={isSubmitting}
                                style={{ marginLeft: '0.75rem' }}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Student'}
                            </button>
                            <button
                                className="btn-gold"
                                type="button"
                                onClick={resetForm}
                                disabled={isSubmitting}
                                style={{ marginLeft: '0.75rem', background: '#64748b' }}
                            >
                                Cancel Edit
                            </button>
                        </>
                    )}
                </form>

                <div style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Student ID</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Semester</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>GPA</th>
                                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((item) => (
                                <tr key={item.studentId} style={{ borderTop: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.6rem' }}>{item.studentNumber}</td>
                                    <td style={{ padding: '0.6rem' }}>{item.fullName}</td>
                                    <td style={{ padding: '0.6rem' }}>{item.semester ?? 1}</td>
                                    <td style={{ padding: '0.6rem' }}>{(item.gpa ?? 0).toFixed(2)}</td>
                                    <td style={{ padding: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-gold" type="button" onClick={() => handleEditStudent(item)}>Edit</button>
                                        <button
                                            className="btn-gold"
                                            type="button"
                                            onClick={() => handleDeleteStudent(item.studentId)}
                                            style={{ background: '#b91c1c' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '0.8rem', color: '#64748b' }}>No students found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                        <span>After registration, continue to Payments and follow the UrubutoPay instructions.</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RegistrationVerification;
