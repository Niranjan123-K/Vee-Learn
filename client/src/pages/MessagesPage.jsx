import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, MoreVertical, Video, CheckCheck, FileText, Download,
  Paperclip, Smile, Send, MessageSquare, ArrowLeft, Edit3, Clock
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import { getInitials, formatRelativeTime } from '../utils/formatters';
import './MessagesPage.css';

export default function MessagesPage() {
  const user = useAuthStore(state => state.user);
  const socket = useChatStore(state => state.socket);
  const { userId, sessionId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isSubmitting = useRef(false);

  // Fetch real connected session workspaces and deduplicate by partner
  useEffect(() => {
    const fetchConnectedSessions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/sessions');
        const chatSessions = (res.data.sessions || []).filter(s => 
          ['confirmed', 'completed'].includes(s.status)
        ).sort((a,b) => new Date(b.updated_at || b.updatedAt || b.created_at) - new Date(a.updated_at || a.updatedAt || a.created_at));
        
        const seenPartners = new Set();
        const deduplicated = [];
        for (const s of chatSessions) {
          const partnerId = s.teacher_id === user?.id ? s.learner_id : s.teacher_id;
          if (!seenPartners.has(partnerId)) {
            seenPartners.add(partnerId);
            deduplicated.push(s);
          }
        }

        setSessions(deduplicated);
      } catch (err) {
        console.error('Failed to load connected conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchConnectedSessions();
    }
  }, [user?.id, sessionId, userId]);

  const activeConversation = conversations.find(c => c.id === activeId);

  // Fetch actual message history for the selected conversation
  useEffect(() => {
    if (activeConversation && activeConversation.realSessionId) {
      api.get(`/sessions/${activeConversation.realSessionId}/messages`)
        .then(res => {
          const loadedMsgs = res.data.messages || [];
          const formattedMsgs = loadedMsgs.map((m, index) => {
            const prevMsg = loadedMsgs[index - 1];
            const currDate = new Date(m.timestamp || Date.now()).toLocaleDateString();
            const prevDate = prevMsg ? new Date(prevMsg.timestamp).toLocaleDateString() : null;
            const showDate = currDate !== prevDate;

            let dateDividerText = null;
            if (showDate) {
              const now = new Date().toLocaleDateString();
              dateDividerText = currDate === now ? 'TODAY' : new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
            }

            return {
              id: m.id || `${Date.now()}-${index}`,
              sender: m.senderId === user?.id ? 'me' : 'partner',
              text: m.text,
              timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              dateDivider: dateDividerText
            };
          });

          setConversations(prev => prev.map(c => {
            if (c.id === activeConversation.id) {
              const lastMsg = formattedMsgs[formattedMsgs.length - 1];
              return {
                ...c,
                messages: formattedMsgs,
                preview: lastMsg ? lastMsg.text : c.preview,
                timeAgo: lastMsg ? formatRelativeTime(new Date()).toUpperCase() : c.timeAgo
              };
            }
            return c;
          }));
        })
        .catch(err => console.error('Error fetching conversation messages:', err));
    }
  }, [activeId, user?.id]);

  // Connect via Socket.io for live messaging & typing indicators in active session
  useEffect(() => {
    if (!socket || !activeConversation?.realSessionId) return;

    socket.emit('join_session', { sessionId: activeConversation.realSessionId });

    const handleNewMessage = (m) => {
      const isMe = m.senderId === user?.id;

      // Prevent double rendering since optimistic UI appends our own messages locally
      if (isMe) return;

      const newFormatted = {
        id: m.id || Math.random().toString(),
        sender: 'partner',
        text: m.text,
        timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setPartnerIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      setConversations(prev => prev.map(c => {
        if (c.id === activeConversation.id) {
          const updatedMsgs = [...(c.messages || []), newFormatted];
          return {
            ...c,
            messages: updatedMsgs,
            preview: m.text,
            timeAgo: 'JUST NOW'
          };
        }
        return c;
      }));
    };

    const handleTyping = ({ userId: typingUserId }) => {
      if (typingUserId !== user?.id) {
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
  }, [socket, activeId, user?.id]);

  // Automatically scroll to bottom as messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConversation?.messages, partnerIsTyping]);

  const handleCompleteSession = async () => {
    if (!activeConversation?.realSessionId) return;
    if (!window.confirm("Are you sure you want to completely finish this session? This will finalize the time-credit transfer if the other user also confirms.")) return;

    setIsCompleting(true);
    try {
      await api.put(`/sessions/${activeConversation.realSessionId}/complete`);

      // Update local state
      setConversations(prev => prev.map(c => {
        if (c.id === activeId) {
          return { ...c, sessionStatus: 'completed' };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to complete session.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveId(id);
    setMobileChatOpen(true);
    setInputText('');
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (isSubmitting.current) return;
    if (!inputText.trim() || !activeConversation?.realSessionId || !socket) return;

    isSubmitting.current = true;
    setTimeout(() => { isSubmitting.current = false; }, 500);

    const trimmedText = inputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic UI append
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender: 'me',
      text: trimmedText,
      timestamp: timeStr
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeId) {
        return {
          ...c,
          preview: trimmedText,
          timeAgo: 'JUST NOW',
          messages: [...(c.messages || []), tempMsg]
        };
      }
      return c;
    }));

    // Emit live to backend WebSocket room
    socket.emit('send_session_message', {
      sessionId: activeConversation.realSessionId,
      text: trimmedText
    }, (response) => {
      if (response?.error) {
        console.error('Failed to transmit message via socket:', response.error);
      }
    });

    setInputText('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socket && activeConversation?.realSessionId) {
      socket.volatile.emit('typing_session', { sessionId: activeConversation.realSessionId });
    }
  };

  // Submission is exclusively fired by the form's native onSubmit handler to prevent duplicate entries

  const filteredConversations = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.preview && c.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="messages-platform fade-in">
      {/* ─── 1. LEFT PANE: CONNECTED CONVERSATIONS ─── */}
      <aside className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
          <button className="btn-compose" title="New Mentorship Workspace" onClick={() => navigate('/explore')}>
            <Edit3 size={20} />
          </button>
        </div>

        <div className="messages-sidebar-search">
          <div className="messages-search-wrapper">
            <Search size={16} className="messages-search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="messages-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="messages-list-scroll">
          {loading ? (
            <div className="p-sm">
              <div className="skeleton" style={{ height: '76px', marginBottom: '8px', borderRadius: '16px' }} />
              <div className="skeleton" style={{ height: '76px', marginBottom: '8px', borderRadius: '16px' }} />
              <div className="skeleton" style={{ height: '76px', borderRadius: '16px' }} />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  className={`conversation-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className="conversation-avatar-box">
                    {conv.partnerAvatar ? (
                      <img
                        src={conv.partnerAvatar}
                        alt={conv.partnerName}
                        className="conversation-avatar"
                      />
                    ) : (
                      <div className="conversation-avatar">
                        {getInitials(conv.partnerName)}
                      </div>
                    )}
                    <span className={`conversation-status ${conv.status === 'online' ? 'online' : ''}`} />
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-top">
                      <span className="conversation-name">{conv.partnerName}</span>
                      <span className="conversation-time">{conv.timeAgo}</span>
                    </div>
                    <span className="conversation-topic">{conv.skillName}</span>
                    <p className="conversation-preview">{conv.preview || 'Click to enter workspace...'}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-xl text-muted text-sm" style={{ marginTop: '20px' }}>
              {searchQuery ? (
                <p>No matching conversations found.</p>
              ) : (
                <>
                  <p className="mb-md">No connected mentorships yet. Confirm a session with a mentor to start chatting!</p>
                  <button
                    className="btn-secondary btn-sm w-full mt-3"
                    onClick={() => navigate('/explore')}
                  >
                    Explore Teachers
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ─── 2. RIGHT PANE: INTEGRATED CHAT WORKSPACE ─── */}
      <main className={`messages-chat-pane ${mobileChatOpen ? 'mobile-open' : ''}`}>
        {activeConversation ? (
          <>
            {/* Top Workspace Header */}
            <header className="chat-pane-header">
              <div className="chat-header-user">
                <button
                  className="mobile-back-btn"
                  onClick={() => setMobileChatOpen(false)}
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="header-avatar-box">
                  {activeConversation.partnerAvatar ? (
                    <img
                      src={activeConversation.partnerAvatar}
                      alt={activeConversation.partnerName}
                      className="header-avatar-img"
                    />
                  ) : (
                    <div className="header-avatar-img">
                      {getInitials(activeConversation.partnerName)}
                    </div>
                  )}
                  <span className="header-online-badge" />
                </div>

                <div className="header-meta">
                  <div className="header-title-row">
                    <h3 className="header-partner-name">{activeConversation.partnerName}</h3>
                    <span className="header-badge">{activeConversation.roleBadge}</span>
                  </div>
                  <div className="header-subtitle-row">
                    <span className="header-status-dot" />
                    <span>Online • {activeConversation.skillName}</span>
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                {activeConversation.sessionStatus === 'completed' ? (
                  <div className="badge badge-success" style={{ padding: '8px 16px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCheck size={16} /> Completed
                  </div>
                ) : (
                  <>
                    <button
                      className="btn-primary"
                      onClick={handleCompleteSession}
                      disabled={isCompleting}
                      style={{ borderRadius: '9999px', padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <CheckCheck size={15} />
                      <span>{isCompleting ? 'Processing...' : 'Complete Session'}</span>
                    </button>
                    {activeConversation.meetingLink ? (
                      <a
                        href={activeConversation.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-meet-action"
                      >
                        <Video size={16} />
                        <span>Join Google Meet</span>
                      </a>
                    ) : (
                      <button className="btn-secondary" disabled style={{ borderRadius: '9999px', padding: '9px 18px', fontSize: '13px' }}>
                        <Clock size={15} style={{ marginRight: '6px' }} />
                        <span>No Link Yet</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  className="btn-more-options"
                  title="View session details"
                  onClick={() => navigate(`/sessions`)}
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            {/* Chat Timeline Feed */}
            <div className="chat-timeline-area">
              {(activeConversation.messages || []).length === 0 ? (
                <div className="text-center p-xl text-muted my-auto">
                  <p className="mb-xs text-secondary font-medium">Collaborative workspace ready</p>
                  <p className="text-xs">Send a message to kick off your conversation with {activeConversation.partnerName.split(' ')[0]}.</p>
                </div>
              ) : (
                (activeConversation.messages || []).map((msg) => {
                  const isMe = msg.sender === 'me';

                  return (
                    <React.Fragment key={msg.id}>
                      {msg.dateDivider && (
                        <div className="chat-date-divider">
                          <div className="date-line" />
                          <span className="date-text">{msg.dateDivider}</span>
                          <div className="date-line right" />
                        </div>
                      )}

                      <div className={`msg-row ${isMe ? 'my-msg' : 'partner-msg'}`}>
                        {!isMe && (
                          activeConversation.partnerAvatar ? (
                            <img
                              src={activeConversation.partnerAvatar}
                              alt={activeConversation.partnerName}
                              className="msg-avatar"
                            />
                          ) : (
                            <div className="msg-avatar">
                              {getInitials(activeConversation.partnerName)}
                            </div>
                          )
                        )}

                        <div className="msg-bubble-col">
                          {msg.text && (
                            <div className="msg-bubble">
                              {msg.text}
                            </div>
                          )}

                          {msg.attachment && (
                            <div className="msg-attachment-box">
                              <div className="attachment-left">
                                <div className="attachment-icon-btn">
                                  <FileText size={22} />
                                </div>
                                <div className="attachment-info">
                                  <span className="attachment-title">{msg.attachment.title}</span>
                                  <span className="attachment-size">{msg.attachment.size}</span>
                                </div>
                              </div>
                              <button className="attachment-download-btn" title="Download Document">
                                <Download size={18} />
                              </button>
                            </div>
                          )}

                          <div className="msg-meta-time">
                            <span>{msg.timestamp}</span>
                            {isMe && (
                              <span className="read-receipt" title="Sent & Confirmed">
                                <CheckCheck size={16} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {partnerIsTyping && (
                <div className="typing-indicator-row">
                  <div className="typing-dots">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <span className="typing-text">
                    {activeConversation.partnerName.split(' ')[0]} is typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Floating Composer */}
            <footer className="chat-composer-section">
              <form onSubmit={handleSendMessage} className="composer-box">
                <input
                  ref={inputRef}
                  type="text"
                  className="composer-input"
                  placeholder={`Type a message to ${activeConversation.partnerName.split(' ')[0]}...`}
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={activeConversation.sessionStatus !== 'confirmed'}
                />

                <div className="composer-tools-right">
                  <button type="button" className="composer-tool-btn" title="Attach file" disabled={activeConversation.sessionStatus !== 'confirmed'}>
                    <Paperclip size={20} />
                  </button>
                  <button type="button" className="composer-tool-btn" title="Add emoji" disabled={activeConversation.sessionStatus !== 'confirmed'}>
                    <Smile size={20} />
                  </button>
                  <div className="composer-divider" />
                  <button
                    type="submit"
                    className="composer-send-btn"
                    disabled={!inputText.trim() || activeConversation.sessionStatus !== 'confirmed'}
                    title="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>

              {activeConversation.sessionStatus === 'completed' ? (
                <p className="text-center mt-3 text-xs text-muted font-medium">
                  This mentorship session has been completed. The workspace is in read-only mode.
                </p>
              ) : (
                <div className="composer-helper-footer">
                  <span>PRESS</span>
                  <span className="key-badge">SHIFT + ENTER</span>
                  <span>FOR NEW LINE</span>
                </div>
              )}
            </footer>
          </>
        ) : (
          <div className="chat-empty-canvas">
            <div className="empty-canvas-icon">
              <MessageSquare size={36} />
            </div>
            <h3>{conversations.length === 0 ? 'No active chat workspaces' : 'Select a conversation'}</h3>
            <p className="max-w-md">
              {conversations.length === 0
                ? 'Your chat history with connected mentorship partners will appear here once sessions are confirmed.'
                : 'Choose a mentorship session from the sidebar to view your chat timeline and shared resources.'
              }
            </p>
            {conversations.length === 0 && !loading && (
              <button className="btn-primary mt-3" onClick={() => navigate('/explore')}>
                Find a Mentor
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
