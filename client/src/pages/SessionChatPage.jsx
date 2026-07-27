import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Send, ArrowLeft, MoreVertical, ShieldCheck, AlertCircle, Video, Clock, 
  Check, CheckCheck, Menu, X, Search, File, BookOpen, Paperclip, Smile, Mic, Info,
  CheckCircle, Zap, MessageSquare
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import api from '../utils/api';
import TypingIndicator from '../components/TypingIndicator';
import ReviewModal from '../components/ReviewModal';
import { getInitials, formatRelativeTime } from '../utils/formatters';
import './SessionChatPage.css';

const ChatMessage = React.memo(({ msg, isMe, showDate, isGrouped }) => {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <>
      {showDate && (
        <div className="date-separator">
          {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      )}
      <div className={`chat-message-wrapper ${isMe ? 'is-me' : 'is-other'} ${!isGrouped ? 'margin-top' : ''}`}>
        <div className="chat-bubble">
          <div className="chat-bubble-text">{msg.text}</div>
          <div className="chat-bubble-meta">
            <span>{timeStr}</span>
            {isMe && <CheckCheck size={15} className="read-check-icon" />}
          </div>
        </div>
      </div>
    </>
  );
});

export default function SessionChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const socket = useChatStore((s) => s.socket);

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sessionRes, messagesRes, allSessionsRes] = await Promise.all([
          api.get(`/sessions/${sessionId}`),
          api.get(`/sessions/${sessionId}/messages`),
          api.get('/sessions')
        ]);
        setSession(sessionRes.data.session);
        setMessages(messagesRes.data.messages || []);
        
        const rawSessions = (allSessionsRes.data.sessions || []).filter(s => 
          ['confirmed', 'completed'].includes(s.status)
        ).sort((a,b) => {
          if (a.id === sessionId) return -1;
          if (b.id === sessionId) return 1;
          return new Date(b.updated_at || b.updatedAt || b.created_at) - new Date(a.updated_at || a.updatedAt || a.created_at);
        });

        const seenPartners = new Set();
        const deduplicationList = [];
        for (const s of rawSessions) {
          const partnerId = s.teacher_id === user?.id ? s.learner_id : s.teacher_id;
          if (!seenPartners.has(partnerId)) {
            seenPartners.add(partnerId);
            deduplicationList.push(s);
          }
        }

        setAllSessions(deduplicationList);
      } catch (err) {
        console.error('Failed to load session chat:', err);
        setError('Failed to load session chat.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit('join_session', { sessionId });

    const handleNewMessage = (messageData) => {
      setMessages((prev) => [...prev, messageData]);
      if (messageData.senderId !== user?.id) {
        setPartnerIsTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId !== user?.id) {
        setPartnerIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setPartnerIsTyping(false);
        }, 3000);
      }
    };

    socket.on('new_session_message', handleNewMessage);
    socket.on('typing_session', handleTyping);

    return () => {
      socket.off('new_session_message', handleNewMessage);
      socket.off('typing_session', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, sessionId, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerIsTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send_session_message', { sessionId, text: inputText }, (response) => {
      if (response?.error) {
        console.error('Failed to send message:', response.error);
      }
    });

    setInputText('');
  };

  const handleCompleteSession = async () => {
    setIsCompleting(true);
    try {
      const res = await api.put(`/sessions/${sessionId}/complete`);
      setSession(res.data.session);
      if (res.data.session.status === 'completed') {
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
      alert(err.response?.data?.error || 'Failed to complete session.');
    } finally {
      setIsCompleting(false);
    }
  };

  const renderCountdown = () => {
    if (!session) return null;
    if (session.status === 'completed') return <span className="text-success">Completed</span>;
    
    const scheduledAt = new Date(session.scheduled_at);
    const diffMs = scheduledAt - currentTime;
    
    if (diffMs <= 0) return <span className="text-success">In Progress</span>;
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
    
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  };

  const filteredSessions = allSessions.filter(s => {
    const isTeacher = s.teacher_id === user?.id;
    const partnerName = isTeacher ? s.learner_name : s.teacher_name;
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="chat-workspace">
        <div className="chat-center">
          <div className="loading-screen" style={{minHeight: '100%', background: 'transparent'}}>
            <div className="skeleton" style={{width: '100%', height: '100%'}} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="chat-workspace">
        <div className="chat-center" style={{alignItems: 'center', justifyContent: 'center'}}>
          <AlertCircle size={48} className="text-danger" style={{ marginBottom: '16px' }} />
          <h3>{error || 'Session not found'}</h3>
          <button className="btn-secondary mt-3" onClick={() => navigate('/sessions')}>Go to Sessions</button>
        </div>
      </div>
    );
  }

  const isTeacher = session.teacher_id === user?.id;
  const partner = {
    name: isTeacher ? session.learner_name : session.teacher_name,
    avatar: isTeacher ? session.learner_avatar : session.teacher_avatar,
    role: isTeacher ? 'Learner' : 'Teacher'
  };
  
  const isMeetingReady = () => {
    const scheduledAt = new Date(session.scheduled_at);
    const tenMinsBefore = new Date(scheduledAt.getTime() - 10 * 60000);
    return currentTime >= tenMinsBefore;
  };

  return (
    <div className={`chat-workspace ${showRightDrawer ? 'drawer-open' : ''}`}>
      
      {/* 1. LEFT PANEL: Conversations */}
      <aside className={`chat-left-sidebar ${showLeftDrawer ? 'show' : ''}`}>
        <div className="chat-sidebar-header">
          <h3>Conversations</h3>
          <button className="btn-icon show-on-mobile" onClick={() => setShowLeftDrawer(false)}><X size={18} /></button>
        </div>
        
        <div className="chat-sidebar-search">
          <div className="search-input-wrapper">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Find a chat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-input"
            />
          </div>
        </div>

        <div className="chat-sidebar-list">
          {filteredSessions.map((s, idx) => {
            const sIsTeacher = s.teacher_id === user?.id;
            const sPartnerName = sIsTeacher ? s.learner_name : s.teacher_name;
            const sPartnerAvatar = sIsTeacher ? s.learner_avatar : s.teacher_avatar;
            const isActive = s.id === sessionId;
            
            return (
              <Link 
                key={s.id} 
                to={`/sessions/${s.id}/chat`} 
                className={`chat-list-item ${isActive ? 'active' : ''}`}
                style={{ animation: `message-fade-in 0.3s ease ${idx * 0.05}s forwards`, opacity: 0 }}
                onClick={() => setShowLeftDrawer(false)}
              >
                <div className="chat-list-avatar">
                   {sPartnerAvatar ? <img src={`http://localhost:5000${sPartnerAvatar}`} alt={sPartnerName} className="avatar" /> : <div className="avatar-fallback">{getInitials(sPartnerName)}</div>}
                   {s.status === 'confirmed' && <span className="online-indicator" />}
                </div>
                <div className="chat-list-content">
                  <div className="chat-list-top">
                    <span className="chat-list-name truncate">{sPartnerName}</span>
                    <span className="chat-list-time">
                      {new Date(s.updated_at || s.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="chat-list-preview">
                    <span className="chat-list-msg">💬 {s.skill_name || 'Active session workspace'}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 2. CENTER PANEL: Chat Canvas */}
      <main className="chat-center">
        {/* WhatsApp Header Strip */}
        <header className="chat-header">
          <div className="chat-header-left" onClick={() => setShowRightDrawer(!showRightDrawer)}>
            <button className="btn-icon show-on-mobile" onClick={(e) => { e.stopPropagation(); setShowLeftDrawer(true); }}>
              <Menu size={18} />
            </button>
            <button className="btn-icon hide-on-mobile" onClick={(e) => { e.stopPropagation(); navigate('/sessions'); }}>
              <ArrowLeft size={18} />
            </button>
            
            {partner.avatar ? <img src={`http://localhost:5000${partner.avatar}`} alt={partner.name} className="header-avatar" /> : <div className="avatar-fallback header-avatar">{getInitials(partner.name)}</div>}
            
            <div className="session-hub-info">
              <h2 className="session-hub-title">
                {partner.name}
                <span className="header-role-badge">{partner.role}</span>
              </h2>
              <div className="session-hub-meta">
                <span className="countdown-highlight">
                  {session.status === 'confirmed' ? 'Online • ' : ''}{renderCountdown()}
                </span>
                <span>•</span>
                <span>{session.skill_name}</span>
              </div>
            </div>
          </div>
          
          <div className="chat-header-right">
            {session.status === 'confirmed' && session.meeting_link && (
              <a 
                href={session.meeting_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="wa-header-action-btn green-btn"
                title="Join Video Call"
                onClick={(e) => { if (!isMeetingReady()) { e.preventDefault(); alert('Meeting link is available 10 minutes before start.'); } }}
              >
                <Video size={20} />
              </a>
            )}
            <button className="wa-header-action-btn" title="Workspace Info" onClick={() => setShowRightDrawer(!showRightDrawer)}>
              <Info size={20} />
            </button>
            <button className="wa-header-action-btn" title="Menu" onClick={() => setShowRightDrawer(!showRightDrawer)}>
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {/* Message Canvas */}
        <div className="chat-messages-area">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-state-icon">
                <MessageSquare size={32} />
              </div>
              <h3>Start the conversation</h3>
              <p>Your collaborative workspace is ready.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              
              // Logic for date separation
              const currentDate = new Date(msg.timestamp).toLocaleDateString();
              const prevDate = prevMsg ? new Date(prevMsg.timestamp).toLocaleDateString() : null;
              const showDate = currentDate !== prevDate;
              
              // WhatsApp style grouping
              const isGrouped = !showDate && prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) < 60000;
              
              return (
                <ChatMessage 
                  key={msg.id} 
                  msg={msg} 
                  isMe={msg.senderId === user?.id} 
                  showDate={showDate}
                  isGrouped={isGrouped}
                />
              );
            })
          )}
          {partnerIsTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '10px 0' }}>
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Composer */}
        <footer className="chat-input-area">
          <form onSubmit={handleSend} className="chat-input-form">
            <div className="composer-actions-left">
              <div className="composer-icon-btn"><Paperclip size={18} /></div>
            </div>
            
            <input
              type="text"
              className="chat-input-field"
              placeholder="Message..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                socket.volatile.emit('typing_session', { sessionId });
              }}
              disabled={session.status !== 'confirmed'}
            />
            
            <div className="composer-actions-right">
              <div className="composer-icon-btn"><Smile size={18} /></div>
              <div className="composer-icon-btn"><Mic size={18} /></div>
              <button 
                type="submit" 
                className="send-btn"
                disabled={!inputText.trim() || session.status !== 'confirmed'}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
          {session.status === 'completed' && (
            <p className="chat-disabled-msg">Session completed. Workspace is read-only.</p>
          )}
        </footer>
      </main>

      {/* 3. RIGHT PANEL: Workspace Details */}
      <aside className={`chat-right-sidebar ${showRightDrawer ? 'show' : ''}`}>
        <div className="workspace-header">
          <h3>Workspace</h3>
          <button className="btn-icon show-on-mobile" onClick={() => setShowRightDrawer(false)}><X size={18} /></button>
        </div>
        
        <div className="chat-right-content">
          
          {/* Meeting Card */}
          <div className="ws-card">
            <div className="ws-card-header"><Video size={14} /> Meeting</div>
            <div className="meeting-countdown-large">{renderCountdown()}</div>
            {session.status === 'confirmed' && (
              <>
                {session.meeting_link ? (
                  <a 
                    href={session.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`btn-primary btn-meeting ${!isMeetingReady() ? 'disabled' : ''}`}
                    onClick={(e) => { if(!isMeetingReady()) e.preventDefault(); }}
                  >
                    Join Video Call
                  </a>
                ) : (
                  <button className="btn-secondary btn-meeting disabled">
                    <Clock size={16} style={{marginRight: '6px'}}/> Awaiting Link
                  </button>
                )}
              </>
            )}
          </div>

          {/* Session Details */}
          <div className="ws-card">
            <div className="ws-card-header"><Info size={14} /> Details</div>
            <div className="ws-detail-row"><span className="ws-detail-label">Skill</span><span className="ws-detail-value">{session.skill_name}</span></div>
            <div className="ws-detail-row"><span className="ws-detail-label">Duration</span><span className="ws-detail-value">{session.duration_minutes} min</span></div>
            <div className="ws-detail-row"><span className="ws-detail-label">Scheduled</span><span className="ws-detail-value">{new Date(session.scheduled_at).toLocaleDateString()}</span></div>
          </div>

          {/* Participants */}
          <div className="ws-card">
            <div className="ws-card-header"><BookOpen size={14} /> Participants</div>
            <div className="participant-row">
              {partner.avatar ? <img src={`http://localhost:5000${partner.avatar}`} alt={partner.name} className="avatar" /> : <div className="avatar-fallback avatar">{getInitials(partner.name)}</div>}
              <div className="participant-info">
                <span className="participant-name">{partner.name}</span>
                <span className="participant-role">{partner.role}</span>
              </div>
            </div>
            <div className="participant-row">
              {user?.avatar ? <img src={`http://localhost:5000${user.avatar}`} alt={user.name} className="avatar" /> : <div className="avatar-fallback avatar">{getInitials(user.name)}</div>}
              <div className="participant-info">
                <span className="participant-name">{user.name} (You)</span>
                <span className="participant-role">{isTeacher ? 'Teacher' : 'Learner'}</span>
              </div>
            </div>
          </div>

          {/* Actions / Complete */}
          {session.status === 'confirmed' && (
            <div className="ws-card" style={{borderColor: 'var(--accent-muted)'}}>
              <div className="ws-card-header text-accent"><CheckCircle size={14} /> Actions</div>
              {(() => {
                const userConfirmed = isTeacher ? session.teacher_completion_confirmed : session.learner_completion_confirmed;
                const otherUserConfirmed = isTeacher ? session.learner_completion_confirmed : session.teacher_completion_confirmed;

                if (!userConfirmed) {
                  return (
                    <button 
                      className="btn-success btn-meeting" 
                      onClick={handleCompleteSession}
                      disabled={isCompleting}
                    >
                      {isCompleting ? 'Processing...' : otherUserConfirmed ? 'Confirm Completion' : 'Mark as Completed'}
                    </button>
                  );
                } else {
                  return (
                    <div className="ws-placeholder-text">
                      <p className="text-success mb-xs">You confirmed completion.</p>
                      <p>Waiting for {partner.name}.</p>
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* AI Assistant Placeholder */}
          <div className="ws-card ws-placeholder-card">
            <Zap size={24} className="ws-placeholder-icon" />
            <div className="ws-placeholder-text">AI Session Summary will be generated after completion.</div>
          </div>
          
          {/* Resources Placeholder */}
          <div className="ws-card ws-placeholder-card">
            <File size={24} className="ws-placeholder-icon" />
            <div className="ws-placeholder-text">Drag and drop files here to share.</div>
          </div>

        </div>
      </aside>

      <ReviewModal 
        isOpen={showReviewModal}
        session={session}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setShowReviewModal(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}
