import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { SlidersHorizontal, Users, ChevronLeft, ChevronRight } from 'lucide-react';
=======
import { Search, Compass, SlidersHorizontal, Users, X, BookOpen, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
>>>>>>> Stashed changes
import api from '../utils/api';
import UserCard from '../components/UserCard';
import EmptyState from '../components/EmptyState';
import './ExplorePage.css';

export default function ExplorePage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
<<<<<<< Updated upstream
  const [sortBy, setSortBy] = useState('rating');
=======
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  // Compute unique available courses registered from teachers willing to teach
  const availableCoursesSet = new Set();
  teachers.forEach(t => {
    (t.skills_offered || []).forEach(skill => {
      if (skill && skill.name) {
        availableCoursesSet.add(skill.name.trim());
      }
    });
  });
  const availableCourses = Array.from(availableCoursesSet).sort();

  const getCourseTeacherCount = (courseName) => {
    if (courseName === 'all') return teachers.length;
    return teachers.filter(t => t.skills_offered?.some(s => s.name.trim().toLowerCase() === courseName.toLowerCase())).length;
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.skills_offered?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (t.bio && t.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = selectedCourse === 'all' || 
                          t.skills_offered?.some(s => s.name.trim().toLowerCase() === selectedCourse.toLowerCase());
                            
    return matchesSearch && matchesCourse;
>>>>>>> Stashed changes
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
        
<<<<<<< Updated upstream
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
=======
        {/* LEFT: Filters */}
        <aside className="explore-sidebar">
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">Search & Filters</h3>
              <SlidersHorizontal size={16} className="text-muted" />
            </div>
            <div className="card-body flex-col gap-md">
              
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider font-semibold text-muted">Keyword Search</label>
                <div className="explore-search-input-wrapper">
                  <Search size={16} className="explore-search-icon" />
                  <input
                    type="text"
                    className="explore-search-input"
                    placeholder="Search courses or teachers..."
                    value={searchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSearchParams({ q: val });
                      } else {
                        setSearchParams({});
                      }
                    }}
                  />
                  {searchTerm && (
                    <button 
                      type="button" 
                      className="explore-search-clear" 
                      onClick={() => setSearchParams({})}
                      title="Clear search"
                    >
                      <X size={14} />
>>>>>>> Stashed changes
                    </button>
                  )}
                </div>
              </div>
<<<<<<< Updated upstream
            </div>
          </div>
=======

              <div className="explore-divider" />

              <div className="form-group">
                <button
                  type="button"
                  className={`courses-accordion-toggle ${isCoursesOpen ? 'open' : ''}`}
                  onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} className="text-accent" />
                    <span>Available Courses</span>
                  </div>
                  <ChevronDown size={18} className="accordion-icon" />
                </button>

                {isCoursesOpen && (
                  <motion.div 
                    className="courses-accordion-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      type="button"
                      className={`course-item-btn ${selectedCourse === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCourse('all')}
                    >
                      <span>All Courses</span>
                      <span className="course-item-count">{getCourseTeacherCount('all')}</span>
                    </button>

                    {availableCourses.map((course, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`course-item-btn ${selectedCourse === course ? 'active' : ''}`}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course}</span>
                        <span className="course-item-count">{getCourseTeacherCount(course)}</span>
                      </button>
                    ))}

                    {availableCourses.length === 0 && !loading && (
                      <p className="text-muted text-xs p-sm text-center">No courses registered yet</p>
                    )}
                  </motion.div>
                )}
              </div>
              
            </div>
          </div>
        </aside>

        {/* RIGHT: Results */}
        <main className="explore-results">
          <div className="card-header explore-top-header">
            <h3 className="card-header-title">Teachers Directory</h3>
            <span className="text-muted text-sm font-medium">
              Showing {filteredTeachers.length} result{filteredTeachers.length !== 1 ? 's' : ''}
            </span>
          </div>
>>>>>>> Stashed changes

          {loading ? (
            <div className="explore-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
<<<<<<< Updated upstream
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div className="explore-list">
              {sorted.map((teacher, i) => (
=======
                <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="explore-grid">
              {filteredTeachers.map((teacher, i) => (
>>>>>>> Stashed changes
                <UserCard key={teacher._id || teacher.id || i} user={teacher} index={i} />
              ))}
            </div>
          ) : (
<<<<<<< Updated upstream
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
          
=======
            <div className="card" style={{ marginTop: 'var(--space-md)' }}>
              <div className="card-body" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState 
                  icon={Users}
                  title="No teachers found"
                  description="Try adjusting your search terms or selecting a different course."
                  action={
                    searchTerm || selectedCourse !== 'all' 
                    ? { label: 'Clear Filters', onClick: () => { navigate('/explore'); setSelectedCourse('all'); } }
                    : null
                  }
                />
              </div>
            </div>
          )}
>>>>>>> Stashed changes
        </main>
      </div>
    </div>
  );
}
