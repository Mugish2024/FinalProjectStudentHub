import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './RecentActivity.css'; // Reusing card styles

const data = [
    { name: 'Jan', members: 400 },
    { name: 'Feb', members: 450 },
    { name: 'Mar', members: 520 },
    { name: 'Apr', members: 610 },
    { name: 'May', members: 780 },
    { name: 'Jun', members: 900 },
    { name: 'Jul', members: 950 },
];

const MemberGrowthChart: React.FC = () => {
    return (
        <div className="activity-card" style={{ padding: 0 }}>
            <div className="card-header">
                <h3 className="card-title">Member Growth</h3>
                <select style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    <option>Last 6 Months</option>
                    <option>Last Year</option>
                </select>
            </div>
            <div style={{ height: 300, padding: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2F4F86" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2F4F86" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Area type="monotone" dataKey="members" stroke="#2F4F86" strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MemberGrowthChart;
