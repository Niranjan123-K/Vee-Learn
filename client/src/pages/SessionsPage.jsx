import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Clock, MessageSquare, Check, X, Pencil, ArrowRight, Activity, AlertCircle, User, Search, Award } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { getInitials } from '../utils/formatters';
import './SessionsPage.css';

// Structured Timeline Component
const SessionTimeline = ({ session }) => {
  const { status, meeting_link, teacher_completion_confirmed, learner_completion_confirmed } = session;
  const hasLink = !!meeting_link;
  const awaitingConfirmation = status === 'confirmed' && (teacher_completion_confirmed || learner_completion_confirmed);

  const steps = [
    { label: 'Requested', completed: true },
    { label: 'Confirmed', completed: ['confirmed', 'completed'].includes(status) },
    { label: 'Link Added', completed: ['completed'].includes(status) || (status === 'confirmed' && hasLink) },
    { label: 'Completed', completed: status === 'completed', active: awaitingConfirmation }
  ];

  if (status === 'cancelled') {
    return (
      <div className="session-timeline cancelled" style={{ justifyContent: 'flex-start', padding: '8px 0' }}>
        <div className="timeline-step">
          <div className="timeline-dot error" style={{ margin: 0 }} />
          <span className="timeline-label text-danger" style={{ textAlign: 'left', marginTop: '6px', fontSize: '13px' }}>
            Session Cancelled
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="session-timeline">
      {steps.map((step, i) => (
        <div key={step.label} className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
          <div className="timeline-dot-wrapper">
            <div className="timeline-dot" />
            {i < steps.length - 1 && <div className="timeline-line" />}
          </div>
          <span className="timeline-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function SessionsPage() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const socket = useChatStore((s) => s.socket);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Time tracker for real-time countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchSessions();

    if (socket) {
      const handleUpdate = () => fetchSessions();
      socket.on('session_update', handleUpdate);
      return () => socket.off('session_update', handleUpdate);
    }
  }, [socket]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'confirm') {
        if (!window.confirm('Are you sure you want to confirm this session? A Jitsi room will be auto-generated.')) return;
      } else if (action === 'cancel') {
        if (!window.confirm('Are you sure you want to cancel this session?')) return;
      }

      await api.put(`/sessions/${id}/${action}`);
      await fetchSessions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to ${action} session`);
    }
  };

  const handleJoin = async (id) => {
    try {
      const res = await api.get(`/sessions/${id}/join`);
      if (res.data.joinUrl) {
        window.open(res.data.joinUrl, '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot join session at this time.');
    }
  };

  const renderCountdown = (scheduledAtStr, durationMins = 60) => {
    const scheduledAt = new Date(scheduledAtStr);
    const endAt = new Date(scheduledAt.getTime() + durationMins * 60000);
    const diffMs = scheduledAt - currentTime;
<<<<<<< Updated upstream
    
    if (diffMs <= 0) return <span style={{ fontWeight: 700 }}>In Progress</span>;
    
=======

    if (currentTime > endAt) return <span className="text-danger" style={{ fontWeight: 600 }}>Expired</span>;
    if (diffMs <= 0) return <span className="text-success" style={{ fontWeight: 600 }}>In Progress</span>;

>>>>>>> Stashed changes
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    }

    if (hours > 0) return `Starts in ${hours}h ${mins}m`;
    return `Starts in ${mins}m`;
  };

  const isMeetingReady = (scheduledAtStr) => {
    const scheduledAt = new Date(scheduledAtStr);
    const fifteenMinsBefore = new Date(scheduledAt.getTime() - 15 * 60000);
    return currentTime >= fifteenMinsBefore;
  };

  const isMeetingPassed = (scheduledAtStr, durationMins) => {
    const endAt = new Date(new Date(scheduledAtStr).getTime() + (durationMins || 60) * 60000);
    return currentTime > endAt;
  };

  const upcomingSessions = sessions.filter(s => ['pending', 'confirmed'].includes(s.status));
  const pastSessions = sessions.filter(s => ['completed', 'cancelled'].includes(s.status));

  const filteredSessions = (activeTab === 'upcoming' ? upcomingSessions : pastSessions).filter(s => {
    const partnerName = s.teacher_id === user?.id ? s.learner_name : s.teacher_name;
<<<<<<< Updated upstream
    return (partnerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
           (s.skill_name || '').toLowerCase().includes(searchQuery.toLowerCase());
=======
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
>>>>>>> Stashed changes
  });

  return (
    <div className="page-container fade-in">
      <PageHeader
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Sessions' }]}
        title="My Sessions"
        description="View and coordinate your learning appointments, video classrooms, and session timeline."
      />

<<<<<<< Updated upstream
      {/* Structured Filter & Search Strip */}
      <div className="sessions-filter-card">
        <div className="sessions-filter-pills">
          <button 
            className={`session-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Sessions ({upcomingSessions.length})
          </button>
          <button 
            className={`session-pill ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Session History ({pastSessions.length})
          </button>
        </div>
        
        <div className="sessions-search-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="sessions-search-input" 
            placeholder="Search by topic or teacher name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
=======
      <div className="card mb-xl">
        <div className="card-body" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div className="tabs" style={{ borderBottom: 'none' }}>
            <button
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
              style={{ padding: '4px 12px', fontSize: 'var(--font-xs)' }}
            >
              Upcoming ({upcomingSessions.length})
            </button>
            <button
              className={`tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
              style={{ padding: '4px 12px', fontSize: 'var(--font-xs)' }}
            >
              History ({pastSessions.length})
            </button>
          </div>

          <div className="search-input-wrapper" style={{ width: '240px' }}>
            <Search size={14} className="search-icon" style={{ left: '12px' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search sessions..."
              style={{ paddingLeft: '32px', fontSize: 'var(--font-xs)', padding: '6px 32px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
>>>>>>> Stashed changes
        </div>
      </div>

      {/* Structured Session Cards Grid */}
      {loading ? (
        <div className="sessions-list">
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="sessions-list">
          {filteredSessions.map(session => {
            const isTeacher = session.teacher_id === user?.id;
            const partnerName = isTeacher ? session.learner_name : session.teacher_name;
            const partnerAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;
            const isReady = isMeetingReady(session.scheduled_at);
            const isPassed = isMeetingPassed(session.scheduled_at, session.duration_minutes);
<<<<<<< Updated upstream
            const costCredits = Math.ceil(session.duration_minutes / 60);
            
            return (
              <div key={session.id} className="structured-session-card">
                
                {/* 1. Header Tier: Who & What */}
                <div className="session-card-header">
                  <div className="session-header-left">
=======

            return (
              <div key={session.id} className="card session-card">

                {/* 1. Participant */}
                <div className="session-section participant-section">
                  <div className="avatar-wrapper">
>>>>>>> Stashed changes
                    {partnerAvatar ? (
                      <img src={`http://localhost:5000${partnerAvatar}`} alt={partnerName} className="avatar avatar-lg" />
                    ) : (
                      <div className="avatar-fallback avatar-lg">{getInitials(partnerName)}</div>
                    )}
                    
                    <div className="session-header-info">
                      <div className="session-title-row">
                        <h3 className="session-skill">{session.skill_name}</h3>
                        <span className="badge badge-default" style={{ fontSize: '11px' }}>
                          You are the {isTeacher ? 'Teacher' : 'Learner'}
                        </span>
                      </div>
                      <p className="session-partner-name">
                        with <strong style={{ color: 'var(--text-primary)' }}>{partnerName}</strong>
                      </p>
                    </div>
                  </div>
<<<<<<< Updated upstream
                  
                  <div className="session-header-right">
                    <div className="session-cost-badge">
                      <Award size={16} />
                      {costCredits} {costCredits > 1 ? 'Credits' : 'Credit'}
                    </div>
                    {session.status === 'confirmed' && (
                      <div className="countdown-pill">
                        <Activity size={15} style={{ marginRight: '6px' }} />
                        {renderCountdown(session.scheduled_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Middle Tier: Logistics + Lifecycle Timeline */}
                <div className="session-info-strip">
                  <div className="session-logistics-box">
                    <div className="logistics-item">
                      <Calendar size={18} className="icon" />
                      <span>{new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="logistics-item">
                      <Clock size={18} className="icon" />
                      <span>{new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes} mins)</span>
                    </div>
                  </div>
                  
                  <div className="session-timeline-box">
                    <span className="timeline-title">Session Lifecycle Status</span>
                    <SessionTimeline session={session} />
                  </div>
                </div>

                {/* 3. Footer Tier: Actions */}
                <div className="session-card-footer">
                  <div className="session-footer-left">
                    <button 
                      className="btn-ghost btn-sm"
                      style={{ padding: '6px 12px' }}
                      onClick={() => navigate(`/profile/${isTeacher ? session.learner_id : session.teacher_id}`)}
                    >
                      <User size={15} /> View Profile
                    </button>
                    {isTeacher && session.meeting_link && (
                      <button className="btn-ghost btn-sm" style={{ padding: '6px 12px' }} onClick={() => handleAction(session.id, 'confirm')}>
                        <Pencil size={15} /> Edit Meeting Link
                      </button>
                    )}
                  </div>
                  
                  <div className="session-footer-right">
                    {['pending', 'confirmed'].includes(session.status) && (
                      <button 
                        className="btn-ghost btn-sm text-danger" 
                        style={{ padding: '6px 14px' }}
                        onClick={() => handleAction(session.id, 'cancel')}
                      >
                        <X size={15} /> Cancel Session
                      </button>
                    )}

                    {session.status === 'pending' && isTeacher && (
                      <button className="btn-success btn-sm" style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 600 }} onClick={() => handleAction(session.id, 'confirm')}>
                        <Check size={18} /> Confirm Request
                      </button>
                    )}
                    
                    {session.status === 'confirmed' && (
                      <>
                        <button className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 600 }} onClick={() => navigate(`/sessions/${session.id}/chat`)}>
                          <MessageSquare size={16} /> Open Workspace
                        </button>
                        
                        {session.meeting_link ? (
                          <a 
                            href={session.meeting_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`btn-action-join ${(!isReady || isPassed) ? 'disabled' : ''}`}
                            onClick={(e) => {
                              if (!isReady || isPassed) {
                                e.preventDefault();
                                alert('Meeting room open 10 minutes before session start.');
                              }
                            }}
                          >
                            <Video size={18} /> Join Meeting Room
                          </a>
                        ) : isTeacher ? (
                          <button className="btn-action-join" onClick={() => handleAction(session.id, 'confirm')}>
                            <AlertCircle size={18} /> Add Meeting Link
                          </button>
                        ) : (
                          <span className="badge badge-default" style={{ padding: '10px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '13px' }}>
                            Awaiting Teacher's Link
                          </span>
                        )}
                      </>
                    )}
                    
                    {session.status === 'completed' && (
                      <button className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 600 }} onClick={() => navigate(`/sessions/${session.id}/chat`)}>
                        View Chat & Workspace <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
=======
                  <div className="participant-info">
                    <h3 className="session-skill truncate">{session.skill_name}</h3>
                    <p className="session-partner truncate">with {partnerName}</p>
                    <button
                      className="btn-ghost btn-xs mt-sm"
                      onClick={() => navigate(`/profile/${isTeacher ? session.learner_id : session.teacher_id}`)}
                    >
                      <User size={12} /> View Profile
                    </button>
                  </div>
                </div>

                {/* 2. Logistics */}
                <div className="session-section logistics-section">
                  <div className="logistics-row">
                    <Calendar size={14} className="text-muted" />
                    <span>{new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="logistics-row">
                    <Clock size={14} className="text-muted" />
                    <span>{new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="logistics-row">
                    <Activity size={14} className="text-muted" />
                    <span>{session.duration_minutes} min</span>
                  </div>
                  <div className="logistics-row mt-sm">
                    <span className="text-xs text-secondary uppercase font-semibold">Cost</span>
                    <span className="text-warning font-semibold">{Math.ceil(session.duration_minutes / 60)} Credit{Math.ceil(session.duration_minutes / 60) > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* 3. Status Timeline */}
                <div className="session-section status-section">
                  <div className="status-header">
                    <span className="text-xs text-secondary uppercase font-semibold">Status Lifecycle</span>
                    {['pending', 'confirmed'].includes(session.status) && (
                      <span className="countdown-badge">{renderCountdown(session.scheduled_at, session.duration_minutes)}</span>
                    )}
                  </div>
                  <SessionTimeline session={session} />
                </div>

                {/* 4. Actions */}
                <div className="session-section actions-section">
                  {['pending', 'confirmed'].includes(session.status) && isPassed ? (
                    <div className="action-group" style={{ flexDirection: 'column', gap: '8px' }}>
                      <p className="text-muted text-sm text-center">Session timeframe has passed.</p>
                      <button className="btn-secondary w-full" onClick={() => navigate(`/messages/${session.id}`)}>
                        <MessageSquare size={16} /> Open Workspace
                      </button>
                    </div>
                  ) : (
                    <>
                      {session.status === 'pending' && isTeacher && (
                        <button className="btn-success w-full" onClick={() => handleAction(session.id, 'confirm')}>
                          <Check size={16} /> Confirm Request
                        </button>
                      )}

                      {session.status === 'confirmed' && (
                        <div className="action-group">
                          <button
                            className={`btn-primary w-full ${!isReady ? 'disabled' : ''}`}
                            onClick={(e) => {
                              if (!isReady) e.preventDefault();
                              else handleJoin(session.id);
                            }}
                          >
                            <Video size={16} /> {isReady ? 'Join Meeting' : 'Join available 15m before'}
                          </button>

                          <button className="btn-secondary w-full" onClick={() => navigate(`/messages/${session.id}`)}>
                            <MessageSquare size={16} /> Open Workspace
                          </button>
                        </div>
                      )}

                      {['pending', 'confirmed'].includes(session.status) && (
                        <button className="btn-ghost btn-xs cancel-btn" onClick={() => handleAction(session.id, 'cancel')}>
                          <X size={14} /> Cancel Session
                        </button>
                      )}
                    </>
                  )}

                  {session.status === 'completed' && (
                    <button className="btn-secondary w-full" onClick={() => navigate(`/messages/${session.id}`)}>
                      View Workspace <ArrowRight size={14} />
                    </button>
                  )}
>>>>>>> Stashed changes
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'upcoming' ? 'No upcoming sessions found' : 'No past session history'}
          description={activeTab === 'upcoming' ? "You don't have any scheduled sessions or pending requests at the moment." : "You haven't completed or cancelled any sessions yet."}
          action={activeTab === 'upcoming' ? { label: 'Explore Teachers & Schedule Class', to: '/explore' } : undefined}
        />
      )}
    </div>
  );
}
