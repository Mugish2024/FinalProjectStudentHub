import { useEffect, useMemo, useState } from 'react';
import './DeanStudentList.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

type StudentSummary = {
    studentId: number;
    studentNumber: string;
    fullName: string;
    faculty: string;
    department: string;
    program: string;
    credits: number;
};

const DeanStudentList = () => {
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loadStudents = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/students/summary`);
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error('Failed to load students.');
            }
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load students.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) {
            return students;
        }
        return students.filter((student) =>
            student.fullName.toLowerCase().includes(term)
            || student.studentNumber.toLowerCase().includes(term)
            || student.faculty.toLowerCase().includes(term)
            || student.department.toLowerCase().includes(term)
            || student.program.toLowerCase().includes(term)
        );
    }, [students, query]);

    return (
        <div className="dean-students">
            <header className="dean-students__header">
                <div>
                    <h1>Registered Students</h1>
                    <p>View all students registered in the system. Filter by name, number, faculty, or department.</p>
                </div>
                <button className="dean-students__refresh" onClick={loadStudents} disabled={isLoading}>
                    {isLoading ? 'Refreshing...' : 'Refresh List'}
                </button>
            </header>

            <div className="dean-students__controls">
                <input
                    className="dean-students__search"
                    placeholder="Search by name, student number, faculty, department, program..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="dean-students__count">
                    Showing {filtered.length} of {students.length}
                </div>
            </div>

            {error && (
                <div className="dean-students__error">{error}</div>
            )}

            <div className="dean-students__table-wrap">
                <table className="dean-students__table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Student Number</th>
                            <th>Faculty</th>
                            <th>Department</th>
                            <th>Program</th>
                            <th>Credits</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((student) => (
                            <tr key={student.studentId}>
                                <td>
                                    <div className="dean-students__name">{student.fullName}</div>
                                </td>
                                <td>
                                    <span className="dean-students__badge">{student.studentNumber}</span>
                                </td>
                                <td>{student.faculty}</td>
                                <td>{student.department}</td>
                                <td>{student.program}</td>
                                <td>
                                    <span className="dean-students__credits">{student.credits}</span>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="dean-students__empty">
                                    No students match your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeanStudentList;
