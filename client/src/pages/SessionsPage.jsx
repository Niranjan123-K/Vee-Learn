import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { getInitials, formatDate } from '../utils/formatters';
import api from '../utils/api';
import './SessionsPage.css';

const tabs = ['All', 'Upcoming', 'Pending', 'Completed', 'Cancelled'];

const statusConfig = {
  pending: { badge: 'badge-warning', icon: Clock, label: 'Pending' },
  confirmed: { badge: 'badge-info', icon: Calendar, label: 'Confirmed' },
  completed: { badge: 'badge-success', icon: CheckCircle, label: 'Completed' },
  cancelled: { badge: 'badge-danger', icon: XCircle, label: 'Cancelled' },
};

export default function SessionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.sessions || res.data || []);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();

    // Listen for real-time session events (from socket notifications)
    const handleSessionUpdate = () => fetchSessions();
    window.addEventListener('session_update', handleSessionUpdate);
    return () => window.removeEventListener('session_update', handleSessionUpdate);
  }, []);

  const handleAction = async (sessionId, action) => {
    setActionLoading(sessionId + action);
    setActionError('');
    try {
      await api.put(`/sessions/${sessionId}/${action}`);
      await fetchSessions();
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${action} session`;
      setActionError(msg);
      console.error(`Failed to ${action} session:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = sessions.filter((s) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return s.status === 'confirmed';
    return s.status === activeTab.toLowerCase();
  });

  // Helper: determine the "other" user from the flat backend response
  const getOtherUser = (session) => {
    const isTeacher = session.teacher_id === user?.id;
    return {
      name: isTeacher ? session.learner_name : session.teacher_name,
      avatar: isTeacher ? session.learner_avatar : session.teacher_avatar,
    };
  };

  const isTeacherForSession = (session) => session.teacher_id === user?.id;

  // Format the scheduled_at datetime
  const formatSessionDateTime = (session) => {
    if (!session.scheduled_at) return '';
    const d = new Date(session.scheduled_at);
    const dateStr = formatDate(session.scheduled_at);
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">
          My <span className="gradient-text">Sessions</span>
        </h1>
        <p className="section-subtitle">Manage your teaching and learning sessions</p>
      </motion.div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-xl)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-md)' }}>
          <AlertCircle size={16} /> {actionError}
        </div>
      )}

      {/* Session List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="sessions-list">
          {filtered.map((session, i) => {
            const otherUser = getOtherUser(session);
            const config = statusConfig[session.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isTeacher = isTeacherForSession(session);

            return (
              <motion.div
                key={session.id || i}
                className="session-card glass-card-static"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="session-card-main">
                  <div className="session-card-left">
                    {otherUser.avatar ? (
                      <img src={otherUser.avatar} alt="" className="avatar avatar-lg" />
                    ) : (
                      <div className="avatar-fallback avatar-lg">{getInitials(otherUser.name)}</div>
                    )}
                    <div className="session-card-info">
                      <h3 className="session-card-skill">{session.skill_name || 'Session'}</h3>
                      <p className="session-card-user">
                        {isTeacher ? 'Teaching' : 'Learning from'} <strong>{otherUser.name || 'User'}</strong>
                      </p>
                      <p className="session-card-date">
                        <Calendar size={13} /> {formatSessionDateTime(session)}
                        {session.duration_minutes && <> · {session.duration_minutes} min</>}
                      </p>
                    </div>
                  </div>

                  <div className="session-card-right">
                    <span className={`badge ${config.badge}`}>
                      <StatusIcon size={12} />
                      {config.label}
                    </span>
                    {session.status === 'pending' && isTeacher && (
                      <div className="session-actions">
                        <button
                          className="gradient-btn btn-sm"
                          onClick={() => handleAction(session.id, 'confirm')}
                          disabled={actionLoading === session.id + 'confirm'}
                        >
                          <span>{actionLoading === session.id + 'confirm' ? 'Confirming...' : 'Confirm'}</span>
                        </button>
                        <button
                          className="gradient-btn-outline btn-sm"
                          onClick={() => handleAction(session.id, 'cancel')}
                          disabled={actionLoading === session.id + 'cancel'}
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        >
                          {actionLoading === session.id + 'cancel' ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    )}
                    {session.status === 'confirmed' && (
                      <div className="session-actions">
                        <button
                          className="gradient-btn-outline btn-sm"
                          onClick={() => navigate(`/sessions/${session.id}/chat`)}
                        >
                          Open Chat
                        </button>
                        <button
                          className="gradient-btn btn-sm"
                          onClick={() => handleAction(session.id, 'complete')}
                          disabled={actionLoading === session.id + 'complete'}
                        >
                          <span>{actionLoading === session.id + 'complete' ? 'Completing...' : 'Complete'}</span>
                        </button>
                        <button
                          className="gradient-btn-outline btn-sm"
                          onClick={() => handleAction(session.id, 'cancel')}
                          disabled={actionLoading === session.id + 'cancel'}
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        >
                          {actionLoading === session.id + 'cancel' ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Calendar size={56} />
          <h3>No {activeTab.toLowerCase()} sessions</h3>
          <p>
            {activeTab === 'All'
              ? "You don't have any sessions yet. Start by finding a teacher!"
              : `No ${activeTab.toLowerCase()} sessions to show.`}
          </p>
        </div>
      )}
    </div>
  );
}
