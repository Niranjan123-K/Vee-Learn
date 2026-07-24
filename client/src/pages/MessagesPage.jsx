import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { getInitials } from '../utils/formatters';
import './MessagesPage.css';

export default function MessagesPage() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/sessions');
        // Only show confirmed or completed sessions that act as chat workspaces
        const chatSessions = (res.data.sessions || []).filter(s => 
          ['confirmed', 'completed'].includes(s.status)
        ).sort((a,b) => new Date(b.updated_at || b.updatedAt || b.created_at) - new Date(a.updated_at || a.updatedAt || a.created_at));
        
        setSessions(chatSessions);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const filteredSessions = sessions.filter(s => {
    const isTeacher = s.teacher_id === user?.id;
    const partnerName = isTeacher ? s.learner_name : s.teacher_name;
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Messages' }]}
        title="Messages"
        description="Your active and past session workspaces."
      />

      <div className="card">
        <div className="card-header">
          <div className="search-input-wrapper w-full" style={{maxWidth: '400px'}}>
            <Search size={16} className="search-icon" style={{left: '12px'}} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search conversations..." 
              style={{paddingLeft: '36px'}}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="card-body" style={{padding: 0}}>
          {loading ? (
            <div className="p-lg">
              <div className="skeleton" style={{ height: '70px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '70px', marginBottom: '10px' }} />
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="messages-list">
              {filteredSessions.map(session => {
                const isTeacher = session.teacher_id === user?.id;
                const partnerName = isTeacher ? session.learner_name : session.teacher_name;
                const partnerAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;
                
                return (
                  <div 
                    key={session.id} 
                    className="message-item"
                    onClick={() => navigate(`/sessions/${session.id}/chat`)}
                  >
                    <div className="message-avatar-wrapper">
                      {partnerAvatar ? (
                        <img src={`http://localhost:5000${partnerAvatar}`} alt={partnerName} className="avatar avatar-xl" />
                      ) : (
                        <div className="avatar-fallback avatar-xl">{getInitials(partnerName)}</div>
                      )}
                      {session.status === 'confirmed' && <span className="status-indicator online" />}
                    </div>
                    
                    <div className="message-content">
                      <div className="message-header">
                        <h4 className="message-name">{partnerName}</h4>
                        <span className="message-time">
                          {new Date(session.updated_at || session.updatedAt || session.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                      </div>
                      <p className="message-skill">{session.skill_name}</p>
                      <p className="message-preview">
                        {session.status === 'confirmed' ? 'Active session workspace open.' : 'Session completed. Chat history available.'}
                      </p>
                    </div>
                    
                    <div className="message-action">
                      <button className="btn-icon">
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={MessageSquare}
              title="No conversations found"
              description="You don't have any active or past session workspaces."
              action={{ label: 'Find a Teacher', to: '/explore' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
