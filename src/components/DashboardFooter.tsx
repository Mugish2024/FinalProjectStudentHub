import './DashboardFooter.css';

interface DashboardFooterProps {
    variant?: 'finance' | 'default';
    userName?: string;
}

const DashboardFooter = ({ variant = 'default' }: DashboardFooterProps) => {
    const year = new Date().getFullYear();

    return (
        <footer className={`dashboard-footer ${variant === 'finance' ? 'dashboard-footer--finance' : ''}`}>
            <span>&copy; {year} AUCA StudentHub</span>
            <span className="dashboard-footer__dot" aria-hidden="true" />
            <span>StudentHub Portal</span>
            <span className="dashboard-footer__dot" aria-hidden="true" />
            <span>Secure institutional access</span>
        </footer>
    );
};

export default DashboardFooter;
