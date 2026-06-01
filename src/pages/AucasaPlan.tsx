import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
    Archive,
    CheckCircle2,
    ClipboardList,
    Filter,
    PlusCircle,
    ShieldCheck,
    Star,
    TrendingUp,
    WalletCards,
} from 'lucide-react';
import securityCamerasImage from '../assets/aucasa-security-cameras.png';
import gardenProjectImage from '../assets/aucasa-garden-project.png';
import './AucasaPlan.css';

type ProjectMode = 'Planned Project' | 'Recorded Achievement';
type ProjectStatus = 'Planning' | 'In Progress' | 'Achieved';

type CurrentMandateProject = {
    id: number;
    name: string;
    mode: ProjectMode;
    expectedAmount: number;
    amountUsed: number;
    status: ProjectStatus;
    description: string;
    imageDataUrl?: string;
    imageName?: string;
};

const STORAGE_KEY = 'aucasa_current_semester_projects';
const RATINGS_KEY_PREFIX = 'aucasa_project_ratings';

const archivedProjects = [
    {
        title: 'Aucasa Semester 1 2023-2024',
        year: '2023-2024',
        description: 'AUCASA distributed security cameras across the campus to maintain student safety and improve campus monitoring.',
        image: securityCamerasImage,
        amountUsed: 12500,
        status: 'Completed',
    },
    {
        title: 'Aucasa Semester 2 2023-2024',
        year: '2023-2024',
        description: 'AUCASA renovated the garden located at Masoro to maintain a comfortable and welcoming place for students.',
        image: gardenProjectImage,
        amountUsed: 8200,
        status: 'Completed',
    },
];

const readStoredProjects = (): CurrentMandateProject[] => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'RWF',
        maximumFractionDigits: 0,
    }).format(value);
};

interface AucasaPlanProps {
    viewerMode?: 'manage' | 'view';
    ratingUserKey?: string;
}

