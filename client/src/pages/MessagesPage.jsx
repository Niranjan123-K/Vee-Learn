import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, User, MessageCircle } from 'lucide-react';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import ChatBubble from '../components/ChatBubble';
import './MessagesPage.css';

const MessagesPage = () => {
  const { userId } = useParams();
  const user = useAuthStore(state => state.user);
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loadConversations, 
    loadMessages, 
    sendMessage, 
    setActiveConversation 
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (userId) {
      setActiveConversation(userId);
      loadMessages(userId);
    }
  }, [userId, setActiveConversation, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim() && userId) {
      sendMessage(userId, messageText);
      setMessageText('');
    }
  };

  return (
    <div className="messages-page page-container fade-in">
      <div className="messages-layout surface-card">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <h2 className="sidebar-title">Conversations</h2>
          <div className="conversations-list">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                className={`conversation-item ${activeConversation === conv.user.id ? 'active' : ''}`}
                onClick={() => window.location.href = `/messages/${conv.user.id}`}
              >
                <div className="conv-avatar">
                  {conv.user.avatar_url ? (
                    <img src={conv.user.avatar_url} alt={conv.user.name} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="conv-details">
                  <div className="conv-header">
                    <h4>{conv.user.name}</h4>
                    <span className="conv-time">{new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            ))}
            {conversations.length === 0 && <p className="no-conversations">No conversations yet.</p>}
          </div>
        </div>

        {/* Active Chat Area */}
        <div className="chat-area">
          {userId ? (
            <>
              <div className="chat-header">
                <h3>Chat</h3>
              </div>
              <div className="messages-list">
                {messages.map(msg => (
                  <ChatBubble 
                    key={msg.id} 
                    message={msg} 
                    isOwn={msg.sender_id === user?.id} 
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="message-input-area" onSubmit={handleSend}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Type a message..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button type="submit" className="btn-primary send-btn" disabled={!messageText.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-state">
              <MessageCircle size={64} className="empty-icon" />
              <h3>Your Messages</h3>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
