import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import './DeanDashboard.css';

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

const DeanDashboard: React.FC = () => {
    const [query, setQuery] = useState('');
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [searchResult, setSearchResult] = useState<StudentSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAllStudents = async () => {
        setIsLoading(true);
        setError('');
        setSearchResult(null);
        try {
            const response = await fetch(`${API_BASE}/api/students/summary`);
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error('Failed to load students.');
            }
            setStudents(Array.isArray(data) ? (data as StudentSummary[]) : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load students.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            fetchAllStudents();
            return;
        }

        setIsLoading(true);
        setError('');
        setSearchResult(null);
        try {
            const response = await fetch(`${API_BASE}/api/students/summary/search?studentNumber=${encodeURIComponent(trimmed)}`);
            if (response.status === 404) {
                setSearchResult(null);
                setStudents([]);
                setError('No student found with that ID.');
                return;
            }
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error('Search failed.');
            }
            setSearchResult(data as StudentSummary);
            setStudents([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllStudents();
    }, []);

    const visibleStudents = searchResult ? [searchResult] : students;

    return (
        <div className="dean-dashboard">
            <header className="dean-dashboard-header">
                <div>
                    <h1>Dean Dashboard</h1>
                    <p>Search students by ID and review their academic profile.</p>
                </div>
                <div className="dean-dashboard-metric">
                    <Users size={20} />
                    <span>{visibleStudents.length}</span>
                    <small>Students</small>
                </div>
            </header>

            <form className="dean-search" onSubmit={handleSearch}>
                <div className="dean-search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by Student ID (e.g AUCA/UG/123/020)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button className="btn-dean-primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
                <button
                    className="btn-dean-ghost"
                    type="button"
                    onClick={fetchAllStudents}
                    disabled={isLoading}
                >
                    Fetch All
                </button>
            </form>

            {error && (
                <div className="dean-alert dean-alert-error">{error}</div>
            )}

            <section className="dean-table-card">
                <div className="dean-table-header">
                    <h3>Student Records</h3>
                    <span className="dean-table-subtitle">Updated on demand from the backend.</span>
                </div>

                {isLoading ? (
                    <div className="dean-empty">Loading students...</div>
                ) : visibleStudents.length === 0 ? (
                    <div className="dean-empty">No students to display.</div>
                ) : (
                    <table className="dean-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Full Name</th>
                                <th>Faculty</th>
                                <th>Department</th>
                                <th>Program</th>
                                <th>Credits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleStudents.map((student) => (
                                <tr key={student.studentId}>
                                    <td>{student.studentNumber}</td>
                                    <td>{student.fullName}</td>
                                    <td>{student.faculty}</td>
                                    <td>{student.department}</td>
                                    <td>{student.program}</td>
                                    <td>{student.credits}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default DeanDashboard;
