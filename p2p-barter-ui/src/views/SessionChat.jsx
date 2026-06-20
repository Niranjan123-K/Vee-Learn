import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { activeSessions, currentUser } from '../mockData';
import { Button } from '../components/Button';

const socket = io('http://localhost:5000');

export function SessionChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = activeSessions.find(s => s.id === id) || activeSessions[0];
  
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState(session ? session.messages : []);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  useEffect(() => {
    if (!session) return;
    
    // Join a room for this specific session
    socket.emit('join_chat', { sessionId: session.id });

    const handleReceive = (data) => {
      setMessages(prev => [...prev, data]);
      setIsPartnerTyping(false);
    };

    const handleTyping = () => {
      setIsPartnerTyping(true);
      // Clear typing indicator after 2 seconds
      setTimeout(() => setIsPartnerTyping(false), 2000);
    };

    socket.on('receive_message', handleReceive);
    socket.on('partner_typing', handleTyping);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('partner_typing', handleTyping);
    };
  }, [session]);

  const handleSend = () => {
    if (!msg.trim()) return;
    
    const newMsg = { 
      senderId: currentUser.id, 
      text: msg, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, newMsg]);
    socket.emit('send_message', { sessionId: session.id, message: newMsg });
    setMsg('');
  };

  const handleChange = (e) => {
    setMsg(e.target.value);
    socket.emit('typing', { sessionId: session.id });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <Button onClick={() => navigate(`/resolve/${session.id}`)} className="px-4 py-2 text-sm">
          Mark Completed
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
        <img src={session.partner.avatar} className="w-14 h-14 rounded-full border border-border" alt="" />
        <div>
          <h2 className="text-xl font-bold">{session.partner.name}</h2>
          <p className="text-gray-500 text-sm">{session.skill} • {session.time}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-2 pb-4">
        {messages.map((m, i) => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-[20px] px-5 py-3 ${isMe ? 'bg-[#111111] text-white' : 'bg-gray-100 text-black border border-[#E5E5E5]'}`}>
                <p>{m.text}</p>
                <span className={`text-[11px] block mt-1 ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>{m.timestamp}</span>
              </div>
            </div>
          );
        })}
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-[#E5E5E5] rounded-[20px] px-5 py-3 flex gap-1 items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text" 
          value={msg}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full bg-white border border-border rounded-[24px] pl-6 pr-14 py-4 focus:outline-none focus:border-black transition-colors"
        />
        <button 
          onClick={handleSend}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-full hover:scale-105 transition-transform"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
