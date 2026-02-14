import React from 'react';
import { Calendar as CalendarIcon, Users, DollarSign, Vote, ArrowRight, FileText } from 'lucide-react';
import './StudentDashboard.css';

interface StudentDashboardProps {
    navigateTo?: (page: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ navigateTo }) => {

    // Fallback if navigateTo is not provided
    const handleNavigate = (page: string) => {
        if (navigateTo) {
            navigateTo(page);
        } else {
            console.log(`Navigating to ${page}`);
        }
    };

    return (
        <div className="student-dashboard">
            <div className="quick-stats-row">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="stat-label">Attendance Rate</div>
                        <div className="stat-value">95% <span className="trend-up">↑</span></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper gold">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="stat-label">AUCASA Fee</div>
                        <div className="stat-sub">PAID</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <div className="stat-label">Upcoming Events</div>
                        <div className="stat-value">2</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-split">
                {/* Quick Actions / Featured Navigation */}
                <div className="dash-card">
                    <h3 className="dash-card-title">Quick Actions</h3>
                    <p className="section-desc">Access key features and services instantly.</p>

                    <div className="quick-actions-grid">
                        <div className="action-card" onClick={() => handleNavigate('elections')}>
                            <div className="action-icon blue">
                                <Vote size={28} />
                            </div>
                            <div className="action-content">
                                <h4>Vote Now</h4>
                                <p>Participate in ongoing student elections.</p>
                            </div>
                            <div className="action-arrow">
                                <ArrowRight size={20} />
                            </div>
                        </div>

                        <div className="action-card" onClick={() => handleNavigate('payments')}>
                            <div className="action-icon gold">
                                <DollarSign size={28} />
                            </div>
                            <div className="action-content">
                                <h4>Make Payment</h4>
                                <p>Settle tuition and association fees securely.</p>
                            </div>
                            <div className="action-arrow">
                                <ArrowRight size={20} />
                            </div>
                        </div>

                        <div className="action-card" onClick={() => handleNavigate('events')}>
                            <div className="action-icon green">
                                <CalendarIcon size={28} />
                            </div>
                            <div className="action-content">
                                <h4>View Events</h4>
                                <p>Check out upcoming campus activities.</p>
                            </div>
                            <div className="action-arrow">
                                <ArrowRight size={20} />
                            </div>
                        </div>

                        <div className="action-card" onClick={() => handleNavigate('registration')}>
                            <div className="action-icon purple">
                                <FileText size={28} />
                            </div>
                            <div className="action-content">
                                <h4>Registration Info</h4>
                                <p>Verify your semester registration status.</p>
                            </div>
                            <div className="action-arrow">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Announcements */}
                <div className="dash-card">
                    <h3 className="dash-card-title">Announcements</h3>

                    <div className="announcement-item">
                        <div>
                            <div className="announcement-title">General Assembly - Oct 26</div>
                            <div className="announcement-sub">Sports Tryouts - Nov 1</div>
                        </div>
                        <CalendarIcon size={20} className="text-secondary" />
                    </div>

                    {/* Simple Calendar Mockup */}
                    <div className="calendar-header">
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
