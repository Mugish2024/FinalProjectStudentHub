import React from 'react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import './Landing.css';

interface LandingProps {
    onEnter: () => void;
    onNavigate: (page: string, topic?: string) => void;
}

type NavTarget = {
    label: string;
    page: string;
};

type EditorialCard = {
    tag: string;
    title: string;
    body: string;
    topic: string;
    items: string[];
    className?: string;
};

type FooterColumn = {
    title: string;
    items: Array<
        | { type: 'button'; label: string; page?: string; action?: 'enter' }
        | { type: 'text'; label: string }
    >;
};

type SignalPath = {
    className: string;
    radius: number;
    duration: string;
    path: string;
    begin?: string;
};

const navItems: NavTarget[] = [
    { label: 'Home', page: 'landing' },
    { label: 'About ', page: 'about' },
    { label: 'Contact', page: 'contact' },
];

const haloNodes = [
    { cx: 76, cy: 214, r: 6 },
    { cx: 182, cy: 126, r: 7 },
    { cx: 342, cy: 338, r: 8 },
    { cx: 516, cy: 262, r: 13 },
    { cx: 610, cy: 322, r: 10 },
    { cx: 735, cy: 282, r: 14 },
    { cx: 872, cy: 330, r: 16 },
    { cx: 950, cy: 242, r: 15 },
    { cx: 1045, cy: 170, r: 12 },
    { cx: 1090, cy: 80, r: 15 },
];

const networkLines = [
    [0, 374, 76, 338],
    [76, 338, 138, 410],
    [138, 410, 222, 386],
    [222, 386, 306, 438],
    [306, 438, 382, 388],
    [382, 388, 468, 430],
    [468, 430, 548, 388],
    [548, 388, 632, 446],
    [632, 446, 720, 392],
    [720, 392, 802, 448],
    [802, 448, 888, 400],
    [888, 400, 984, 430],
    [984, 430, 1084, 392],
    [138, 410, 188, 292],
    [188, 292, 306, 438],
    [222, 386, 342, 322],
    [342, 322, 382, 388],
    [382, 388, 516, 300],
    [516, 300, 548, 388],
    [548, 388, 676, 306],
    [676, 306, 720, 392],
    [720, 392, 820, 286],
    [820, 286, 888, 400],
    [888, 400, 950, 242],
    [950, 242, 984, 430],
    [984, 430, 1050, 310],
    [1050, 310, 1084, 392],
    [676, 306, 820, 286],
    [820, 286, 950, 242],
    [950, 242, 1050, 310],
    [950, 242, 1045, 170],
    [1045, 170, 1090, 80],
    [1045, 170, 1114, 206],
    [1050, 310, 1114, 206],
    [984, 430, 1110, 480],
    [888, 400, 930, 520],
    [802, 448, 930, 520],
    [720, 392, 676, 514],
    [632, 446, 676, 514],
    [468, 430, 418, 522],
    [306, 438, 278, 528],
    [138, 410, 88, 520],
];

const lowerSignalPath =
    'M138 410 L222 386 L306 438 L382 388 L468 430 L548 388 L632 446 L720 392 L802 448 L888 400 L984 430 L1084 392';

const upperSignalPath =
    'M342 322 L382 388 L516 300 L548 388 L676 306 L820 286 L950 242 L1045 170 L1090 80';

const edgeSignalPath =
    'M950 242 L1050 310 L1114 206 L1045 170 L950 242 L984 430 L1110 480';

const signalPaths: SignalPath[] = [
    { className: 'signal-dot head', radius: 6, duration: '7.5s', path: lowerSignalPath },
    { className: 'signal-dot body', radius: 4.4, duration: '7.5s', path: lowerSignalPath, begin: '0.25s' },
    { className: 'signal-dot tail', radius: 3, duration: '7.5s', path: lowerSignalPath, begin: '0.5s' },
    { className: 'signal-dot head', radius: 5.4, duration: '8.8s', path: upperSignalPath, begin: '1.5s' },
    { className: 'signal-dot body', radius: 3.8, duration: '8.8s', path: upperSignalPath, begin: '1.8s' },
    { className: 'signal-dot head', radius: 5.2, duration: '7s', path: edgeSignalPath, begin: '3.2s' },
];

