import { motion } from 'framer-motion';
import { formatRelativeTime } from '../utils/formatters';
import './ChatBubble.css';

export default function ChatBubble({ message, isMine }) {
  return (
    <motion.div
      className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}
      initial={{ opacity: 0, x: isMine ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className={`chat-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
        <p className="chat-bubble-text">{message.content}</p>
      </div>
      <span className="chat-bubble-time">
        {formatRelativeTime(message.createdAt)}
      </span>
    </motion.div>
  );
}
