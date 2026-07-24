import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Shield, ArrowRight } from 'lucide-react';
import { getInitials } from '../utils/formatters';

export default function UserCard({ user, index }) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="user-list-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/profile/${user._id || user.id}`)}
    >
      <div className="user-item-avatar" style={{ position: 'relative' }}>
        {user.avatar ? (
          <img src={`http://localhost:5000${user.avatar}`} alt={user.name} className="avatar avatar-xl" />
        ) : (
          <div className="avatar-fallback avatar-xl">{getInitials(user.name)}</div>
        )}
        {user.averageRating && user.averageRating > 4.5 && (
          <div 
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--bg-card)', borderRadius: '50%', padding: '2px'
            }}
          >
            <div style={{
              background: 'var(--warning)', color: '#fff', 
              width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Star size={8} fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      <div className="user-item-info">
        <h3 className="user-item-name">{user.name}</h3>
        <p className="user-item-bio text-muted text-sm truncate">{user.bio || 'Experienced professional ready to share skills.'}</p>
      </div>

      <div className="user-item-skills">
        {(user.skills_offered || []).slice(0, 3).map((s, idx) => (
          <span key={idx} className="badge badge-default" style={{ fontSize: '11px', padding: '4px 8px' }}>
            {s.name}
          </span>
        ))}
        {(user.skills_offered?.length > 3) && (
          <span className="badge badge-default" style={{ fontSize: '11px', padding: '4px 8px' }}>+{user.skills_offered.length - 3}</span>
        )}
      </div>

      <div className="user-item-stats">
        <div className="stat-pill">
          <Star size={14} className="text-warning" />
          <span>{user.averageRating ? Number(user.averageRating).toFixed(1) : 'New'}</span>
        </div>
        <div className="stat-pill">
          <Shield size={14} className="text-info" />
          <span>{user.sessionsCompleted || 0} Sessions</span>
        </div>
      </div>
      
      <div className="user-item-action">
        <ArrowRight size={18} className="text-muted" />
      </div>
    </motion.div>
  );
}