const networkNodes = [
    { cx: 0, cy: 374, r: 4 },
    { cx: 76, cy: 338, r: 4.6 },
    { cx: 138, cy: 410, r: 5.4 },
    { cx: 188, cy: 292, r: 5.2 },
    { cx: 222, cy: 386, r: 5 },
    { cx: 306, cy: 438, r: 5.2 },
    { cx: 342, cy: 322, r: 4.7 },
    { cx: 382, cy: 388, r: 5.6 },
    { cx: 468, cy: 430, r: 5 },
    { cx: 516, cy: 300, r: 5.4 },
    { cx: 548, cy: 388, r: 5.2 },
    { cx: 632, cy: 446, r: 5.6 },
    { cx: 676, cy: 306, r: 5.4 },
    { cx: 720, cy: 392, r: 5.8 },
    { cx: 802, cy: 448, r: 5.4 },
    { cx: 820, cy: 286, r: 5.8 },
    { cx: 888, cy: 400, r: 6.2 },
    { cx: 950, cy: 242, r: 6 },
    { cx: 984, cy: 430, r: 6.4 },
    { cx: 1045, cy: 170, r: 5.2 },
    { cx: 1050, cy: 310, r: 6 },
    { cx: 1084, cy: 392, r: 5.8 },
    { cx: 1090, cy: 80, r: 6.8 },
    { cx: 1114, cy: 206, r: 5.5 },
    { cx: 1110, cy: 480, r: 5.5 },
    { cx: 930, cy: 520, r: 4.8 },
    { cx: 676, cy: 514, r: 4.8 },
    { cx: 418, cy: 522, r: 4.6 },
    { cx: 278, cy: 528, r: 4.5 },
    { cx: 88, cy: 520, r: 4.3 },
];

const signalMessages = [
    { className: 'signal-message m1', text: 'Pay association fees with confidence.' },
    { className: 'signal-message m2', text: 'Check in fast and stay counted.' },
    { className: 'signal-message m3', text: 'Find support before stress builds.' },
];

const editorialCards: EditorialCard[] = [
    {
        tag: 'Payments',
        title: 'Complete student association fees payments with guided steps and verified receipts',
        body: 'From payment initiation to receipt validation, every stage is transparent, timestamped, and easy to follow for both students and finance teams.',
        topic: 'payments',
        className: 'payments-card',
        items: [
            'Real-time payment status updates',
            'Receipt upload with verification workflow',
            'Clear payment history for each student account',
        ],
    },
    {
        tag: 'Attendance',
        title: 'Stay aligned with live sessions, QR check-in',
        body: 'Students check in quickly while leadership tracks attendance with trusted session controls, live metrics, and downloadable daily reporting.',
        topic: 'attendance',
        items: [
            'Active session control and QR issuance',
            'Present-student listings with pagination',
            'One-click PDF reports for daily summaries',
        ],
    },
    {
        tag: 'Student Services',
        title: 'Resolve issues, track support requests, and move academic tasks forward',
        body: 'One place for registration management, discipline visibility, announcements, and practical student support that reduces delays.',
        topic: 'services',
        items: [
            'Structured support and follow-up flow',
            'Registration and profile lifecycle tools',
            'Centralized updates across key services',
        ],
    },
];

const footerColumns: FooterColumn[] = [
    {
        title: 'Explore',
        items: [
            { type: 'button', label: 'Home', page: 'landing' },
            { type: 'button', label: 'About', page: 'about' },
            { type: 'button', label: 'Contact', page: 'contact' },
            { type: 'button', label: 'Sign In', action: 'enter' },
        ],
    },
    {
        title: 'Services',
        items: [
            { type: 'text', label: 'Association payments' },
            { type: 'text', label: 'Attendance check-in' },
            { type: 'text', label: 'Support requests' },
            { type: 'text', label: 'Student reports' },
        ],
    },
];

const renderLogo = (logoClassName?: string) => (
    <img src="/AucaLogo.png" alt="AUCA logo" className={logoClassName} />
);

