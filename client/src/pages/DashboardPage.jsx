import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Clock, Calendar, Users, ChevronRight, Compass, ArrowRight, 
  Zap, CheckCircle, XCircle, MessageSquare, Star, BookOpen, 
  CalendarCheck, MessageCircle, Wallet, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/authStore';
import { getInitials } from '../utils/formatters';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import api from '../utils/api';
import './DashboardPage.css';

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [skillsRes, sessionsRes] = await Promise.all([
          api.get(`/skills/user/${user.id}`),
          api.get('/sessions')
        ]);
        setMySkills(skillsRes.data.skills || []);
        setSessions(sessionsRes.data.sessions || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchDashboardData();
  }, [user]);

  const tokens = user?.credit_balance || 0;
  
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalHours = completedSessions.length; 
  
  const recentActivity = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled').sort((a,b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt)).slice(0, 4);
  const pendingRequests = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'confirmed').sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  
  const today = new Date();
  const todaySessions = upcomingSessions.filter(s => {
    const d = new Date(s.scheduled_at);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const chatSessions = sessions.filter(s => ['confirmed'].includes(s.status));

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        variant="dashboard"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle="Here's what's happening today."
        rightContent={<div className="font-medium">{currentDate}</div>}
      />

      {loading ? (
        <div className="dashboard-grid">
           <div className="skeleton" style={{height: '140px', gridColumn: 'span 4'}} />
           <div className="skeleton" style={{height: '300px', gridColumn: 'span 2'}} />
           <div className="skeleton" style={{height: '300px', gridColumn: 'span 2'}} />
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* STATS ROW */}
          <div className="dash-stats-row fade-up-stagger stagger-1">
            <StatsCard icon={BookOpen} label="Hours Learned" value={totalHours} trend="up" trendValue="12" index={0} />
            <StatsCard icon={Wallet} label="Credits" value={tokens} trend="up" trendValue="5" index={1} />
            <StatsCard icon={CalendarCheck} label="Total Sessions" value={sessions.length} index={2} />
            <StatsCard icon={Star} label="Avg Rating" value={4.9} trend="up" trendValue="2" index={3} />
          </div>

          {/* PRIORITY 1: TODAY'S SESSION */}
          <div className="card fade-up-stagger stagger-2">
            <div className="card-header">
              <div className="card-header-left">
                <h3 className="card-header-title">
                  <Calendar size={20} className="text-primary" /> Today's Sessions
                </h3>
                <p className="card-header-subtitle">Your scheduled learning sessions for today.</p>
              </div>
              <Link to="/sessions" className="card-header-action">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="card-body">
              {todaySessions.length > 0 ? (
                <div className="dash-list">
                  {todaySessions.map(session => {
                    const isTeacher = session.teacher_id === user.id;
                    const partnerName = isTeacher ? session.learner_name : session.teacher_name;
                    const partnerAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;
                    
                    return (
                      <div key={session.id} className="dash-list-item" onClick={() => navigate(`/sessions/${session.id}/chat`)}>
                         <div className="dash-item-avatar">
                            {partnerAvatar ? <img src={`http://localhost:5000${partnerAvatar}`} alt={partnerName} className="avatar avatar-md" /> : <div className="avatar-fallback avatar-md">{getInitials(partnerName)}</div>}
                         </div>
                         <div className="dash-item-content">
                           <p className="dash-item-title">{session.skill_name}</p>
                           <p className="dash-item-desc">with {partnerName}</p>
                         </div>
                         <div className="dash-item-meta">
                           <p className="dash-item-time">{new Date(session.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-rich">
                  <div className="empty-state-icon">
                    <Calendar size={28} />
                  </div>
                  <h4 className="empty-state-title">No sessions today</h4>
                  <p className="empty-state-desc">Enjoy your free schedule.</p>
                  <button className="btn-primary" onClick={() => navigate('/explore')}>Explore teachers to book a new session</button>
                  <p className="empty-state-help">or continue browsing</p>
                </div>
              )}
            </div>
          </div>

          {/* MAIN TWO COLUMNS */}
          <div className="dash-main-cols">
            
            {/* LEFT COLUMN */}
            <div className="dash-col">
              
              {/* PRIORITY 2: Pending Requests */}
              <div className="card fade-up-stagger stagger-3">
                <div className="card-header">
                  <div className="card-header-left">
                    <h3 className="card-header-title">
                      <Clock size={20} className="text-warning" /> Pending Requests
                    </h3>
                    <p className="card-header-subtitle">Requests waiting for your response.</p>
                  </div>
                  <Link to="/sessions" className="card-header-action">View All <ArrowRight size={14} /></Link>
                </div>
                <div className="card-body">
                  {pendingRequests.length > 0 ? (
                    <div className="dash-list">
                      {pendingRequests.slice(0, 3).map(session => {
                        const isTeacher = session.teacher_id === user.id;
                        const partnerName = isTeacher ? session.learner_name : session.teacher_name;
                        
                        return (
                          <div key={session.id} className="dash-list-item" onClick={() => navigate('/sessions')}>
                             <div className="dash-item-icon">
                               <Clock size={18} className="text-warning" />
                             </div>
                             <div className="dash-item-content">
                               <p className="dash-item-title">{partnerName}</p>
                               <p className="dash-item-desc">{isTeacher ? `Requested ${session.skill_name}` : `Awaiting ${session.skill_name}`}</p>
                             </div>
                             <div className="dash-item-meta">
                               <p className="dash-item-time">Today</p>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted text-center p-md text-sm">You're all caught up!</p>
                  )}
                </div>
              </div>
              
              {/* PRIORITY 3: Recent Activity */}
              <div className="card fade-up-stagger stagger-4">
                <div className="card-header">
                  <div className="card-header-left">
                    <h3 className="card-header-title">
                      <Zap size={20} className="text-success" /> Recent Activity
                    </h3>
                    <p className="card-header-subtitle">Your latest learning activity.</p>
                  </div>
                  <Link to="/sessions" className="card-header-action">View All <ArrowRight size={14} /></Link>
                </div>
                <div className="card-body">
                  {recentActivity.length > 0 ? (
                    <div className="dash-list">
                      {recentActivity.slice(0, 3).map(session => {
                         const isCompleted = session.status === 'completed';
                         return (
                           <div key={session.id} className="dash-list-item">
                              <div className="dash-item-icon">
                                 {isCompleted ? <CheckCircle size={18} className="text-success" /> : <XCircle size={18} className="text-danger" />}
                              </div>
                              <div className="dash-item-content">
                                <p className="dash-item-title">{isCompleted ? 'Session Completed' : 'Session Cancelled'}</p>
                                <p className="dash-item-desc">{session.skill_name}</p>
                              </div>
                              <div className="dash-item-meta">
                                <p className="dash-item-date">{new Date(session.updated_at || session.updatedAt || session.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                              </div>
                           </div>
                         );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted text-center p-md text-sm">No recent activity.</p>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="dash-col">
              
              {/* PRIORITY 4: Quick Actions */}
              <div className="card fade-up-stagger stagger-5">
                <div className="card-header">
                  <div className="card-header-left">
                    <h3 className="card-header-title">
                      <Compass size={20} className="text-info" /> Quick Actions
                    </h3>
                    <p className="card-header-subtitle">Frequently used shortcuts.</p>
                  </div>
                </div>
                <div className="card-body card-body-compact">
                  <div className="quick-actions-grid">
                    
                    <div className="qa-tile" onClick={() => navigate('/explore')}>
                      <div className="qa-icon-wrapper text-accent">
                        <BookOpen size={20} />
                      </div>
                      <div className="qa-title">
                        Explore Skills <ArrowRight size={14} className="qa-arrow" />
                      </div>
                      <p className="qa-desc">Find experts to learn from</p>
                    </div>

                    <div className="qa-tile" onClick={() => navigate('/sessions')}>
                      <div className="qa-icon-wrapper text-success">
                        <Calendar size={20} />
                      </div>
                      <div className="qa-title">
                        Book Session <ArrowRight size={14} className="qa-arrow" />
                      </div>
                      <p className="qa-desc">Schedule a learning session</p>
                    </div>

                    <div className="qa-tile" onClick={() => navigate('/messages')}>
                      <div className="qa-icon-wrapper text-info">
                        <MessageCircle size={20} />
                      </div>
                      <div className="qa-title">
                        Messages <ArrowRight size={14} className="qa-arrow" />
                      </div>
                      <p className="qa-desc">Continue conversations</p>
                    </div>

                    <div className="qa-tile" onClick={() => navigate('/ledger')}>
                      <div className="qa-icon-wrapper text-warning">
                        <Wallet size={20} />
                      </div>
                      <div className="qa-title">
                        Ledger <ArrowRight size={14} className="qa-arrow" />
                      </div>
                      <p className="qa-desc">Track your credits</p>
                    </div>

                  </div>
                </div>
              </div>
              
              {/* Extra Active Conversations to maintain symmetry if needed */}
              <div className="card fade-up-stagger stagger-5" style={{animationDelay: '600ms'}}>
                <div className="card-header">
                  <div className="card-header-left">
                    <h3 className="card-header-title">
                      <MessageSquare size={20} className="text-info" /> Active Conversations
                    </h3>
                    <p className="card-header-subtitle">Your ongoing chats with peers.</p>
                  </div>
                  <Link to="/messages" className="card-header-action">View All <ArrowRight size={14} /></Link>
                </div>
                <div className="card-body">
                  {chatSessions.length > 0 ? (
                    <div className="dash-list">
                      {chatSessions.slice(0, 3).map(session => {
                        const isTeacher = session.teacher_id === user.id;
                        const partnerName = isTeacher ? session.learner_name : session.teacher_name;
                        const partnerAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;
                        
                        return (
                          <div key={session.id} className="dash-list-item" onClick={() => navigate(`/sessions/${session.id}/chat`)}>
                             <div className="dash-item-avatar">
                                {partnerAvatar ? <img src={`http://localhost:5000${partnerAvatar}`} alt={partnerName} className="avatar avatar-md" /> : <div className="avatar-fallback avatar-md">{getInitials(partnerName)}</div>}
                             </div>
                             <div className="dash-item-content">
                               <p className="dash-item-title">{partnerName}</p>
                               <p className="dash-item-desc">Active workspace for {session.skill_name}</p>
                             </div>
                             <div className="dash-item-meta">
                               <ArrowUpRight size={16} className="text-muted" />
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted text-center p-md text-sm">No active conversations</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
