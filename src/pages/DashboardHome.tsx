import React from 'react';
import { Users, Calendar, DollarSign, UserPlus } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import RecentActivity from '../components/RecentActivity';
import MemberGrowthChart from '../components/MemberGrowthChart';
import './DashboardHome.css';

const DashboardHome: React.FC = () => {
    return (
        <div className="flex flex-col">
            {/* Metrics Row */}
            <div className="dashboard-grid-metrics">
                <MetricCard
                    label="Total Members"
                    value="1,248"
                    icon={Users}
                    trend="12%"
                    trendType="up"
                    color="#2F4F86"
                />
                <MetricCard
                    label="Active Events"
                    value="8"
                    icon={Calendar}
                    trend="2"
                    trendType="up"
                    color="#2F4F86"
                />
                <MetricCard
                    label="Total Contributions"
                    value="$12,450"
                    icon={DollarSign}
                    trend="5%"
                    trendType="down"
                    color="#2F4F86"
                />
                <MetricCard
                    label="Pending Requests"
                    value="24"
                    icon={UserPlus}
                    color="#2F4F86"
                />
            </div>

            {/* Charts & Tables Row */}
            <div className="dashboard-grid-content">
                {/* Chart takes up space */}
                <div style={{ minHeight: '400px' }}>
                    <MemberGrowthChart />
                </div>

                {/* Activity Table */}
                <div style={{ minHeight: '400px' }}>
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
