import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Users, ChevronDown } from 'lucide-react';
import UserCard from '../components/UserCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../utils/api';
import './MatchPage.css';

export default function MatchPage() {
  const { skillId } = useParams();
  const navigate = useNavigate();
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
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [skillId]);

  const sorted = [...teachers].sort((a, b) => {
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === 'sessions') return (b.sessionsCompleted || 0) - (a.sessionsCompleted || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Matches' }]}
        title={skillId === 'all' ? 'Find a Match' : `Matches for ${skillName}`}
        description="Browse and connect with skilled teachers based on your interests."
      />

      {/* Filters Bar */}
      <div className="card mb-xl">
        <div className="card-body" style={{padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'}}>
          <div className="flex items-center gap-sm">
            <SlidersHorizontal size={16} className="text-muted" />
            <span className="text-secondary text-sm font-medium">Sort by:</span>
            <div className="tabs" style={{borderBottom: 'none'}}>
              {['rating', 'sessions', 'newest'].map((option) => (
                <button
                  key={option}
                  className={`tab ${sortBy === option ? 'active' : ''}`}
                  onClick={() => setSortBy(option)}
                  style={{padding: '4px 12px', fontSize: 'var(--font-xs)'}}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <span className="text-muted text-sm font-medium">
            {sorted.length} teacher{sorted.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="match-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="match-grid">
          {sorted.map((teacher, i) => (
            <UserCard key={teacher._id || teacher.id || i} user={teacher} index={i} />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{padding: 0}}>
             <EmptyState 
               icon={Users}
               title="No teachers found"
               description="There are no teachers available for this skill yet. Check back soon!"
               action={{ label: 'Explore All Skills', to: '/explore' }}
             />
          </div>
        </div>
      )}
    </div>
  );
}
