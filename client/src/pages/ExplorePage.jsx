import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Code, Globe, Music, Palette, Briefcase, ChefHat, Dumbbell, Zap, Layers } from 'lucide-react';
import api from '../utils/api';
import './ExplorePage.css';

const categories = [
  { name: 'All', icon: Layers },
  { name: 'Programming', icon: Code },
  { name: 'Languages', icon: Globe },
  { name: 'Music', icon: Music },
  { name: 'Art & Design', icon: Palette },
  { name: 'Business', icon: Briefcase },
  { name: 'Cooking', icon: ChefHat },
  { name: 'Fitness', icon: Dumbbell },
  { name: 'Technology', icon: Zap },
];

const placeholderSkills = [
  { _id: '1', name: 'JavaScript', category: 'Programming', teacherCount: 24 },
  { _id: '2', name: 'Python', category: 'Programming', teacherCount: 19 },
  { _id: '3', name: 'React', category: 'Programming', teacherCount: 16 },
  { _id: '4', name: 'Spanish', category: 'Languages', teacherCount: 12 },
  { _id: '5', name: 'French', category: 'Languages', teacherCount: 8 },
  { _id: '6', name: 'Guitar', category: 'Music', teacherCount: 11 },
  { _id: '7', name: 'Piano', category: 'Music', teacherCount: 9 },
  { _id: '8', name: 'Photography', category: 'Art & Design', teacherCount: 7 },
  { _id: '9', name: 'UI/UX Design', category: 'Art & Design', teacherCount: 14 },
  { _id: '10', name: 'Marketing', category: 'Business', teacherCount: 6 },
  { _id: '11', name: 'Cooking', category: 'Cooking', teacherCount: 10 },
  { _id: '12', name: 'Yoga', category: 'Fitness', teacherCount: 5 },
  { _id: '13', name: 'Node.js', category: 'Programming', teacherCount: 13 },
  { _id: '14', name: 'Mandarin', category: 'Languages', teacherCount: 7 },
  { _id: '15', name: 'Graphic Design', category: 'Art & Design', teacherCount: 11 },
  { _id: '16', name: 'Music Production', category: 'Music', teacherCount: 4 },
];

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [skills, setSkills] = useState(placeholderSkills);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/skills');
        if (res.data?.length > 0) {
          setSkills(res.data);
        }
      } catch {
        // Use placeholder skills
      }
    };
    fetchSkills();
  }, []);

  const filtered = skills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || skill.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">
          Explore <span className="gradient-text">Skills</span>
        </h1>
        <p className="section-subtitle">Discover skills and find the perfect teacher</p>
      </motion.div>

      {/* Search */}
      <motion.div
        className="explore-search"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Search size={20} className="explore-search-icon" />
        <input
          type="text"
          className="input-field explore-search-input"
          placeholder="Search for skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      {/* Category Filter */}
      <motion.div
        className="filter-pills"
        style={{ marginBottom: 'var(--space-xl)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              className={`filter-pill ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              <Icon size={14} style={{ marginRight: 4 }} />
              {cat.name}
            </button>
          );
        })}
      </motion.div>

      {/* Skills Grid */}
      {filtered.length > 0 ? (
        <div className="explore-grid">
          {filtered.map((skill, i) => (
            <motion.div
              key={skill._id || skill.name}
              className="explore-skill-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/match/${skill._id || skill.name}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="explore-skill-category">{skill.category}</div>
              <h3 className="explore-skill-name">{skill.name}</h3>
              <p className="explore-skill-teachers">{skill.teacherCount || 0} teachers available</p>
              <button className="gradient-btn btn-sm" style={{ width: '100%', marginTop: 'auto' }}>
                <span>Find Teachers</span>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={48} />
          <h3>No skills found</h3>
          <p>Try a different search term or category</p>
        </div>
      )}
    </div>
  );
}
