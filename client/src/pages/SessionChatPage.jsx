import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, ShieldCheck, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import api from '../utils/api';
import TypingIndicator from '../components/TypingIndicator';
import './SessionChatPage.css'; // Optional CSS if we need specific styles

const ChatMessage = React.memo(({ msg, isMe }) => {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: '12px',
        backgroundColor: isMe ? 'var(--text-primary)' : 'var(--bg-secondary)',
        color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
        border: isMe ? 'none' : '1px solid var(--border-subtle)',
        fontWeight: '500',
        fontSize: '0.95rem',
        lineHeight: '1.4'
      }}>
        {msg.text}
      </div>
      <span style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '4px',
        marginRight: isMe ? '4px' : '0',
        marginLeft: isMe ? '0' : '4px'
      }}>
        {timeStr}
      </span>
    </div>
  );
});

export default function SessionChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const socket = useChatStore((s) => s.socket);

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);

  // 1. Fetch Session Info & Chat History
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const [sessionRes, messagesRes] = await Promise.all([
          api.get(`/sessions/${sessionId}`),
          api.get(`/sessions/${sessionId}/messages`),
        ]);
        setSession(sessionRes.data.session);
        setMessages(messagesRes.data.messages || []);
      } catch (err) {
        console.error('Failed to load session chat:', err);
        setError('Failed to load session chat.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessionData();
  }, [sessionId]);

  // 2. Setup Socket Room and Listeners
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join the session room
    socket.emit('join_session', { sessionId });

    // Listen for new messages
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
      // We don't necessarily leave the room here, but we could emit 'leave_session' if needed.
    };
  }, [socket, sessionId, user?.id]);

  // 3. Auto-scroll Logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4. Send Handler
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send_session_message', { sessionId, text: inputText }, (response) => {
      if (response?.error) {
        console.error('Failed to send message:', response.error);
        // Optionally show toast error
      }
    });

    setInputText('');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '12px' }} />
        <div className="skeleton" style={{ height: '80px', width: '70%', borderRadius: '12px', alignSelf: 'flex-start' }} />
        <div className="skeleton" style={{ height: '60px', width: '60%', borderRadius: '12px', alignSelf: 'flex-end' }} />
        <div className="skeleton" style={{ height: '100px', width: '80%', borderRadius: '12px', alignSelf: 'flex-start' }} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>
        <AlertCircle size={24} style={{ marginBottom: '8px' }} />
        <p>{error || 'Session not found'}</p>
        <button className="btn-secondary mt-3" onClick={() => navigate('/sessions')}>Go Back</button>
      </div>
    );
  }

  const isTeacher = session.teacher_id === user?.id;
  const otherUser = {
    name: isTeacher ? session.learner_name : session.teacher_name,
    avatar: isTeacher ? session.learner_avatar : session.teacher_avatar,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-subtle)',
      borderRight: '1px solid var(--border-subtle)'
    }}>
      
      {/* HEADER */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button className="navbar-icon-btn" style={{ padding: '8px', border: 'none' }} onClick={() => navigate('/sessions')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {otherUser.name} <ShieldCheck size={18} color="var(--success, #22c55e)" />
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', fontFamily: 'monospace', margin: 0 }}>
              {session.skill_name || 'Session'} • {session.duration_minutes || 60} min
            </p>
          </div>
        </div>
        <button className="navbar-icon-btn" style={{ padding: '8px', border: 'none' }}>
          <MoreVertical size={20} />
        </button>
      </header>

      {/* MESSAGES AREA */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        
        {/* Security / Info Banner */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px 12px',
            borderRadius: '99px',
            color: 'var(--text-secondary)'
          }}>
            End-to-End Encrypted Session
          </span>
        </div>

        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} isMe={msg.senderId === user?.id} />
        ))}
        {partnerIsTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <TypingIndicator />
          </div>
        )}
        {/* Invisible div to snap scroll to */}
        <div ref={messagesEndRef} />
      </main>

      {/* INPUT AREA */}
      <footer style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <form 
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: 'var(--space-sm)'
          }}
        >
          <input
            type="text"
            className="input-minimal"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              socket.volatile.emit('typing_session', { sessionId });
            }}
            style={{ 
              flex: 1,
              borderRadius: '99px', 
              padding: '12px 20px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            className="gradient-btn"
            style={{ borderRadius: '99px', padding: '0 20px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={!inputText.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </footer>

    </div>
  );
}
