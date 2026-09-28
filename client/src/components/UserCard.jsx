import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { getInitials } from '../utils/formatters';

export default function UserCard({ user, index }) {
  const navigate = useNavigate();

  const handleSelect = (e) => {
    e.stopPropagation();
    navigate(`/profile/${user._id || user.id}`);
  };

  const rating = user.averageRating ? Number(user.averageRating).toFixed(1) : '5.0';

  return (
    <motion.div
      className="user-grid-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleSelect}
    >
      <div className="user-grid-header">
        <div className="user-grid-avatar">
          {user.avatar ? (
            <img src={`http://localhost:5000${user.avatar}`} alt={user.name} className="avatar avatar-xl" style={{ borderRadius: '8px' }} />
          ) : (
            <div className="avatar-fallback avatar-xl" style={{ borderRadius: '8px' }}>{getInitials(user.name)}</div>
          )}
        </div>
        
        <div className="user-grid-info">
          <div className="user-grid-name-row">
            <h3 className="user-grid-name">{user.name}</h3>
            <div className="user-grid-rating">
              <Star size={12} className="text-warning fill-warning" style={{ fill: 'currentColor' }} />
              <span>{rating}/5.0</span>
            </div>
          </div>
          <p className="user-grid-dept text-muted truncate">
             {user.department || 'Professional Educator'}
          </p>
        </div>
      </div>

      <div className="user-grid-skills">
        {(user.skills_offered || []).slice(0, 4).map((s, idx) => (
          <span key={idx} className="badge badge-outline" style={{ fontSize: '11px', padding: '4px 8px' }}>
            {s.name}
          </span>
        ))}
      </div>

      <div className="user-grid-actions">
        <button className="btn-primary w-full" onClick={handleSelect}>
          Select Teacher
        </button>
      </div>
    </motion.div>
  );
}

