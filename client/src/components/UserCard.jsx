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
<<<<<<< Updated upstream
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
=======
      <div className="user-item-avatar-wrapper">
        <div style={{ position: 'relative' }}>
          {user.avatar ? (
            <img src={`http://localhost:5000${user.avatar}`} alt={user.name} className="avatar avatar-xl" style={{ width: 72, height: 72 }} />
          ) : (
            <div className="avatar-fallback avatar-xl" style={{ width: 72, height: 72, fontSize: '1.4rem' }}>
              {getInitials(user.name)}
            </div>
          )}
          {user.averageRating && user.averageRating > 4.5 && (
            <div 
              style={{
                position: 'absolute', bottom: 2, right: 2,
                background: 'var(--bg-card)', borderRadius: '50%', padding: '2px'
              }}
            >
              <div style={{
                background: 'var(--warning)', color: '#fff', 
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Star size={10} fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="user-item-info">
        <h3 className="user-item-name">{user.name}</h3>
        <p className="user-item-bio text-muted text-sm">{user.bio || 'Experienced professional ready to share skills and collaborate.'}</p>
      </div>

      <div className="user-item-skills">
        {(user.skills_offered || []).slice(0, 3).map((s, idx) => (
          <span key={idx} className="badge badge-default" style={{ fontSize: '11px', padding: '4px 8px' }}>
            {s.name}
          </span>
        ))}
        {(user.skills_offered?.length > 3) && (
          <span className="badge badge-default" style={{ fontSize: '11px', padding: '4px 8px' }}>
            +{user.skills_offered.length - 3}
          </span>
        )}
        {(!user.skills_offered || user.skills_offered.length === 0) && (
          <span className="text-muted text-xs" style={{ fontStyle: 'italic' }}>No courses listed yet</span>
        )}
      </div>

      <div className="user-item-stats">
        <div className="stat-pill">
          <Star size={14} className="text-warning" fill="currentColor" />
          <span>{user.averageRating ? Number(user.averageRating).toFixed(1) : 'New'}</span>
        </div>
        <div className="stat-pill">
          <Shield size={14} className="text-info" />
          <span>{user.sessionsCompleted || 0} Sessions</span>
        </div>
      </div>
      
      <div className="user-item-action-btn">
        <span>View Profile</span>
        <ArrowRight size={14} />
>>>>>>> Stashed changes
      </div>
    </motion.div>
  );
}

