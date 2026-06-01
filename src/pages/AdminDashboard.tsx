import { useEffect, useMemo, useState } from 'react';
import {
    BadgeDollarSign,
    BookOpenCheck,
    BriefcaseBusiness,
    Building2,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    KeyRound,
    Pencil,
    Search,
    ShieldCheck,
    Star,
    Trash2,
    X,
    UserCog,
    UserPlus,
    Users,
    UserRoundCheck,
} from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { getPasswordStrength } from '../utils/passwordPolicy';
import './AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

type DirectoryItem = {
    id: number;
    fullName: string;
    role: string;
    studentNumber?: string | null;
    username?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    disciplineStatus?: string | null;
};

type StudentRegistrationRequest = {
    studentNumber: string;
    firstName: string;
    lastName: string;
    faculty: string;
    department: string;
    program: string;
    credits: string;
};

type StudentSummary = {
    studentId: number;
    studentNumber: string;
    fullName: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
    semester?: number;
    gpa?: number;
};

type LeadershipRole = 'guild_president' | 'finance' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs';

type SystemUserRequest = {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'dean' | 'staff' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs';
};

type SystemUserUpdateRequest = {
    id: string;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'dean' | 'staff' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs';
};

interface AdminDashboardProps {
    fullName?: string;
    mode?: 'overview' | 'management';
}

