import React from 'react';
import './TypingIndicator.css';

// Render this in SessionChatPage.jsx when `partnerIsTyping` is true
export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
}