const Landing: React.FC<LandingProps> = ({ onEnter, onNavigate }) => {
    const handleFooterAction = (item: FooterColumn['items'][number]) => {
        if (item.type !== 'button') {
            return;
        }

        if (item.action === 'enter') {
            onEnter();
            return;
        }

        if (item.page) {
            onNavigate(item.page);
        }
    };

    return (
        <div className="landing-exact">
            <header className="landing-exact-nav">
                <div className="landing-exact-nav-inner">
                    <button type="button" className="exact-brand" onClick={() => onNavigate('landing')}>
                        <span className="brand-icon">{renderLogo('brand-logo')}</span>
                        <span className="brand-text-block">
                            <small>Adventist University of Central Africa</small>
                        </span>
                    </button>

                    <nav className="exact-links">
                        {navItems.map((item) => (
                            <button type="button" key={item.page} onClick={() => onNavigate(item.page)}>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="exact-actions">
                        <button type="button" className="btn-signin" onClick={onEnter}>Sign In</button>
                    </div>
                </div>
            </header>

            <main className="landing-exact-hero">
                <section className="exact-copy">
                    <div className="exact-badge">STUDENTHUB</div>
                    <h1>
                        AUCA
                        <br />
                        STUDENT
                        <br />
                        ASSOCIATION
                    </h1>
                    <div className="exact-line" />
                    <p>
                        Manage student association services in one place: pay fees, track finance
                        updates, request support, and access trusted campus tools with full
                        transparency and accountability.
                    </p>
                    <div className="exact-cta-row">
                        <button type="button" className="btn-apply" onClick={onEnter}>
                            Get Started <ArrowRight size={16} />
                        </button>
                        <button type="button" className="btn-learn" onClick={() => onNavigate('about')}>
                            Learn More <ArrowRight size={16} />
                        </button>
                    </div>
                </section>

                <section className="exact-visual">
                    <div className="network-visual" aria-label="Network visual">
                        <svg viewBox="0 0 1120 560" role="img" aria-label="Connected network">
                            <g className="diagram-halos">
                                {haloNodes.map((node) => (
                                    <circle key={`${node.cx}-${node.cy}`} cx={node.cx} cy={node.cy} r={node.r} />
                                ))}
                            </g>
                            <g className="net-lines">
                                {networkLines.map(([x1, y1, x2, y2]) => (
                                    <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
                                ))}
                            </g>
                            <g className="net-signals" aria-hidden="true">
                                {signalPaths.map((signal, index) => (
                                    <circle className={signal.className} r={signal.radius} key={`${signal.path}-${index}`}>
                                        <animateMotion
                                            begin={signal.begin}
                                            dur={signal.duration}
                                            path={signal.path}
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                ))}
                            </g>
                            <g className="net-nodes">
                                {networkNodes.map((node) => (
                                    <circle key={`${node.cx}-${node.cy}`} cx={node.cx} cy={node.cy} r={node.r} />
                                ))}
                            </g>
                        </svg>
                        {signalMessages.map((message) => (
                            <div className={message.className} key={message.className}>
                                {message.text}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <section className="landing-editorial">
                <div className="editorial-inner">
                    <div className="editorial-head">
                        <p>Inside StudentHub</p>
                        <h2>Everything a student needs, arranged with clarity</h2>
                    </div>
                    <div className="editorial-grid">
                        {editorialCards.map((card) => (
                            <article className={['editorial-card', card.className].filter(Boolean).join(' ')} key={card.tag}>
                                <span className="card-tag">{card.tag}</span>
                                <h3>{card.title}</h3>
                                <p>{card.body}</p>
                                <ul>
                                    {card.items.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <button type="button" className="footer-logo-row" onClick={() => onNavigate('landing')}>
                            {renderLogo()}
                            <span>
                                <small>AUCA</small>
                                <strong>StudentHub</strong>
                            </span>
                        </button>
                        <p>
                            A trusted portal for student association payments, attendance,
                            services, and campus communication.
                        </p>
                    </div>

                    {footerColumns.map((column) => (
                        <div className="footer-column" key={column.title}>
                            <h4>{column.title}</h4>
                            {column.items.map((item) => (
                                item.type === 'button' ? (
                                    <button type="button" key={item.label} onClick={() => handleFooterAction(item)}>
                                        {item.label}
                                    </button>
                                ) : (
                                    <span key={item.label}>{item.label}</span>
                                )
                            ))}
                        </div>
                    ))}

                    <div className="footer-column footer-contact">
                        <h4>Contact</h4>
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Adventist%20University%20of%20Central%20Africa%20Masoro%20Campus%20Gasabo%20District%20Kigali%20Rwanda"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <MapPin size={16} /> Masoro Campus, Gasabo District, Kigali
                        </a>
                        <span><Mail size={16} /> studenthub@auca.ac.rw</span>
                        <span><Phone size={16} /> +250 788 000 000</span>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>&copy; {new Date().getFullYear()} AUCA StudentHub. All rights reserved.</span>
                    <span>Built for transparent student services.</span>
                </div>
            </footer>
        </div>
    );
};

export default Landing;

