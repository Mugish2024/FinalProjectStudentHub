import { useEffect, useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, UserCog, UserPlus, Users } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import './AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type DirectoryItem = {
    id: number;
    fullName: string;
    role: string;
    studentNumber?: string | null;
    username?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
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

type SystemUserRequest = {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'dean' | 'staff' | 'finance' | 'guild_president';
};

type SystemUserUpdateRequest = {
    id: string;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'dean' | 'staff' | 'finance' | 'guild_president';
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

    const roleChartData = useMemo(() => ([
        { name: 'Admin', value: staffSummary.admins, color: '#0f2f66' },
        { name: 'Dean', value: staffSummary.deans, color: '#2563eb' },
        { name: 'Finance', value: staffSummary.finance, color: '#0891b2' },
        { name: 'Guild', value: staffSummary.guild, color: '#10b981' },
        { name: 'Staff', value: staffSummary.staff, color: '#6366f1' },
    ]).filter((item) => item.value > 0), [staffSummary]);

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

    const semesterBehaviorData = useMemo(() => {
        const map = new Map<number, { semester: number; students: number; totalGpa: number }>();
        studentSummaries.forEach((item) => {
            const semester = Number(item.semester ?? 1);
            const gpa = Number(item.gpa ?? 0);
            const current = map.get(semester) ?? { semester, students: 0, totalGpa: 0 };
            current.students += 1;
            current.totalGpa += gpa;
            map.set(semester, current);
        });
        return Array.from(map.values())
            .sort((a, b) => a.semester - b.semester)
            .map((item) => ({
                semester: `Sem ${item.semester}`,
                students: item.students,
                avgGpa: item.students > 0 ? Number((item.totalGpa / item.students).toFixed(2)) : 0,
            }));
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

    const handleRegisterStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const response = await fetch(`${API_BASE}/api/students/register`, {
            method: 'POST',
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
        setSuccess(`Student ${data.fullName ?? ''} created successfully.`);
        setSetupForm((prev) => ({ ...prev, studentNumber: data.studentNumber ?? prev.studentNumber }));
        setStudentForm({
            studentNumber: '',
            firstName: '',
            lastName: '',
            faculty: '',
            department: '',
            program: 'Day',
            credits: '0',
        });
        await loadDirectory();
    };

    const handleSetupAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
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
                    ...students.map((s) => ({ name: s.fullName, meta: `Student · ${s.studentNumber ?? '-'}` })),
                    ...staff.map((s) => ({ name: s.fullName, meta: `${s.role.replace('_', ' ')} · ${s.username ?? '-'}` })),
                ])}>
                    <small>Total Platform Users</small>
                    <strong>{isLoading ? '...' : systemHealth.totalUsers}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Students With GPA Records', studentSummaries
                    .filter((s) => Number(s.gpa ?? 0) > 0)
                    .map((s) => ({ name: s.fullName, meta: `${s.studentNumber} · GPA ${Number(s.gpa ?? 0).toFixed(2)}/20` })))}>
                    <small>Students With GPA</small>
                    <strong>{isLoading ? '...' : systemHealth.gpaRecords}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Students With Credit Records', studentSummaries
                    .filter((s) => Number(s.credits ?? 0) > 0)
                    .map((s) => ({ name: s.fullName, meta: `${s.studentNumber} · Credits ${s.credits}` })))}>
                    <small>Students With Credits</small>
                    <strong>{isLoading ? '...' : systemHealth.creditRecords}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Top Faculty Students', studentSummaries
                    .filter((s) => (s.faculty ?? '').trim() === systemHealth.dominantFaculty)
                    .map((s) => ({ name: s.fullName, meta: `${s.studentNumber} · ${s.department}` })))}>
                    <small>Top Faculty</small>
                    <strong style={{ fontSize: '1rem' }}>{isLoading ? '...' : systemHealth.dominantFaculty}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('All Students', students
                    .map((s) => ({ name: s.fullName, meta: s.studentNumber ?? '-' })))}>
                    <small>Total Students</small>
                    <strong>{isLoading ? '...' : students.length}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('All Staff', staff
                    .map((s) => ({ name: s.fullName, meta: `${s.role.replace('_', ' ')} · ${s.username ?? '-'}` })))}>
                    <small>Total Staff</small>
                    <strong>{isLoading ? '...' : staffSummary.total}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Admin Accounts', staff
                    .filter((s) => s.role === 'admin')
                    .map((s) => ({ name: s.fullName, meta: s.username ?? '-' })))}>
                    <small>Admins</small>
                    <strong>{isLoading ? '...' : staffSummary.admins}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Dean + Staff Accounts', staff
                    .filter((s) => s.role === 'dean' || s.role === 'staff')
                    .map((s) => ({ name: s.fullName, meta: `${s.role} · ${s.username ?? '-'}` })))}>
                    <small>Dean + Staff</small>
                    <strong>{isLoading ? '...' : staffSummary.deans + staffSummary.staff}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Finance Accounts', staff
                    .filter((s) => s.role === 'finance')
                    .map((s) => ({ name: s.fullName, meta: s.username ?? '-' })))}>
                    <small>Finance</small>
                    <strong>{isLoading ? '...' : staffSummary.finance}</strong>
                </article>
                <article className="clickable-kpi" onClick={() => openDetails('Guild President Accounts', staff
                    .filter((s) => s.role === 'guild_president')
                    .map((s) => ({ name: s.fullName, meta: s.username ?? '-' })))}>
                    <small>Guild President</small>
                    <strong>{isLoading ? '...' : staffSummary.guild}</strong>
                </article>
            </section>
            )}

            {mode === 'overview' && (
            <section className="admin-chart-grid">
                <article className="admin-card chart-card">
                    <div className="card-head">
                        <Users size={17} />
                        <h3>Staff Role Distribution</h3>
                    </div>
                    <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={roleChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                    {roleChartData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="admin-card chart-card">
                    <div className="card-head">
                        <Users size={17} />
                        <h3>Students by Faculty</h3>
                    </div>
                    <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={facultyChartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={55} interval={0} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="admin-card chart-card wide">
                    <div className="card-head">
                        <UserCog size={17} />
                        <h3>Semester Behavior and GPA Trend</h3>
                    </div>
                    <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={semesterBehaviorData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="semester" />
                                <YAxis yAxisId="left" allowDecimals={false} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 20]} />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="students" fill="#0f766e" radius={[6, 6, 0, 0]} />
                                <Bar yAxisId="right" dataKey="avgGpa" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </section>
            )}

            {mode === 'management' && (
            <section className="admin-grid">
                <article className="admin-card">
                    <div className="card-head">
                        <UserPlus size={17} />
                        <h3>Create Student Profile</h3>
                    </div>
                    <form className="admin-form" onSubmit={handleRegisterStudent}>
                        <input
                            placeholder="Student Number"
                            value={studentForm.studentNumber}
                            onChange={(e) => setStudentForm((prev) => ({ ...prev, studentNumber: e.target.value }))}
                            required
                        />
                        <div className="split">
                            <input
                                placeholder="First Name"
                                value={studentForm.firstName}
                                onChange={(e) => setStudentForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                required
                            />
                            <input
                                placeholder="Last Name"
                                value={studentForm.lastName}
                                onChange={(e) => setStudentForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="split">
                            <input
                                placeholder="Faculty"
                                value={studentForm.faculty}
                                onChange={(e) => setStudentForm((prev) => ({ ...prev, faculty: e.target.value }))}
                                required
                            />
                            <input
                                placeholder="Department"
                                value={studentForm.department}
                                onChange={(e) => setStudentForm((prev) => ({ ...prev, department: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="split">
                            <select
                                value={studentForm.program}
                                onChange={(e) => setStudentForm((prev) => ({ ...prev, program: e.target.value }))}
                            >
                                <option value="Day">Day</option>
                                <option value="Evening">Evening</option>
                                <option value="Weekend">Weekend</option>
                            </select>
                            <input
                                type="number"
                                min={0}
                                placeholder="Credits"
                                value={studentForm.credits}
                                onChange={(e) => setStudentForm((prev) => ({ ...prev, credits: e.target.value }))}
                                required
                            />
                        </div>
                        <button type="submit">
                            <ShieldCheck size={15} />
                            Register Student
                        </button>
                    </form>
                </article>

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
                            minLength={6}
                            value={setupForm.password}
                            onChange={(e) => setSetupForm((prev) => ({ ...prev, password: e.target.value }))}
                            required
                        />
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
                                <option value="dean">Dean</option>
                                <option value="staff">Staff</option>
                                <option value="finance">Finance</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input
                                placeholder="Password"
                                type="password"
                                minLength={6}
                                value={systemUserForm.password}
                                onChange={(e) => setSystemUserForm((prev) => ({ ...prev, password: e.target.value }))}
                                required
                            />
                        </div>
                        <button type="submit">
                            <ShieldCheck size={15} />
                            Create System User
                        </button>
                    </form>
                    <div className="mini-note">
                        Use this to create Guild President, Dean, Staff, Finance, and Admin accounts.
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
                                <option value="dean">Dean</option>
                                <option value="staff">Staff</option>
                                <option value="finance">Finance</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input
                                placeholder="New Password (optional)"
                                type="password"
                                minLength={6}
                                value={systemUserEditForm.password}
                                onChange={(e) => setSystemUserEditForm((prev) => ({ ...prev, password: e.target.value }))}
                            />
                        </div>
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
                        <Users size={17} />
                        <h3>Recent Students</h3>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Student Number</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.slice(0, 8).map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.fullName}</td>
                                        <td>{item.studentNumber ?? '-'}</td>
                                    </tr>
                                ))}
                                {!isLoading && students.length === 0 && (
                                    <tr>
                                        <td colSpan={2}>No student accounts found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>

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