const AucasaPlan = ({ viewerMode = 'manage', ratingUserKey = 'viewer' }: AucasaPlanProps) => {
    const canManage = viewerMode === 'manage';
    const ratingsStorageKey = `${RATINGS_KEY_PREFIX}:${ratingUserKey}`;
    const [projects, setProjects] = useState<CurrentMandateProject[]>(readStoredProjects);
    const [ratings, setRatings] = useState<Record<string, number>>(() => {
        try {
            const raw = window.localStorage.getItem(ratingsStorageKey);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed as Record<string, number> : {};
        } catch {
            return {};
        }
    });
    const [projectName, setProjectName] = useState('');
    const [mode, setMode] = useState<ProjectMode>('Planned Project');
    const [expectedAmount, setExpectedAmount] = useState('');
    const [amountUsed, setAmountUsed] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('Planning');
    const [description, setDescription] = useState('');
    const [projectImageDataUrl, setProjectImageDataUrl] = useState('');
    const [projectImageName, setProjectImageName] = useState('');
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [archiveYear, setArchiveYear] = useState('All');
    const [currentProjectFilter, setCurrentProjectFilter] = useState('All');
    const [expandedDescriptions, setExpandedDescriptions] = useState<Array<string | number>>([]);
    const [message, setMessage] = useState('');

    const totalExpected = useMemo(
        () => projects.reduce((sum, project) => sum + project.expectedAmount, 0),
        [projects]
    );
    const totalUsed = useMemo(
        () => projects.reduce((sum, project) => sum + project.amountUsed, 0),
        [projects]
    );
    const archiveYears = useMemo(
        () => ['All', ...Array.from(new Set(archivedProjects.map((project) => project.year)))],
        []
    );
    const filteredArchivedProjects = useMemo(
        () => archivedProjects.filter((project) => archiveYear === 'All' || project.year === archiveYear),
        [archiveYear]
    );
    const filteredCurrentProjects = useMemo(
        () => projects.filter((project) => {
            if (currentProjectFilter === 'All') return true;
            if (currentProjectFilter === 'Archived Achievements') return false;
            return project.mode === currentProjectFilter || project.status === currentProjectFilter;
        }),
        [projects, currentProjectFilter]
    );
    const isViewingArchiveInCurrentSection = currentProjectFilter === 'Archived Achievements';

    const saveProjects = (nextProjects: CurrentMandateProject[]) => {
        setProjects(nextProjects);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));
    };

    const saveRating = (projectId: string | number, value: number) => {
        const nextRatings = { ...ratings, [String(projectId)]: value };
        setRatings(nextRatings);
        window.localStorage.setItem(ratingsStorageKey, JSON.stringify(nextRatings));
    };

    const renderRating = (projectId: string | number) => {
        if (canManage) return null;
        const currentRating = ratings[String(projectId)] ?? 0;

        return (
            <div className="aucasa-rating-row" aria-label={`Project rating ${currentRating} out of 5`}>
                <span>Satisfaction</span>
                <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            type="button"
                            key={value}
                            className={value <= currentRating ? 'active' : ''}
                            onClick={() => saveRating(projectId, value)}
                            aria-label={`Rate ${value} stars`}
                        >
                            <Star size={17} />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const handleImageChange = (file?: File) => {
        setProjectImageDataUrl('');
        setProjectImageName('');
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setProjectImageDataUrl(typeof reader.result === 'string' ? reader.result : '');
            setProjectImageName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const toggleDescription = (id: string | number) => {
        setExpandedDescriptions((current) => (
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        ));
    };

    const renderDescription = (id: string | number, text: string) => {
        const isLong = text.length > 145;
        const isExpanded = expandedDescriptions.includes(id);
        const displayText = isLong && !isExpanded ? `${text.slice(0, 145).trim()}...` : text;

        return (
            <>
                <p>{displayText}</p>
                {isLong && (
                    <button type="button" className="aucasa-read-more" onClick={() => toggleDescription(id)}>
                        {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                )}
            </>
        );
    };

    const createProject = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('');
        const trimmedName = projectName.trim();
        const trimmedDescription = description.trim();

        if (!trimmedName || !trimmedDescription) {
            setMessage('Project name and description are required.');
            return;
        }

        const nextProject: CurrentMandateProject = {
            id: editingProjectId ?? Date.now(),
            name: trimmedName,
            mode,
            expectedAmount: Number(expectedAmount) || 0,
            amountUsed: Number(amountUsed) || 0,
            status,
            description: trimmedDescription,
            imageDataUrl: projectImageDataUrl || undefined,
            imageName: projectImageName || undefined,
        };

        const nextProjects = editingProjectId
            ? projects.map((project) => (project.id === editingProjectId ? nextProject : project))
            : [nextProject, ...projects];

        saveProjects(nextProjects);
        setEditingProjectId(null);
        setProjectName('');
        setExpectedAmount('');
        setAmountUsed('');
        setStatus('Planning');
        setDescription('');
        setProjectImageDataUrl('');
        setProjectImageName('');
        setMessage(editingProjectId ? 'AUCASA project updated successfully.' : 'AUCASA project saved for the current semester.');
    };

    const startEditingProject = (project: CurrentMandateProject) => {
        setEditingProjectId(project.id);
        setProjectName(project.name);
        setMode(project.mode);
        setExpectedAmount(project.expectedAmount ? String(project.expectedAmount) : '');
        setAmountUsed(project.amountUsed ? String(project.amountUsed) : '');
        setStatus(project.status);
        setDescription(project.description);
        setProjectImageDataUrl(project.imageDataUrl ?? '');
        setProjectImageName(project.imageName ?? '');
        setMessage('Editing project. Update the details and save changes.');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingProjectId(null);
        setProjectName('');
        setExpectedAmount('');
        setAmountUsed('');
        setStatus('Planning');
        setDescription('');
        setProjectImageDataUrl('');
        setProjectImageName('');
    };

    const discardDraft = () => {
        resetForm();
        setMessage('');
    };

    return (
        <div className="aucasa-plan-page">
            <section className="aucasa-plan-hero">
                <div>
                    <span className="aucasa-plan-kicker">Guild Office Planning Desk</span>
                    <h1>AUCASA Plan of the Current Semester</h1>
                    <p>
                        {canManage ? 'Review achievements and plan current AUCASA projects.' : 'View AUCASA projects and rate your satisfaction.'}
                    </p>
                </div>
            </section>

            <section className="aucasa-plan-metrics">
                <article>
                    <Archive size={18} />
                    <span>Archived Achievements</span>
                    <strong>{archivedProjects.length}</strong>
                </article>
                <article>
                    <ClipboardList size={18} />
                    <span>Current Semester Plans</span>
                    <strong>{projects.length}</strong>
                </article>
                <article>
                    <WalletCards size={18} />
                    <span>Expected Budget</span>
                    <strong>{formatCurrency(totalExpected)}</strong>
                </article>
                <article>
                    <ShieldCheck size={18} />
                    <span>Amount Used</span>
                    <strong>{formatCurrency(totalUsed)}</strong>
                </article>
            </section>

            {projects.length > 0 && (
                <section className="aucasa-current-projects">
                    <div className="aucasa-section-head compact">
                        <div>
                            <span>Current AUCASA Era</span>
                            <h2>Current Semester Projects</h2>
                        </div>
                        <label className="aucasa-year-filter">
                            <Filter size={16} />
                            <select
                                value={currentProjectFilter}
                                onChange={(event) => setCurrentProjectFilter(event.target.value)}
                            >
                                <option value="All">All Projects</option>
                                <option value="Planned Project">Planned</option>
                                <option value="Recorded Achievement">Achievements</option>
                                <option value="Archived Achievements">Archived Achievements</option>
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Achieved">Achieved</option>
                            </select>
                        </label>
                    </div>
                    {isViewingArchiveInCurrentSection ? (
                        <div className="aucasa-archive-grid aucasa-archive-grid--inside">
                            {archivedProjects.map((project) => (
                                <article className="aucasa-archive-card" key={project.title}>
                                    <div className="aucasa-archive-image">
                                        <img src={project.image} alt={project.title} />
                                        <span>{project.status}</span>
                                    </div>
                                    <div className="aucasa-archive-body">
                                        <h3>{project.title}</h3>
                                        {renderDescription(project.title, project.description)}
                                        {renderRating(project.title)}
                                        <div className="aucasa-card-footer">
                                            <div>
                                                <small>Investment</small>
                                                <strong>{formatCurrency(project.amountUsed)}</strong>
                                            </div>
                                            <CheckCircle2 size={20} />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="aucasa-current-grid">
                            {filteredCurrentProjects.map((project) => (
                                <article key={project.id}>
                                    {project.imageDataUrl && (
                                        <div className="aucasa-current-image">
                                            <img src={project.imageDataUrl} alt={project.name} />
                                        </div>
                                    )}
                                    <span>{project.mode}</span>
                                    <h3>{project.name}</h3>
                                    {renderDescription(project.id, project.description)}
                                    {renderRating(project.id)}
                                    <div className="current-project-meta">
                                        <strong>{project.status}</strong>
                                        <small>Expected {formatCurrency(project.expectedAmount)}</small>
                                        <small>Used {formatCurrency(project.amountUsed)}</small>
                                    </div>
                                    {canManage && (
                                        <button
                                            type="button"
                                            className="aucasa-edit-project"
                                            onClick={() => startEditingProject(project)}
                                        >
                                            Edit Project
                                        </button>
                                    )}
                                </article>
                            ))}
                            {filteredCurrentProjects.length === 0 && (
                                <div className="aucasa-empty-state">
                                    <ClipboardList size={22} />
                                    <p>No current semester projects match this filter.</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {projects.length === 0 && (
                <>
                    <section className="aucasa-section-head">
                        <div>
                            <span>Semester Archive</span>
                            <h2>Recent Achieved Projects</h2>
                        </div>
                        <label className="aucasa-year-filter">
                            <Filter size={16} />
                            <select value={archiveYear} onChange={(event) => setArchiveYear(event.target.value)}>
                                {archiveYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year === 'All' ? 'All Years' : year}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </section>

                    <section className="aucasa-archive-grid">
                        {filteredArchivedProjects.map((project) => (
                            <article className="aucasa-archive-card" key={project.title}>
                                <div className="aucasa-archive-image">
                                    <img src={project.image} alt={project.title} />
                                    <span>{project.status}</span>
                                </div>
                                <div className="aucasa-archive-body">
                                    <h3>{project.title}</h3>
                                    {renderDescription(project.title, project.description)}
                                    {renderRating(project.title)}
                                    <div className="aucasa-card-footer">
                                        <div>
                                            <small>Investment</small>
                                            <strong>{formatCurrency(project.amountUsed)}</strong>
                                        </div>
                                        <CheckCircle2 size={20} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                </>
            )}

            {canManage && (
            <section className="aucasa-planning-card">
                <div className="aucasa-planning-head">
                    <div>
                        <span>Current Mandate</span>
                        <h2>Project Process and Future Planning</h2>
                        <p>Record achieved work or prepare future projects with a clear mission and expected amount.</p>
                    </div>
                    <div className="aucasa-budget-pill">
                        <WalletCards size={18} />
                        <div>
                            <span>Available Budget</span>
                            <strong>{formatCurrency(45000000)}</strong>
                        </div>
                    </div>
                </div>

                <div className="aucasa-planning-layout">
                    <aside className="aucasa-authority-panel">
                        <div className="authority-note">
                            <h3>Presidency Authority</h3>
                            <p>
                                This page helps the Guild President formally record institutional achievements and prepare campus-wide projects.
                            </p>
                        </div>
                        <div className="authority-mini-grid">
                            <div className="active">
                                <TrendingUp size={22} />
                                <span>Strategic Growth</span>
                            </div>
                            <div>
                                <ShieldCheck size={22} />
                                <span>Verified Audits</span>
                            </div>
                        </div>
                    </aside>

                    <form className="aucasa-project-form" onSubmit={createProject}>
                        <label>
                            Project Type
                            <select value={mode} onChange={(event) => setMode(event.target.value as ProjectMode)}>
                                <option>Planned Project</option>
                                <option>Recorded Achievement</option>
                            </select>
                        </label>
                        <label>
                            Project Name
                            <input
                                value={projectName}
                                onChange={(event) => setProjectName(event.target.value)}
                                placeholder="e.g. Campus Library Digitalization"
                            />
                        </label>
                        <label>
                            Expected Amount (RWF)
                            <input
                                type="number"
                                min="0"
                                value={expectedAmount}
                                onChange={(event) => setExpectedAmount(event.target.value)}
                                placeholder="0"
                            />
                        </label>
                        <label>
                            Amount Used (RWF)
                            <input
                                type="number"
                                min="0"
                                value={amountUsed}
                                onChange={(event) => setAmountUsed(event.target.value)}
                                placeholder="0"
                            />
                        </label>
                        <label>
                            Status
                            <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
                                <option>Planning</option>
                                <option>In Progress</option>
                                <option>Achieved</option>
                            </select>
                        </label>
                        <label>
                            Project Picture Optional
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleImageChange(event.target.files?.[0])}
                            />
                            {projectImageName && <small className="aucasa-file-note">Current photo: {projectImageName}</small>}
                        </label>
                        <label className="aucasa-form-wide">
                            Project Description and Mission
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Outline the objectives, student benefits, and the implementation mission..."
                            />
                        </label>
                        {message && <div className="aucasa-form-message">{message}</div>}
                        <div className="aucasa-form-actions">
                            <button type="button" className="secondary" onClick={discardDraft}>Discard Draft</button>
                            <button type="submit">
                                <PlusCircle size={18} />
                                {editingProjectId ? 'Save Project Changes' : 'Create New Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
            )}
        </div>
    );
};

export default AucasaPlan;
