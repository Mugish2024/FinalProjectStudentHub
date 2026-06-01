import { useState } from 'react';
import {
    Calendar,
    MapPin,
    Clock,
    Trophy,
    Heart,
    Globe,
    DollarSign,
    Users,
    Megaphone,
    ArrowRight
} from 'lucide-react';
import './Events.css';

type EventCategory = 'sports' | 'evangelism' | 'international' | 'finance' | 'admin' | 'social';

interface EventItem {
    id: string;
    title: string;
    organizer: string;
    category: EventCategory;
    date: string;
    time?: string; // Optional for past events
    location?: string;
    description: string;
    status: 'upcoming' | 'past';
    imageUrl?: string; // Placeholder for now
    highlights?: { label: string; value: string }[]; // Specific data points (e.g. score, funds used)
}

const EVENTS_DATA: EventItem[] = [
    // --- UPCOMING ---
    {
        id: '1',
        title: 'AUCA vs UR: The University Derby',
        organizer: 'Minister of Sports',
        category: 'sports',
        date: '2024-03-15',
        time: '15:00 PM',
        location: 'Masoro Campus Pitch',
        description: 'Come witness the biggest football match of the semester! Our university team takes on the University of Rwanda in a friendly but competitive derby. We need the full support of the "Eagles" fans to secure victory.',
        status: 'upcoming',
    },
    {
        id: '2',
        title: 'Week of Prayer: "Revival 2024"',
        organizer: 'Minister of Evangelism',
        category: 'evangelism',
        date: '2024-03-20',
        time: '18:00 PM Daily',
        location: 'Gishushu & Masoro Chapels',
        description: 'An upcoming spiritual journey for all students. We have invited Pastor John Doe from Nairobi to lead us through a week of spiritual renewal and powerful messages.',
        status: 'upcoming',
    },
    {
        id: '3',
        title: 'Cultural Exchange Night',
        organizer: 'Minister of International Students',
        category: 'international',
        date: '2024-03-25',
        time: '19:00 PM',
        location: 'Main Auditorium',
        description: 'A celebration of our diversity! International students from over 15 countries will showcase their traditional attire, food, and music. An important announcement regarding visa renewal support will also be made.',
        status: 'upcoming',
    },
    {
        id: '4',
        title: 'Transport Initiative: New Bus Fundraising',
        organizer: 'Minister of Finance',
        category: 'finance',
        date: '2024-04-01',
        time: '10:00 AM',
        location: 'Administration Block',
        description: 'We are planning to purchase a new student bus to improve the shuttle service between campuses. The Finance Ministry will be presenting the budget and fundraising roadmap.',
        status: 'upcoming',
    },

    // --- PAST ---
    {
        id: '5',
        title: 'Inter-Faculty Basketball Finals',
        organizer: 'Minister of Sports',
        category: 'sports',
        date: '2024-02-10',
        location: 'Gishushu Court',
        description: 'An intense final match between IT and Business faculties. The IT team emerged victorious with a buzzer-beater shot.',
        status: 'past',
        highlights: [
            { label: 'Winner', value: 'IT Faculty (65 - 63)' },
            { label: 'MVP', value: 'James K.' }
        ]
    },
    {
        id: '6',
        title: 'Student Welfare & Support Report',
        organizer: 'AUCASA President',
        category: 'admin',
        date: '2024-01-20',
        description: 'The Office of the President successfully addressed the tuition clearance issues for 50+ students. We also launched a peer-counseling program.',
        status: 'past',
        highlights: [
            { label: 'Students Helped', value: '52 Clearance Issues Resolved' },
            { label: 'New Policy', value: 'Peer Counseling Active' }
        ]
    },
    {
        id: '7',
        title: 'Campus Beautification: Garden Project',
        organizer: 'Minister of Finance',
        category: 'finance',
        date: '2024-01-05',
        description: 'Reporting on the usage of last semester\'s "Green Fund". We successfully installed 20 new ergonomic benches and planted 50 trees in the main garden areas.',
        status: 'past',
        highlights: [
            { label: 'Expenditure', value: '1.2M RWF' },
            { label: 'Outcome', value: '20 Benches Installed' }
        ]
    },
];

const getIcon = (category: EventCategory) => {
    switch (category) {
        case 'sports': return <Trophy />;
        case 'evangelism': return <Heart />;
        case 'international': return <Globe />;
        case 'finance': return <DollarSign />;
        case 'admin': return <Megaphone />;
        case 'social': return <Users />;
        default: return <Calendar />;
    }
};

const Events = () => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const filteredEvents = EVENTS_DATA.filter(event => event.status === activeTab);

    return (
        <div className="events-page">
            <div className="events-header">
                <div>
                    <h2>Campus Events & News</h2>
                    <p>Stay updated with the latest announcements, activities, and reports from your Student Association leaders.</p>
                </div>
                <div className="events-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming Events
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past Reports & Results
                    </button>
                </div>
            </div>

            <div className="events-grid">
                {filteredEvents.map(event => (
                    <div key={event.id} className="event-card">
                        <div className="event-header-image">
                            <span className={`event-overlay-badge badge-${event.status}`}>
                                {event.status === 'upcoming' ? 'Coming Soon' : 'Completed'}
                            </span>
                            <div className="category-icon">
                                {getIcon(event.category)}
                            </div>
                        </div>

                        <div className="event-content">
                            <div className="event-organizer">
                                {event.organizer}
                            </div>
                            <h3 className="event-title">{event.title}</h3>

                            <div className="event-meta">
                                <div className="meta-item">
                                    <Calendar size={16} />
                                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                {event.time && (
                                    <div className="meta-item">
                                        <Clock size={16} />
                                        <span>{event.time}</span>
                                    </div>
                                )}
                                {event.location && (
                                    <div className="meta-item">
                                        <MapPin size={16} />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className="event-description">
                                {event.description}
                            </div>

                            {/* Special Highlights for Finance/Results */}
                            {event.highlights && (
                                <div style={{ marginTop: 'auto' }}>
                                    {event.highlights.map((h, idx) => (
                                        <div key={idx} className="finance-highlight">
                                            <h4>{h.label}</h4>
                                            <p>{h.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {event.status === 'upcoming' && (
                                <div className="event-footer">
                                    <button
                                        style={{
                                            color: 'var(--primary)',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        More Details <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Events;
