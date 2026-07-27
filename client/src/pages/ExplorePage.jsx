import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import UserCard from '../components/UserCard';
import EmptyState from '../components/EmptyState';
import './ExplorePage.css';

export default function ExplorePage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState('rating');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get('/users/teachers');
        setTeachers(res.data.users || res.data || []);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.skills_offered?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          t.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sorted = [...filteredTeachers].sort((a, b) => {
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === 'sessions') return (b.sessionsCompleted || 0) - (a.sessionsCompleted || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="page-container fade-in">
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          {searchTerm ? `Search results for '${searchTerm}'` : 'Explore Teachers'}
        </h1>
        <p className="text-muted" style={{ fontSize: '15px' }}>
          Showing {sorted.length} professional educator{sorted.length !== 1 ? 's' : ''} matching your criteria.
        </p>
      </div>

      <div className="explore-layout">
        
        {/* Main Content Area */}
        <main className="explore-results" style={{ width: '100%' }}>
          
          <div className="card mb-xl" style={{ marginBottom: '24px', background: 'var(--bg-elevated)' }}>
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
            </div>
          </div>

          {loading ? (
            <div className="explore-list">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div className="explore-list">
              {sorted.map((teacher, i) => (
                <UserCard key={teacher._id || teacher.id || i} user={teacher} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Users}
              title="No teachers found"
              description="Try adjusting your search terms to find more educators."
              action={
                searchTerm
                ? { label: 'Clear Search', onClick: () => navigate('/explore') }
                : null
              }
            />
          )}

          {/* Static Pagination (Visual Stub) */}
          {sorted.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '8px' }}>
              <button className="btn-icon" disabled><ChevronLeft size={16} /></button>
              <button className="btn-icon" style={{ background: 'var(--accent)', color: '#fff' }}>1</button>
              <button className="btn-icon">2</button>
              <button className="btn-icon">3</button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--text-muted)' }}>...</span>
              <button className="btn-icon">6</button>
              <button className="btn-icon"><ChevronRight size={16} /></button>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
}
