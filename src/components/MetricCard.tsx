import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './MetricCard.css';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    icon: Icon,
    trend,
    trendType = 'neutral',
    color = 'var(--primary)'
}) => {
    const trendLabel = trendType === 'up' ? 'Up' : trendType === 'down' ? 'Down' : 'No change';

    return (
        <div className="metric-card">
            <div className="metric-header">
                <div>
                    <h3 className="metric-label">{label}</h3>
                    <div className="metric-value">{value}</div>
                </div>
                <div
                    className="metric-icon-wrapper"
                    style={{
                        backgroundColor: `${color}15`,
                        color: color
                    }}
                >
                    <Icon size={24} />
                </div>
            </div>

            {trend && (
                <div className="metric-footer">
                    <span className={`trend-${trendType} font-bold`}>
                        {trendLabel}: {trend}
                    </span>
                    <span className="text-secondary">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