const AdminDashboard = ({ fullName = 'System Admin', mode = 'overview' }: AdminDashboardProps) => {
    const [students, setStudents] = useState<DirectoryItem[]>([]);
    const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
    const [staff, setStaff] = useState<DirectoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [studentForm, setStudentForm] = useState<StudentRegistrationRequest>({
        studentNumber: '',
        firstName: '',
        lastName: '',
        faculty: '',
        department: '',
        program: 'Day',
        credits: '0',
    });
    const [studentFormOpen, setStudentFormOpen] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentPage, setStudentPage] = useState(1);
    const [setupForm, setSetupForm] = useState({ studentNumber: '', password: '' });
    const [systemUserForm, setSystemUserForm] = useState<SystemUserRequest>({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'guild_president',
    });
    const [systemUserEditForm, setSystemUserEditForm] = useState<SystemUserUpdateRequest>({
        id: '',
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'guild_president',
    });
    const [leadershipForm, setLeadershipForm] = useState<{ studentNumber: string; role: LeadershipRole; username: string; email: string; password: string }>({
        studentNumber: '',
        role: 'guild_president',
        username: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [detailTitle, setDetailTitle] = useState('');
    const [detailRows, setDetailRows] = useState<Array<{ name: string; meta: string }>>([]);
    const [detailPage, setDetailPage] = useState(1);
    const pageSize = 10;

    const loadDirectory = async () => {
        setIsLoading(true);
        try {
            const [studentRes, staffRes] = await Promise.all([
                fetch(`${API_BASE}/api/users/recipients?role=student`),
                fetch(`${API_BASE}/api/admin/users`),
            ]);
            const summaryRes = await fetch(`${API_BASE}/api/students/summary`);

            const studentData = await studentRes.json().catch(() => []);
            const staffData = await staffRes.json().catch(() => []);
            const summaryData = await summaryRes.json().catch(() => []);

            setStudents(studentRes.ok && Array.isArray(studentData) ? studentData : []);
            setStaff(staffRes.ok && Array.isArray(staffData) ? staffData : []);
            setStudentSummaries(summaryRes.ok && Array.isArray(summaryData) ? summaryData : []);
            if (!studentRes.ok || !staffRes.ok || !summaryRes.ok) {
                setError('Some directory data could not be loaded.');
            }
        } catch {
            setError('Failed to load user directory.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadDirectory();
    }, []);

    const staffSummary = useMemo(() => {
        const count = (role: string) => staff.filter((item) => item.role === role).length;
        return {
            total: staff.length,
            admins: count('admin'),
            deans: count('dean'),
            finance: count('finance'),
            guild: count('guild_president'),
            staff: count('staff'),
        };
    }, [staff]);

    const facultyChartData = useMemo(() => {
        const map = new Map<string, number>();
        studentSummaries.forEach((item) => {
            const key = (item.faculty || 'Unknown').trim();
            map.set(key, (map.get(key) ?? 0) + 1);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [studentSummaries]);

    const systemHealth = useMemo(() => {
        const totalUsers = students.length + staffSummary.total;
        const studentsWithGpa = studentSummaries.filter((item) => Number(item.gpa ?? 0) > 0);
        const studentsWithCredits = studentSummaries.filter((item) => Number(item.credits ?? 0) > 0);
        const dominantFaculty = facultyChartData[0]?.name ?? 'N/A';
        return {
            totalUsers,
            gpaRecords: studentsWithGpa.length,
            creditRecords: studentsWithCredits.length,
            dominantFaculty,
        };
    }, [students.length, staffSummary.total, studentSummaries, facultyChartData]);

    const openDetails = (title: string, rows: Array<{ name: string; meta: string }>) => {
        setDetailTitle(title);
        setDetailRows(rows);
        setDetailPage(1);
    };

    const closeDetails = () => {
        setDetailTitle('');
        setDetailRows([]);
        setDetailPage(1);
    };

    const pagedRows = useMemo(() => {
        const start = (detailPage - 1) * pageSize;
        return detailRows.slice(start, start + pageSize);
    }, [detailRows, detailPage]);

    const totalPages = Math.max(1, Math.ceil(detailRows.length / pageSize));
    const studentTablePageSize = 3;
    const filteredStudentRows = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();
        if (!query) return studentSummaries;
        return studentSummaries.filter((student) => [
            student.fullName,
            student.studentNumber,
            student.faculty,
            student.department,
            student.program,
        ].some((value) => String(value ?? '').toLowerCase().includes(query)));
    }, [studentSearch, studentSummaries]);
    const studentTableTotalPages = Math.max(1, Math.ceil(filteredStudentRows.length / studentTablePageSize));
    const studentTableRows = useMemo(() => {
        const safePage = Math.min(studentPage, studentTableTotalPages);
        const start = (safePage - 1) * studentTablePageSize;
        return filteredStudentRows.slice(start, start + studentTablePageSize);
    }, [filteredStudentRows, studentPage, studentTableTotalPages]);
    const selectedStudent = studentSummaries.find((student) => student.studentId === selectedStudentId) ?? null;

    const resetStudentForm = () => {
        setStudentForm({
            studentNumber: '',
            firstName: '',
            lastName: '',
            faculty: '',
            department: '',
            program: 'Day',
            credits: '0',
        });
        setEditingStudentId(null);
    };

    const splitStudentName = (fullName: string) => {
        const [firstName = '', ...rest] = fullName.trim().split(/\s+/);
        return { firstName, lastName: rest.join(' ') };
    };

    const handleRegisterStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const response = await fetch(editingStudentId ? `${API_BASE}/api/students/${editingStudentId}` : `${API_BASE}/api/students/register`, {
            method: editingStudentId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...studentForm,
                credits: Number(studentForm.credits),
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to create student account.');
            return;
        }
        setSuccess(editingStudentId ? `Student ${data.fullName ?? ''} updated successfully.` : `Student ${data.fullName ?? ''} created successfully.`);
        setSetupForm((prev) => ({ ...prev, studentNumber: data.studentNumber ?? prev.studentNumber }));
        resetStudentForm();
        setStudentFormOpen(false);
        await loadDirectory();
    };

    const handleEditStudent = (student: StudentSummary) => {
        const names = splitStudentName(student.fullName);
        setStudentForm({
            studentNumber: student.studentNumber ?? '',
            firstName: names.firstName,
            lastName: names.lastName,
            faculty: student.faculty ?? '',
            department: student.department ?? '',
            program: student.program ?? 'Day',
            credits: String(student.credits ?? 0),
        });
        setEditingStudentId(student.studentId);
        setSelectedStudentId(student.studentId);
        setStudentFormOpen(true);
    };

    const handleDeleteStudent = async (student: StudentSummary) => {
        const confirmed = window.confirm(`Delete ${student.fullName}? This will remove the student profile and linked login.`);
        if (!confirmed) return;
        setError('');
        setSuccess('');
        const response = await fetch(`${API_BASE}/api/students/${student.studentId}`, { method: 'DELETE' });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            setError(data.error ?? 'Failed to delete student.');
            return;
        }
        setSuccess(`${student.fullName} deleted successfully.`);
        setSelectedStudentId(null);
        await loadDirectory();
    };

    const handleSetupAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!getPasswordStrength(setupForm.password).isValid) {
            setError('Please use a stronger password that meets all requirements.');
            return;
        }
        const response = await fetch(`${API_BASE}/api/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupForm),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to set account password.');
            return;
        }
        setSuccess('Account password updated successfully.');
        setSetupForm((prev) => ({ ...prev, password: '' }));
    };

    const handleCreateSystemUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!getPasswordStrength(systemUserForm.password).isValid) {
            setError('Please use a stronger password for the system user.');
            return;
        }
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(systemUserForm),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to create system user.');
            return;
        }
        setSuccess(`System user ${data.fullName ?? ''} (${data.role ?? ''}) created successfully.`);
        setSystemUserForm({
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            role: 'guild_president',
        });
        await loadDirectory();
    };

    const handlePromoteStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (!getPasswordStrength(leadershipForm.password).isValid) {
                setError('Please use a stronger password for the leadership account.');
                return;
            }
            const response = await fetch(`${API_BASE}/api/admin/users/promote-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadershipForm),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error ?? 'Failed to assign leadership privilege.');
                return;
            }
            setSuccess(`${data.fullName ?? 'Student'} now has a separate ${String(data.role ?? leadershipForm.role).replace('_', ' ')} login.`);
            setLeadershipForm({ studentNumber: '', role: 'guild_president', username: '', email: '', password: '' });
            await loadDirectory();
        } catch {
            setError('Failed to connect to the backend. Please restart the Spring server and try again.');
        }
    };

    const handleSelectSystemUserForEdit = (selectedId: string) => {
        const selected = staff.find((item) => item.id.toString() === selectedId);
        if (!selected) {
            setSystemUserEditForm({
                id: '',
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                role: 'guild_president',
            });
            return;
        }

        const [fallbackFirstName = '', ...rest] = (selected.fullName ?? '').split(' ');
        const fallbackLastName = rest.join(' ');

        setSystemUserEditForm({
            id: selected.id.toString(),
            username: selected.username ?? '',
            email: selected.email ?? '',
            password: '',
            firstName: selected.firstName ?? fallbackFirstName,
            lastName: selected.lastName ?? fallbackLastName,
            role: (selected.role as SystemUserUpdateRequest['role']) ?? 'guild_president',
        });
    };

    const handleUpdateSystemUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!systemUserEditForm.id) {
            setError('Please select a system user to update.');
            return;
        }
        if (systemUserEditForm.password && !getPasswordStrength(systemUserEditForm.password).isValid) {
            setError('Please use a stronger password, or leave the password field empty.');
            return;
        }

        const payload = {
            username: systemUserEditForm.username,
            email: systemUserEditForm.email,
            password: systemUserEditForm.password,
            firstName: systemUserEditForm.firstName,
            lastName: systemUserEditForm.lastName,
            role: systemUserEditForm.role,
        };

        const response = await fetch(`${API_BASE}/api/admin/users/${systemUserEditForm.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error ?? 'Failed to update system user.');
            return;
        }

        setSuccess(`Credentials updated for ${data.fullName ?? 'selected user'}.`);
        setSystemUserEditForm((prev) => ({ ...prev, password: '' }));
        await loadDirectory();
    };

    return (
        <div className="admin-dashboard-page">
            <section className="admin-hero">
                <div>
                    <span className="kicker">Administration Console</span>
                    <h1>{mode === 'overview' ? 'System Overview Dashboard' : 'User Management'}</h1>
                    <p>
                        {mode === 'overview'
                            ? 'Monitor system behavior, user distribution, and academic profile quality in real time.'
                            : 'Create and maintain student and staff accounts, credentials, and directory records.'}
                    </p>
                </div>
                <div className="admin-chip">
                    <UserCog size={16} />
                    <span>{fullName}</span>
                </div>
            </section>

            {error && <div className="admin-alert admin-alert--error">{error}</div>}
            {success && <div className="admin-alert admin-alert--success">{success}</div>}

            {mode === 'overview' && (
            <section className="admin-kpi-grid">
                <article className="clickable-kpi" onClick={() => openDetails('Total Platform Users', [
                    ...students.map((s) => ({ name: s.fullName, meta: `Student - ${s.studentNumber ?? '-'}` })),
                    ...staff.map((s) => ({ name: s.fullName, meta: `${s.role.replace('_', ' ')} - ${s.username ?? '-'}` })),
                ])}>
                    <span className="kpi-icon kpi-icon--blue"><Users size={16} /></span>
                    <small>Total Platform Users</small>
                    <strong>{isLoading ? '...' : systemHealth.totalUsers}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Students With GPA Records', studentSummaries
                    .filter((s) => Number(s.gpa ?? 0) > 0)
                    .map((s) => ({ name: s.fullName, meta: `${s.studentNumber} - GPA ${Number(s.gpa ?? 0).toFixed(2)}/20` })))}>
                    <span className="kpi-icon kpi-icon--teal"><GraduationCap size={16} /></span>
                    <small>Students With GPA</small>
                    <strong>{isLoading ? '...' : systemHealth.gpaRecords}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Students With Credit Records', studentSummaries
                    .filter((s) => Number(s.credits ?? 0) > 0)
                    .map((s) => ({ name: s.fullName, meta: `${s.studentNumber} - Credits ${s.credits}` })))}>
                    <span className="kpi-icon kpi-icon--slate"><BookOpenCheck size={16} /></span>
                    <small>Students With Credits</small>
                    <strong>{isLoading ? '...' : systemHealth.creditRecords}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Top Faculty Students', studentSummaries
                    .filter((s) => (s.faculty ?? '').trim() === systemHealth.dominantFaculty)
                    .map((s) => ({ name: s.fullName, meta: `${s.studentNumber} - ${s.department}` })))}>
                    <span className="kpi-icon kpi-icon--blue"><Building2 size={16} /></span>
                    <small>Top Faculty</small>
                    <strong className="kpi-long-value">{isLoading ? '...' : systemHealth.dominantFaculty}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('All Students', students
                    .map((s) => ({ name: s.fullName, meta: s.studentNumber ?? '-' })))}>
                    <span className="kpi-icon kpi-icon--teal"><UserRoundCheck size={16} /></span>
                    <small>Total Students</small>
                    <strong>{isLoading ? '...' : students.length}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('All Staff', staff
                    .map((s) => ({ name: s.fullName, meta: `${s.role.replace('_', ' ')} - ${s.username ?? '-'}` })))}>
                    <span className="kpi-icon kpi-icon--slate"><BriefcaseBusiness size={16} /></span>
                    <small>Total Staff</small>
                    <strong>{isLoading ? '...' : staffSummary.total}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Admin Accounts', staff
                    .filter((s) => s.role === 'admin')
                    .map((s) => ({ name: s.fullName, meta: s.username ?? '-' })))}>
                    <span className="kpi-icon kpi-icon--blue"><ShieldCheck size={16} /></span>
                    <small>Admins</small>
                    <strong>{isLoading ? '...' : staffSummary.admins}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Dean + Staff Accounts', staff
                    .filter((s) => s.role === 'dean' || s.role === 'staff')
                    .map((s) => ({ name: s.fullName, meta: `${s.role} - ${s.username ?? '-'}` })))}>
                    <span className="kpi-icon kpi-icon--teal"><Star size={16} /></span>
                    <small>Dean + Staff</small>
                    <strong>{isLoading ? '...' : staffSummary.deans + staffSummary.staff}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Finance Accounts', staff
                    .filter((s) => s.role === 'finance')
                    .map((s) => ({ name: s.fullName, meta: s.username ?? '-' })))}>
                    <span className="kpi-icon kpi-icon--gold"><BadgeDollarSign size={16} /></span>
                    <small>Finance</small>
                    <strong>{isLoading ? '...' : staffSummary.finance}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Guild President Accounts', staff
                    .filter((s) => s.role === 'guild_president')
                    .map((s) => ({ name: s.fullName, meta: s.username ?? '-' })))}>
                    <span className="kpi-icon kpi-icon--blue"><UserCog size={16} /></span>
                    <small>Guild President</small>
                    <strong>{isLoading ? '...' : staffSummary.guild}</strong>
                </article>
            </section>
            )}

            {mode === 'management' && (
            <section className="admin-student-workspace">
                <article className={`admin-card student-form-panel ${studentFormOpen ? 'is-open' : ''}`}>
                    <div className="section-command-head">
                        <div>
                            <span>Student Profile Form</span>
                            <h3>{editingStudentId ? 'Edit selected student' : 'Register new student'}</h3>
                            <p>Create a student profile first, then activate login credentials in the password section.</p>
                        </div>
                        <div className="section-command-actions">
                            <button type="button" onClick={() => {
                                resetStudentForm();
                                setStudentFormOpen(true);
                            }}>
                                <UserPlus size={15} />
                                New Student
                            </button>
                            {studentFormOpen && (
                                <button type="button" className="ghost-action" onClick={() => {
                                    resetStudentForm();
                                    setStudentFormOpen(false);
                                }}>
                                    <X size={15} />
                                    Close
                                </button>
                            )}
                        </div>
                    </div>

                    {studentFormOpen ? (
                        <form className="admin-form student-profile-form" onSubmit={handleRegisterStudent}>
                            <label>
                                <span>Student ID</span>
                                <input
                                    placeholder="Student Number"
                                    value={studentForm.studentNumber}
                                    onChange={(e) => setStudentForm((prev) => ({ ...prev, studentNumber: e.target.value }))}
                                    required
                                />
                            </label>
                            <div className="split">
                                <label>
                                    <span>First Name</span>
                                    <input
                                        placeholder="First Name"
                                        value={studentForm.firstName}
                                        onChange={(e) => setStudentForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    <span>Last Name</span>
                                    <input
                                        placeholder="Last Name"
                                        value={studentForm.lastName}
                                        onChange={(e) => setStudentForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                        required
                                    />
                                </label>
                            </div>
                            <div className="split">
                                <label>
                                    <span>Faculty</span>
                                    <input
                                        placeholder="Faculty"
                                        value={studentForm.faculty}
                                        onChange={(e) => setStudentForm((prev) => ({ ...prev, faculty: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    <span>Department</span>
                                    <input
                                        placeholder="Department"
                                        value={studentForm.department}
                                        onChange={(e) => setStudentForm((prev) => ({ ...prev, department: e.target.value }))}
                                        required
                                    />
                                </label>
                            </div>
                            <div className="split">
                                <label>
                                    <span>Program</span>
                                    <select
                                        value={studentForm.program}
                                        onChange={(e) => setStudentForm((prev) => ({ ...prev, program: e.target.value }))}
                                    >
                                        <option value="Day">Day</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Weekend">Weekend</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Credits</span>
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="Credits"
                                        value={studentForm.credits}
                                        onChange={(e) => setStudentForm((prev) => ({ ...prev, credits: e.target.value }))}
                                        required
                                    />
                                </label>
                            </div>
                            <button type="submit">
                                <ShieldCheck size={15} />
                                {editingStudentId ? 'Save Student Changes' : 'Register Student'}
                            </button>
                        </form>
                    ) : (
                        <div className="form-launch-empty">
                            <UserPlus size={26} />
                            <strong>Open the form when you need to add or edit student records.</strong>
                            <p>Select a row in the table to edit an existing student.</p>
                        </div>
                    )}
                </article>

                <article className="admin-card student-table-card">
                    <div className="student-table-top">
                        <div>
                            <span>Student Directory</span>
                            <h3>Registered Students</h3>
                            <p>Showing 3 rows per page. Select a row to manage it.</p>
                        </div>
                        <label className="student-search">
                            <Search size={16} />
                            <input
                                placeholder="Search students..."
                                value={studentSearch}
                                onChange={(e) => {
                                    setStudentSearch(e.target.value);
                                    setStudentPage(1);
                                }}
                            />
                        </label>
                    </div>
                    <div className="student-table-wrap">
                        <table className="student-management-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Faculty</th>
                                    <th>Semester</th>
                                    <th>GPA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentTableRows.map((item) => (
                                    <tr
                                        key={item.studentId}
                                        className={selectedStudentId === item.studentId ? 'selected' : ''}
                                        onClick={() => setSelectedStudentId((current) => current === item.studentId ? null : item.studentId)}
                                    >
                                        <td>{item.studentNumber}</td>
                                        <td>{item.fullName}</td>
                                        <td>{item.faculty || '-'}</td>
                                        <td>{item.semester ?? '-'}</td>
                                        <td>{Number(item.gpa ?? 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {!isLoading && studentTableRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>No student records match your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="student-table-footer">
                        <span>Page {Math.min(studentPage, studentTableTotalPages)} of {studentTableTotalPages}</span>
                        <div>
                            <button type="button" disabled={studentPage <= 1} onClick={() => setStudentPage((page) => Math.max(1, page - 1))}>
                                <ChevronLeft size={15} />
                                Previous
                            </button>
                            <button type="button" disabled={studentPage >= studentTableTotalPages} onClick={() => setStudentPage((page) => Math.min(studentTableTotalPages, page + 1))}>
                                Next
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                    {selectedStudent && (
                        <div className="selected-student-actions">
                            <div>
                                <span>Selected student</span>
                                <strong>{selectedStudent.fullName}</strong>
                            </div>
                            <button type="button" onClick={() => handleEditStudent(selectedStudent)}>
                                <Pencil size={15} />
                                Edit
                            </button>
                            <button type="button" className="danger-action" onClick={() => handleDeleteStudent(selectedStudent)}>
                                <Trash2 size={15} />
                                Delete
                            </button>
                        </div>
                    )}
                </article>
            </section>
            )}

            {mode === 'management' && (
            <section className="admin-grid">
                <article className="admin-card">
                    <div className="card-head">
                        <KeyRound size={17} />
                        <h3>Set Account Password</h3>
                    </div>
                    <form className="admin-form" onSubmit={handleSetupAccount}>
                        <input
                            placeholder="Student Number"
                            value={setupForm.studentNumber}
                            onChange={(e) => setSetupForm((prev) => ({ ...prev, studentNumber: e.target.value }))}
                            required
                        />
                        <input
                            placeholder="Temporary Password"
                            type="password"
                            minLength={8}
                            value={setupForm.password}
                            onChange={(e) => setSetupForm((prev) => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        <PasswordStrengthMeter password={setupForm.password} />
                        <button type="submit">
                            <KeyRound size={15} />
                            Update Password
                        </button>
                    </form>

                    <div className="mini-note">
                        Use this after creating a student profile to activate login credentials.
                    </div>
                </article>

                <article className="admin-card">
                    <div className="card-head">
                        <UserCog size={17} />
                        <h3>Create System User</h3>
                    </div>
                    <form className="admin-form" onSubmit={handleCreateSystemUser}>
                        <div className="split">
                            <input
                                placeholder="First Name"
                                value={systemUserForm.firstName}
                                onChange={(e) => setSystemUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                required
                            />
                            <input
                                placeholder="Last Name"
                                value={systemUserForm.lastName}
                                onChange={(e) => setSystemUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                required
                            />
                        </div>
                        <input
                            placeholder="Username"
                            value={systemUserForm.username}
                            onChange={(e) => setSystemUserForm((prev) => ({ ...prev, username: e.target.value }))}
                            required
                        />
                        <input
                            placeholder="Email"
                            type="email"
                            value={systemUserForm.email}
                            onChange={(e) => setSystemUserForm((prev) => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        <div className="split">
                            <select
                                value={systemUserForm.role}
                                onChange={(e) => setSystemUserForm((prev) => ({ ...prev, role: e.target.value as SystemUserRequest['role'] }))}
                            >
                                <option value="guild_president">Guild President</option>
                                <option value="minister_sport">Minister of Sport</option>
                                <option value="minister_evangelism">Minister of Evangelism</option>
                                <option value="minister_international_affairs">Minister of International Affairs</option>
                                <option value="dean">Dean</option>
                                <option value="staff">Staff</option>
                                <option value="finance">Minister of Finance</option>
                                <option value="student_card_manager">Student Card Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input
                                placeholder="Password"
                                type="password"
                                minLength={8}
                                value={systemUserForm.password}
                                onChange={(e) => setSystemUserForm((prev) => ({ ...prev, password: e.target.value }))}
                                required
                            />
                        </div>
                        <PasswordStrengthMeter password={systemUserForm.password} />
                        <button type="submit">
                            <ShieldCheck size={15} />
                            Create System User
                        </button>
                    </form>
                    <div className="mini-note">
                        Use this to create Guild President, ministers, Dean, Staff, Finance, and Admin accounts.
                    </div>
                </article>

                <article className="admin-card">
                    <div className="card-head">
                        <UserCog size={17} />
                        <h3>Assign Elected Student Privilege</h3>
                    </div>
                    <form className="admin-form" onSubmit={handlePromoteStudent}>
                        <select
                            value={leadershipForm.studentNumber}
                            onChange={(e) => {
                                const studentNumber = e.target.value;
                                const rolePrefix = leadershipForm.role.replaceAll('_', '');
                                setLeadershipForm((prev) => ({
                                    ...prev,
                                    studentNumber,
                                    username: studentNumber ? `${rolePrefix}${studentNumber}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : prev.username,
                                }));
                            }}
                            required
                        >
                            <option value="">Select student</option>
                            {students.map((item) => (
                                <option key={item.id} value={item.studentNumber ?? ''}>
                                    {item.fullName} ({item.studentNumber ?? 'No ID'})
                                </option>
                            ))}
                        </select>
                        <select
                            value={leadershipForm.role}
                            onChange={(e) => {
                                const role = e.target.value as LeadershipRole;
                                const rolePrefix = role.replaceAll('_', '');
                                setLeadershipForm((prev) => ({
                                    ...prev,
                                    role,
                                    username: prev.studentNumber ? `${rolePrefix}${prev.studentNumber}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : prev.username,
                                }));
                            }}
                        >
                            <option value="guild_president">Guild President</option>
                            <option value="finance">Minister of Finance</option>
                            <option value="minister_sport">Minister of Sport</option>
                            <option value="minister_evangelism">Minister of Evangelism</option>
                            <option value="minister_international_affairs">Minister of International Affairs</option>
                        </select>
                        <input
                            placeholder="Leadership username"
                            value={leadershipForm.username}
                            onChange={(e) => setLeadershipForm((prev) => ({ ...prev, username: e.target.value }))}
                            required
                        />
                        <input
                            placeholder="Leadership email (optional)"
                            type="email"
                            value={leadershipForm.email}
                            onChange={(e) => setLeadershipForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                        <input
                            placeholder="Leadership password"
                            type="password"
                            minLength={8}
                            value={leadershipForm.password}
                            onChange={(e) => setLeadershipForm((prev) => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        <PasswordStrengthMeter password={leadershipForm.password} />
                        <button type="submit">
                            <ShieldCheck size={15} />
                            Assign Privilege
                        </button>
                    </form>
                    <div className="mini-note">
                        This creates a separate leadership login. The student's normal account remains unchanged.
                    </div>
                </article>

                <article className="admin-card">
                    <div className="card-head">
                        <UserCog size={17} />
                        <h3>Edit System User Credentials</h3>
                    </div>
                    <form className="admin-form" onSubmit={handleUpdateSystemUser}>
                        <select
                            value={systemUserEditForm.id}
                            onChange={(e) => handleSelectSystemUserForEdit(e.target.value)}
                            required
                        >
                            <option value="">Select user</option>
                            {staff.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.fullName} ({item.role.replace('_', ' ')})
                                </option>
                            ))}
                        </select>
                        <div className="split">
                            <input
                                placeholder="First Name"
                                value={systemUserEditForm.firstName}
                                onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                required
                            />
                            <input
                                placeholder="Last Name"
                                value={systemUserEditForm.lastName}
                                onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                required
                            />
                        </div>
                        <input
                            placeholder="Username"
                            value={systemUserEditForm.username}
                            onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, username: e.target.value }))}
                            required
                        />
                        <input
                            placeholder="Email"
                            type="email"
                            value={systemUserEditForm.email}
                            onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        <div className="split">
                            <select
                                value={systemUserEditForm.role}
                                onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, role: e.target.value as SystemUserUpdateRequest['role'] }))}
                            >
                                <option value="guild_president">Guild President</option>
                                <option value="minister_sport">Minister of Sport</option>
                                <option value="minister_evangelism">Minister of Evangelism</option>
                                <option value="minister_international_affairs">Minister of International Affairs</option>
                                <option value="dean">Dean</option>
                                <option value="staff">Staff</option>
                                <option value="finance">Minister of Finance</option>
                                <option value="student_card_manager">Student Card Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input
                                placeholder="New Password (optional)"
                                type="password"
                                minLength={8}
                                value={systemUserEditForm.password}
                                onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, password: e.target.value }))}
                            />
                        </div>
                        {systemUserEditForm.password && <PasswordStrengthMeter password={systemUserEditForm.password} />}
                        <button type="submit">
                            <KeyRound size={15} />
                            Save Credentials
                        </button>
                    </form>
                    <div className="mini-note">
                        Leave password empty to keep the current password unchanged.
                    </div>
                </article>
            </section>
            )}

            {mode === 'management' && (
            <section className="admin-grid">
                <article className="admin-card">
                    <div className="card-head">
                        <UserCog size={17} />
                        <h3>Staff Directory</h3>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.slice(0, 8).map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.fullName}</td>
                                        <td>{item.username ?? '-'}</td>
                                        <td>{item.role.replace('_', ' ')}</td>
                                    </tr>
                                ))}
                                {!isLoading && staff.length === 0 && (
                                    <tr>
                                        <td colSpan={3}>No staff accounts found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>
            )}

            {detailTitle && (
                <div className="detail-modal-overlay" onClick={closeDetails}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-head">
                            <h3>{detailTitle}</h3>
                            <button type="button" onClick={closeDetails}>Close</button>
                        </div>
                        <div className="detail-modal-body">
                            {pagedRows.length === 0 && <p>No records.</p>}
                            {pagedRows.map((row, idx) => (
                                <div key={`${row.name}-${idx}`} className="detail-row">
                                    <strong>{row.name}</strong>
                                    <span>{row.meta}</span>
                                </div>
                            ))}
                        </div>
                        <div className="detail-modal-foot">
                            <button type="button" disabled={detailPage <= 1} onClick={() => setDetailPage((p) => Math.max(1, p - 1))}>Prev</button>
                            <span>Page {detailPage} of {totalPages}</span>
                            <button type="button" disabled={detailPage >= totalPages} onClick={() => setDetailPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;


