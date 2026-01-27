import React from 'react';
import './RecentActivity.css';

interface ActivityItem {
    id: string;
    user: string;
    action: string;
    date: string;
    status: 'completed' | 'pending' | 'new';
    amount?: string;
}

const RecentActivity: React.FC = () => {
    const activities: ActivityItem[] = [
        { id: '1', user: 'Alice Smith', action: 'Membership Renewal', date: '2 mins ago', status: 'completed', amount: '$45.00' },
        { id: '2', user: 'Bob Jones', action: 'Event Registration', date: '1 hour ago', status: 'new', amount: '$15.00' },
        { id: '3', user: 'Charlie Brown', action: 'New Member Signup', date: '3 hours ago', status: 'pending' },
        { id: '4', user: 'Diana Prince', action: 'Donation', date: '5 hours ago', status: 'completed', amount: '$100.00' },
        { id: '5', user: 'Evan Wright', action: 'Event Registration', date: '1 day ago', status: 'completed', amount: '$15.00' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="status-badge status-success">Completed</span>;
            case 'pending': return <span className="status-badge status-warning">Pending</span>;
            case 'new': return <span className="status-badge status-info">New</span>;
            default: return null;
        }
    };

    return (
        <div className="activity-card">
            <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                <button className="view-all-btn">View All</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="activity-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Action</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar-sm">
                                            {item.user.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="font-bold">{item.user}</span>
                                    </div>
                                </td>
                                <td>{item.action}</td>
                                <td className="text-secondary">{item.date}</td>
                                <td>{getStatusBadge(item.status)}</td>
                                <td className="font-bold">{item.amount || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentActivity;
