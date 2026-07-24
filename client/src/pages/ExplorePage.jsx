import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Compass, SlidersHorizontal, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import UserCard from '../components/UserCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import './ExplorePage.css';

export default function ExplorePage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const [category, setCategory] = useState('all');
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

  // Compute unique categories from the fetched teachers (who are offering these skills)
  const availableCategories = new Set();
  teachers.forEach(t => {
    (t.skills_offered || []).forEach(skill => {
      if (skill.category) {
        availableCategories.add(skill.category);
      }
    });
  });

  const categories = [
    { id: 'all', label: 'All Skills' },
    ...Array.from(availableCategories).map(cat => ({ id: cat, label: cat }))
  ];

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.skills_offered?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category matching based on actual categories in skills_offered
    const matchesCategory = category === 'all' || 
                            t.skills_offered?.some(s => s.category === category);
                            
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Explore' }]}
        title="Explore Teachers"
        description="Find skilled community members to learn from and grow your abilities."
      />

      <div className="explore-layout">
        
        {/* LEFT: Filters */}
        <aside className="explore-sidebar">
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">Search & Filters</h3>
              <SlidersHorizontal size={14} className="text-muted" />
            </div>
            <div className="card-body flex-col gap-lg">
              
              {/* Search is now in Navbar */}              <div className="form-group">
                <label className="form-label">Categories</label>
                <div className="flex-col gap-sm">
                  {categories.map(c => (
                    <button 
                      key={c.id}
                      className={`explore-category-btn ${category === c.id ? 'active' : ''}`}
                      onClick={() => setCategory(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        </aside>

        {/* RIGHT: Results */}
        <main className="explore-results">
          
          <div className="explore-results-header">
            <span className="text-muted" style={{fontSize: 'var(--font-sm)', fontWeight: 500}}>
              Showing {filteredTeachers.length} result{filteredTeachers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="explore-list">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 0, borderBottom: '1px solid var(--border-primary)' }} />
              ))}
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="explore-list">
              {filteredTeachers.map((teacher, i) => (
                <UserCard key={teacher._id || teacher.id || i} user={teacher} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Users}
              title="No teachers found"
              description="Try adjusting your search terms or selecting a different category."
              action={
                searchTerm || category !== 'all' 
                ? { label: 'Clear Filters', onClick: () => { navigate('/explore'); setCategory('all'); } }
                : null
              }
            />
          )}
          
        </main>
      </div>
    </div>
  );
}
