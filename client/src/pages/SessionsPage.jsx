import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Clock, MessageSquare, Check, X, Pencil, ArrowRight, Activity, AlertCircle, User, Search } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import ConfirmSessionModal from '../components/ConfirmSessionModal';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { getInitials } from '../utils/formatters';
import './SessionsPage.css';

// Timeline Component
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
      <div className="session-timeline cancelled">
        <div className="timeline-step">
          <div className="timeline-dot error" />
          <span className="timeline-label text-danger">Cancelled</span>
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

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSessionId, setConfirmSessionId] = useState(null);

  // Time tracker for real-time countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
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
    if (action === 'confirm') {
      setConfirmSessionId(id);
      setShowConfirmModal(true);
      return;
    }

    try {
      if (action === 'cancel') {
        if (!window.confirm('Are you sure you want to cancel this session?')) return;
      }
      
      await api.put(`/sessions/${id}/${action}`);
      await fetchSessions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to ${action} session`);
    }
  };

  const renderCountdown = (scheduledAtStr) => {
    const scheduledAt = new Date(scheduledAtStr);
    const diffMs = scheduledAt - currentTime;
    
    if (diffMs <= 0) return <span className="text-success" style={{fontWeight: 600}}>In Progress</span>;
    
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
    const tenMinsBefore = new Date(scheduledAt.getTime() - 10 * 60000);
    return currentTime >= tenMinsBefore;
  };
  
  const isMeetingPassed = (scheduledAtStr, durationMins) => {
    const endAt = new Date(new Date(scheduledAtStr).getTime() + (durationMins || 60) * 60000);
    return currentTime > endAt;
  };

  const upcomingSessions = sessions.filter(s => ['pending', 'confirmed'].includes(s.status));
  const pastSessions = sessions.filter(s => ['completed', 'cancelled'].includes(s.status));

  const filteredSessions = (activeTab === 'upcoming' ? upcomingSessions : pastSessions).filter(s => {
    const partnerName = s.teacher_id === user?.id ? s.learner_name : s.teacher_name;
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Sessions' }]}
        title="My Sessions"
        description="Manage your upcoming classes, requests, and past history."
      />

      <div className="card mb-xl">
        <div className="card-body" style={{padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'}}>
          <div className="tabs" style={{borderBottom: 'none'}}>
            <button 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
              style={{padding: '4px 12px', fontSize: 'var(--font-xs)'}}
            >
              Upcoming ({upcomingSessions.length})
            </button>
            <button 
              className={`tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
              style={{padding: '4px 12px', fontSize: 'var(--font-xs)'}}
            >
              History ({pastSessions.length})
            </button>
          </div>
          
          <div className="search-input-wrapper" style={{width: '240px'}}>
            <Search size={14} className="search-icon" style={{left: '12px'}} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search sessions..." 
              style={{paddingLeft: '32px', fontSize: 'var(--font-xs)', padding: '6px 32px'}}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sessions-list">
          <div className="skeleton" style={{ height: '180px' }} />
          <div className="skeleton" style={{ height: '180px' }} />
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="sessions-list">
          {filteredSessions.map(session => {
            const isTeacher = session.teacher_id === user?.id;
            const partnerName = isTeacher ? session.learner_name : session.teacher_name;
            const partnerAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;
            const isReady = isMeetingReady(session.scheduled_at);
            const isPassed = isMeetingPassed(session.scheduled_at, session.duration_minutes);
            
            return (
              <div key={session.id} className="card session-card">
                
                {/* 1. Participant */}
                <div className="session-section participant-section">
                  <div className="avatar-wrapper">
                    {partnerAvatar ? (
                      <img src={`http://localhost:5000${partnerAvatar}`} alt={partnerName} className="avatar avatar-xl" />
                    ) : (
                      <div className="avatar-fallback avatar-xl">{getInitials(partnerName)}</div>
                    )}
                    <span className="badge badge-default mt-xs">{isTeacher ? 'Learner' : 'Teacher'}</span>
                  </div>
                  <div className="participant-info">
                    <h3 className="session-skill truncate">{session.skill_name}</h3>
                    <p className="session-partner truncate">with {partnerName}</p>
                    <button 
                      className="btn-ghost btn-xs mt-sm"
                      onClick={() => navigate(`/profile/${isTeacher ? session.learner_id : session.teacher_id}`)}
                    >
                      <User size={12}/> View Profile
                    </button>
                  </div>
                </div>

                {/* 2. Logistics */}
                <div className="session-section logistics-section">
                  <div className="logistics-row">
                    <Calendar size={14} className="text-muted" />
                    <span>{new Date(session.scheduled_at).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="logistics-row">
                    <Clock size={14} className="text-muted" />
                    <span>{new Date(session.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                    {session.status === 'confirmed' && (
                      <span className="countdown-badge">{renderCountdown(session.scheduled_at)}</span>
                    )}
                  </div>
                  <SessionTimeline session={session} />
                </div>

                {/* 4. Actions */}
                <div className="session-section actions-section">
                  {session.status === 'pending' && isTeacher && (
                    <button className="btn-success w-full" onClick={() => handleAction(session.id, 'confirm')}>
                      <Check size={16} /> Confirm Request
                    </button>
                  )}
                  
                  {session.status === 'confirmed' && (
                    <div className="action-group">
                      {session.meeting_link ? (
                        <a 
                          href={session.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`btn-primary w-full ${(!isReady || isPassed) ? 'disabled' : ''}`}
                          onClick={(e) => {
                            if (!isReady || isPassed) e.preventDefault();
                          }}
                        >
                          <Video size={16} /> Join Meeting
                        </a>
                      ) : isTeacher ? (
                        <button className="btn-primary w-full" onClick={() => handleAction(session.id, 'confirm')}>
                          <AlertCircle size={16} /> Add Meeting Link
                        </button>
                      ) : (
                        <button className="btn-secondary w-full" disabled>
                          Awaiting Link
                        </button>
                      )}
                      
                      <button className="btn-secondary w-full" onClick={() => navigate(`/sessions/${session.id}/chat`)}>
                        <MessageSquare size={16} /> Open Workspace
                      </button>
                      
                      {isTeacher && session.meeting_link && (
                        <button className="btn-ghost btn-sm w-full" onClick={() => handleAction(session.id, 'confirm')}>
                          <Pencil size={14} /> Edit Link
                        </button>
                      )}
                    </div>
                  )}

                  {['pending', 'confirmed'].includes(session.status) && (
                    <button className="btn-ghost btn-xs cancel-btn" onClick={() => handleAction(session.id, 'cancel')}>
                      <X size={14} /> Cancel Session
                    </button>
                  )}
                  
                  {session.status === 'completed' && (
                    <button className="btn-secondary w-full" onClick={() => navigate(`/sessions/${session.id}/chat`)}>
                      View Workspace <ArrowRight size={14} />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon={Calendar}
          title={activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
          description={activeTab === 'upcoming' ? "You don't have any scheduled classes at the moment." : "You haven't completed any sessions yet."}
          action={activeTab === 'upcoming' ? { label: 'Explore Teachers', to: '/explore' } : null}
        />
      )}

      <ConfirmSessionModal 
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmSessionId(null);
        }}
        sessionId={confirmSessionId}
        onSuccess={() => {
          setShowConfirmModal(false);
          setConfirmSessionId(null);
          fetchSessions();
        }}
        existingLink={sessions.find(s => s.id === confirmSessionId)?.meeting_link}
      />
    </div>
  );
}
