import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock } from 'lucide-react';
import SkillBadge from './SkillBadge';
import { getInitials, truncateText } from '../utils/formatters';
import './UserCard.css';

export default function UserCard({ user, index = 0 }) {
  const navigate = useNavigate();

  if (!user) return null;

  const rating = user.averageRating || user.rating || 0;
  const sessionCount = user.sessionsCompleted || user.sessionCount || 0;
  const skills = user.skillsTeaching || user.skills || [];

  return (
    <motion.div
      className="user-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
      onClick={() => navigate(`/profile/${user._id}`)}
    >
      <div className="user-card-header">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="avatar avatar-lg" />
        ) : (
          <div className="avatar-fallback avatar-lg">{getInitials(user.name)}</div>
        )}
        <div className="user-card-info">
          <h3 className="user-card-name">{user.name}</h3>
          {user.bio && (
            <p className="user-card-bio">{truncateText(user.bio, 60)}</p>
          )}
        </div>
      </div>

      {skills.length > 0 && (
        <div className="user-card-skills">
          {skills.slice(0, 3).map((skill) => (
            <SkillBadge
              key={skill._id || skill.name}
              name={skill.name || skill}
              category={skill.category}
            />
          ))}
          {skills.length > 3 && (
            <span className="user-card-more">+{skills.length - 3}</span>
          )}
        </div>
      )}

      <div className="user-card-footer">
        <div className="user-card-stat">
          <Star size={14} className="star-filled" />
          <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
        </div>
        <div className="user-card-stat">
          <Clock size={14} />
          <span>{sessionCount} sessions</span>
        </div>
        <button
          className="gradient-btn btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/book/${user._id}`);
          }}
        >
          <span>Book</span>
        </button>
      </div>
    </motion.div>
  );
}
