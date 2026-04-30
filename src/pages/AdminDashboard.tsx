import { useEffect, useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, UserCog, UserPlus, Users } from 'lucide-react';
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
}

const AdminDashboard = ({ fullName = 'System Admin' }: AdminDashboardProps) => {
    const [students, setStudents] = useState<DirectoryItem[]>([]);
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

    const loadDirectory = async () => {
        setIsLoading(true);
        try {
            const [studentRes, staffRes] = await Promise.all([
                fetch(`${API_BASE}/api/users/recipients?role=student`),
                fetch(`${API_BASE}/api/admin/users`),
            ]);

            const studentData = await studentRes.json().catch(() => []);
            const staffData = await staffRes.json().catch(() => []);

            setStudents(studentRes.ok && Array.isArray(studentData) ? studentData : []);
            setStaff(staffRes.ok && Array.isArray(staffData) ? staffData : []);
            if (!studentRes.ok || !staffRes.ok) {
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
                    <h1>Account Management Dashboard</h1>
                    <p>Provision student accounts, configure login credentials, and monitor user role distribution.</p>
                </div>
                <div className="admin-chip">
                    <UserCog size={16} />
                    <span>{fullName}</span>
                </div>
            </section>

            {error && <div className="admin-alert admin-alert--error">{error}</div>}
            {success && <div className="admin-alert admin-alert--success">{success}</div>}

            <section className="admin-kpi-grid">
                <article>
                    <small>Total Students</small>
                    <strong>{isLoading ? '...' : students.length}</strong>
                </article>
                <article>
                    <small>Total Staff</small>
                    <strong>{isLoading ? '...' : staffSummary.total}</strong>
                </article>
                <article>
                    <small>Admins</small>
                    <strong>{isLoading ? '...' : staffSummary.admins}</strong>
                </article>
                <article>
                    <small>Dean + Staff</small>
                    <strong>{isLoading ? '...' : staffSummary.deans + staffSummary.staff}</strong>
                </article>
                <article>
                    <small>Finance</small>
                    <strong>{isLoading ? '...' : staffSummary.finance}</strong>
                </article>
                <article>
                    <small>Guild President</small>
                    <strong>{isLoading ? '...' : staffSummary.guild}</strong>
                </article>
            </section>

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
        </div>
    );
};

export default AdminDashboard;
