import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Users } from 'lucide-react';
import UserCard from '../components/UserCard';
import api from '../utils/api';
import './MatchPage.css';

export default function MatchPage() {
  const { skillId } = useParams();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating');
  const [skillName, setSkillName] = useState(skillId === 'all' ? 'All Skills' : skillId);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const url = skillId === 'all' ? '/users/teachers' : `/users/teachers?skill=${skillId}`;
        const res = await api.get(url);
        setTeachers(res.data.users || res.data || []);
        if (res.data.skillName) setSkillName(res.data.skillName);
      } catch {
        // Placeholder
        setTeachers([]);
      }
      setLoading(false);
    };
    fetchTeachers();
  }, [skillId]);

  const sorted = [...teachers].sort((a, b) => {
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === 'sessions') return (b.sessionsCompleted || 0) - (a.sessionsCompleted || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">
          Find a teacher for <span className="gradient-text">{skillName}</span>
        </h1>
        <p className="section-subtitle">Browse and connect with skilled teachers</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="match-filters"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="match-filter-group">
          <SlidersHorizontal size={16} />
          <span>Sort by:</span>
          <div className="filter-pills" style={{ gap: '6px' }}>
            {['rating', 'sessions', 'newest'].map((option) => (
              <button
                key={option}
                className={`filter-pill ${sortBy === option ? 'active' : ''}`}
                onClick={() => setSortBy(option)}
                style={{ padding: '6px 14px' }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <span className="match-count">{sorted.length} teacher{sorted.length !== 1 ? 's' : ''} found</span>
      </motion.div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="match-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="match-grid">
          {sorted.map((teacher, i) => (
            <UserCard key={teacher._id || i} user={teacher} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={56} />
          <h3>No teachers found</h3>
          <p>There are no teachers available for this skill yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
