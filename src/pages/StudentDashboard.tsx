import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './StudentDashboard.css';

const data = [
    { name: 'Week 1', hours: 12 },
    { name: 'Week 2', hours: 19 },
    { name: 'Week 3', hours: 30 },
    { name: 'Week 4', hours: 22 },
    { name: 'Week 5', hours: 35 },
];

const StudentDashboard: React.FC = () => {
    return (
        <div className="student-dashboard">
            <div className="quick-stats-row">
                <div className="stat-card-dark">
                    <div className="stat-label">Attendance Rate</div>
                    <div className="stat-value">95% ↑</div>
                </div>
                <div className="stat-card-dark">
                    <div className="stat-label">AUCASA Fee</div>
                    <div className="stat-sub">PAID</div>
                </div>
                <div className="stat-card-dark">
                    <div className="stat-label">Upcoming Events</div>
                    <div className="stat-value">2</div>
                </div>
            </div>

            <div className="dashboard-split">
                {/* Attendance History */}
                <div className="dash-card">
                    <h3 className="dash-card-title">Attendance History</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} barSize={30}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Bar dataKey="hours" fill="#dcb14a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Announcements */}
                <div className="dash-card">
                    <h3 className="dash-card-title">Announcements</h3>

                    <div className="announcement-item">
                        <div>
                            <div style={{ fontWeight: 600 }}>General Assembly - Oct 26</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Sports Tryouts - Nov 1</div>
                        </div>
                        <CalendarIcon size={20} color="#64748b" />
                    </div>

                    {/* Simple Calendar Mockup */}
                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                        <strong>October 2023</strong>
                    </div>
                    <div className="calendar-grid">
                        <div className="cal-head">S</div><div className="cal-head">M</div><div className="cal-head">T</div><div className="cal-head">W</div><div className="cal-head">T</div><div className="cal-head">F</div><div className="cal-head">S</div>

                        {/* Simple days */}
                        <div className="cal-day"></div><div className="cal-day"></div><div className="cal-day">1</div><div className="cal-day">2</div><div className="cal-day">3</div><div className="cal-day">4</div><div className="cal-day">5</div>
                        <div className="cal-day">6</div><div className="cal-day">7</div><div className="cal-day">8</div><div className="cal-day">9</div><div className="cal-day">10</div><div className="cal-day">11</div><div className="cal-day">12</div>
                        <div className="cal-day">13</div><div className="cal-day">14</div><div className="cal-day">15</div><div className="cal-day">16</div><div className="cal-day">17</div><div className="cal-day">18</div><div className="cal-day">19</div>
                        <div className="cal-day">20</div><div className="cal-day">21</div><div className="cal-day active">22</div><div className="cal-day">23</div><div className="cal-day">24</div><div className="cal-day">25</div><div className="cal-day">26</div>
                        <div className="cal-day">27</div><div className="cal-day">28</div><div className="cal-day">29</div><div className="cal-day">30</div><div className="cal-day">31</div>
                    </div>

                    <button className="view-all-btn-gold">View All Events</button>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
